import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  env,
  internalAction,
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { extractStay } from "./lib/extractStay";
import { fetchStayHtml, ScrapeError } from "./lib/scrapeDo";
import { sourceDataValidator, type SourceData } from "./lib/staySourceSchema";
import {
  getStaySource,
  MAX_SOURCES_PER_CYCLE,
  refreshCycle,
  staySources,
} from "./lib/staySources";

async function ownedSeed(ctx: QueryCtx | MutationCtx, slug: string) {
  const source = getStaySource(slug);
  if (!source) return null;
  const property = await ctx.db
    .query("properties")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (!property) return null;
  const operator = await ctx.db.get("operators", property.operatorId);
  if (!operator || operator.status !== "active") return null;
  const owner = await ctx.db.get("users", operator.ownerUserId);
  return owner?.tokenIdentifier === `seed|${source.ownerKey}` ? property : null;
}

export const queue = internalMutation({
  args: {},
  returns: v.object({ scheduled: v.number(), reason: v.string() }),
  handler: async (ctx) => {
    if (!env.SCRAPE_API_TOKEN?.trim())
      return { scheduled: 0, reason: "missing_token" };
    const cycle = refreshCycle(Date.now());
    let scheduled = 0;
    for (const source of staySources.slice(0, MAX_SOURCES_PER_CYCLE)) {
      const property = await ownedSeed(ctx, source.slug);
      if (!property || property.sourceInfo?.cycle === cycle) continue;
      const previous = property.sourceInfo;
      await ctx.db.patch("properties", property._id, {
        sourceInfo: {
          ...(previous ?? {}),
          url: source.url,
          provider: source.provider,
          cycle,
          status: "queued",
          data: previous?.data ?? {},
          provenance: previous?.provenance ?? {},
        },
      });
      await ctx.scheduler.runAfter(
        scheduled * 45_000,
        internal.stayRefresh.refreshOne,
        {
          slug: source.slug,
          cycle,
        },
      );
      scheduled += 1;
    }
    return {
      scheduled,
      reason: scheduled ? "queued" : "already_queued_or_ineligible",
    };
  },
});

export const configuration = internalQuery({
  args: {},
  returns: v.object({
    tokenConfigured: v.boolean(),
    maxRequestsPerCycle: v.number(),
    schedule: v.string(),
  }),
  handler: async () => ({
    tokenConfigured: Boolean(env.SCRAPE_API_TOKEN?.trim()),
    maxRequestsPerCycle: MAX_SOURCES_PER_CYCLE,
    schedule: "05:00 UTC on the 1st and 15th of each month",
  }),
});

export const beginAttempt = internalMutation({
  args: { slug: v.string(), cycle: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    const property = await ownedSeed(ctx, args.slug);
    const info = property?.sourceInfo;
    if (
      !property ||
      !info ||
      info.cycle !== args.cycle ||
      info.status !== "queued" ||
      info.attemptedCycle === args.cycle
    )
      return false;
    await ctx.db.patch("properties", property._id, {
      sourceInfo: {
        ...info,
        status: "running",
        attemptedCycle: args.cycle,
        lastAttemptAt: Date.now(),
      },
    });
    return true;
  },
});

const fieldNames: Array<keyof SourceData> = [
  "name",
  "address",
  "geo",
  "hours",
  "phone",
  "website",
  "rating",
  "reviews",
  "pricing",
  "photos",
];

export const commit = internalMutation({
  args: {
    slug: v.string(),
    cycle: v.string(),
    data: v.optional(sourceDataValidator),
    error: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const property = await ownedSeed(ctx, args.slug);
    const info = property?.sourceInfo;
    if (
      !property ||
      !info ||
      info.cycle !== args.cycle ||
      info.status !== "running"
    )
      return false;
    if (!args.data) {
      // Only known error codes leave the action. Never persist provider bodies/URLs.
      const safeError =
        args.error &&
        /^(?:missing_token|network_or_timeout|response_too_large|empty_response|not_html|property_mismatch|no_property_data|parse_failed|http_\d{3})$/.test(
          args.error,
        )
          ? args.error
          : "parse_failed";
      await ctx.db.patch("properties", property._id, {
        sourceInfo: { ...info, status: "error", error: safeError },
      });
      return true;
    }
    const entries = Object.entries(args.data).filter(
      ([, value]) =>
        value !== undefined && (!Array.isArray(value) || value.length > 0),
    );
    const data = Object.fromEntries(entries) as SourceData;
    const now = Date.now();
    const provenance = { ...info.provenance };
    for (const [field] of entries)
      provenance[field] = { url: info.url, checkedAt: now };
    // This snapshot is deliberately separate from operator and booking fields.
    await ctx.db.patch("properties", property._id, {
      sourceInfo: {
        ...info,
        data: { ...info.data, ...data },
        provenance,
        status: fieldNames.every((field) => data[field] !== undefined)
          ? "success"
          : "partial",
        lastSuccessAt: now,
        error: undefined,
      },
    });
    return true;
  },
});

export const refreshOne = internalAction({
  args: { slug: v.string(), cycle: v.string() },
  returns: v.object({ refreshed: v.boolean(), reason: v.string() }),
  handler: async (
    ctx,
    args,
  ): Promise<{ refreshed: boolean; reason: string }> => {
    const source = getStaySource(args.slug);
    if (!source) return { refreshed: false, reason: "unconfigured_source" };
    const claimed: boolean = await ctx.runMutation(
      internal.stayRefresh.beginAttempt,
      args,
    );
    if (!claimed)
      return { refreshed: false, reason: "already_attempted_or_ineligible" };
    const token = env.SCRAPE_API_TOKEN;
    if (!token?.trim()) {
      await ctx.runMutation(internal.stayRefresh.commit, {
        ...args,
        error: "missing_token",
      });
      return { refreshed: false, reason: "missing_token" };
    }
    try {
      const html = await fetchStayHtml(source, token);
      let data: SourceData;
      try {
        data = extractStay(html, source);
      } catch (error) {
        const code =
          error instanceof Error &&
          [
            "property_mismatch",
            "no_property_data",
            "response_too_large",
          ].includes(error.message)
            ? error.message
            : "parse_failed";
        throw new ScrapeError(code);
      }
      const saved: boolean = await ctx.runMutation(
        internal.stayRefresh.commit,
        { ...args, data },
      );
      return {
        refreshed: saved,
        reason: saved ? "saved" : "no_longer_eligible",
      };
    } catch (error) {
      const code =
        error instanceof ScrapeError ? error.message : "parse_failed";
      await ctx.runMutation(internal.stayRefresh.commit, {
        ...args,
        error: code,
      });
      return { refreshed: false, reason: code };
    }
  },
});

export const coverage = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      slug: v.string(),
      status: v.string(),
      fields: v.array(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const result = [];
    for (const source of staySources.slice(0, MAX_SOURCES_PER_CYCLE)) {
      const property: Doc<"properties"> | null = await ownedSeed(
        ctx,
        source.slug,
      );
      result.push({
        slug: source.slug,
        status: property?.sourceInfo?.status ?? "not_refreshed",
        fields: Object.keys(property?.sourceInfo?.data ?? {}),
      });
    }
    return result;
  },
});
