/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import schema from "./schema";
import { internal } from "./_generated/api";
import { refreshCycle, staySources } from "./lib/staySources";

const modules = import.meta.glob(["./**/*.{ts,js}", "!./**/*.test.ts"]);
const slug = "pamusha-lodge-victoria-falls";
const cycle = () => refreshCycle(Date.now());
const setup = async () => {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.run, {});
  return t;
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-11T12:00:00Z"));
  vi.stubEnv("SCRAPE_API_TOKEN", "fixture-not-a-real-token");
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("source refresh pipeline", () => {
  it("does not queue anything when the token is missing", async () => {
    vi.stubEnv("SCRAPE_API_TOKEN", "");
    const t = await setup();
    expect(await t.mutation(internal.stayRefresh.queue, {})).toEqual({
      scheduled: 0,
      reason: "missing_token",
    });
    expect(
      await t.run((ctx) =>
        ctx.db.system.query("_scheduled_functions").take(20),
      ),
    ).toHaveLength(0);
  });
  it("caps requests at 13 and queues at most once per calendar half-month", async () => {
    const t = await setup();
    expect((await t.mutation(internal.stayRefresh.queue, {})).scheduled).toBe(
      13,
    );
    expect((await t.mutation(internal.stayRefresh.queue, {})).scheduled).toBe(
      0,
    );
    expect(
      await t.run((ctx) =>
        ctx.db.system.query("_scheduled_functions").take(30),
      ),
    ).toHaveLength(13);
    expect(
      staySources.some((source) => source.slug === "hwange-elephant-camp"),
    ).toBe(false);
  });
  it("skips real operators and rechecks ownership before committing", async () => {
    const t = await setup();
    await t.mutation(internal.stayRefresh.queue, {});
    expect(
      await t.mutation(internal.stayRefresh.beginAttempt, {
        slug,
        cycle: cycle(),
      }),
    ).toBe(true);
    await t.run(async (ctx) => {
      const property = await ctx.db
        .query("properties")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      const operator = await ctx.db.get("operators", property!.operatorId);
      await ctx.db.patch("users", operator!.ownerUserId, {
        tokenIdentifier: "real|operator",
      });
    });
    expect(
      await t.mutation(internal.stayRefresh.commit, {
        slug,
        cycle: cycle(),
        data: { name: "Changed" },
      }),
    ).toBe(false);
    vi.setSystemTime(new Date("2026-11-16T12:00:00Z"));
    expect((await t.mutation(internal.stayRefresh.queue, {})).scheduled).toBe(
      9,
    );
  });
  it("claims an attempt once and keeps native prices, reviews and bookings unchanged", async () => {
    const t = await setup();
    const before = await t.run(async (ctx) => ({
      properties: await ctx.db.query("properties").take(30),
      bookings: await ctx.db.query("bookings").take(20),
      reviews: await ctx.db.query("reviews").take(100),
    }));
    await t.mutation(internal.stayRefresh.queue, {});
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          "<h1>Pamusha Lodge</h1><a href='tel:+263832844367'>Call</a>",
          { headers: { "content-type": "text/html" } },
        ),
      );
    vi.stubGlobal("fetch", fetch);
    expect(
      (
        await t.action(internal.stayRefresh.refreshOne, {
          slug,
          cycle: cycle(),
        })
      ).refreshed,
    ).toBe(true);
    expect(
      (
        await t.action(internal.stayRefresh.refreshOne, {
          slug,
          cycle: cycle(),
        })
      ).refreshed,
    ).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
    const after = await t.run(async (ctx) => ({
      properties: await ctx.db.query("properties").take(30),
      bookings: await ctx.db.query("bookings").take(20),
      reviews: await ctx.db.query("reviews").take(100),
    }));
    const native = (properties: typeof before.properties) =>
      properties.map((property) =>
        Object.fromEntries(
          Object.entries(property).filter(([key]) => key !== "sourceInfo"),
        ),
      );
    expect(native(after.properties)).toEqual(native(before.properties));
    expect(after.bookings).toEqual(before.bookings);
    expect(after.reviews).toEqual(before.reviews);
  });
  it("preserves prior fields and per-field dates on partial refresh and failure", async () => {
    const t = await setup();
    await t.mutation(internal.stayRefresh.queue, {});
    await t.mutation(internal.stayRefresh.beginAttempt, {
      slug,
      cycle: cycle(),
    });
    await t.mutation(internal.stayRefresh.commit, {
      slug,
      cycle: cycle(),
      data: { name: "Pamusha Lodge", phone: "+263832844367" },
    });
    const initial = await t.run((ctx) =>
      ctx.db
        .query("properties")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique(),
    );
    vi.setSystemTime(new Date("2026-11-16T12:00:00Z"));
    await t.mutation(internal.stayRefresh.queue, {});
    await t.mutation(internal.stayRefresh.beginAttempt, {
      slug,
      cycle: cycle(),
    });
    await t.mutation(internal.stayRefresh.commit, {
      slug,
      cycle: cycle(),
      data: { name: "Pamusha" },
    });
    const partial = await t.run((ctx) =>
      ctx.db
        .query("properties")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique(),
    );
    expect(partial?.sourceInfo?.data.phone).toBe("+263832844367");
    expect(partial?.sourceInfo?.provenance.phone).toEqual(
      initial?.sourceInfo?.provenance.phone,
    );
    expect(partial?.sourceInfo?.provenance.name.checkedAt).toBeGreaterThan(
      initial!.sourceInfo!.provenance.name.checkedAt,
    );
    vi.setSystemTime(new Date("2026-12-02T12:00:00Z"));
    await t.mutation(internal.stayRefresh.queue, {});
    await t.mutation(internal.stayRefresh.beginAttempt, {
      slug,
      cycle: cycle(),
    });
    await t.mutation(internal.stayRefresh.commit, {
      slug,
      cycle: cycle(),
      error: "unsafe untrusted error details",
    });
    const failed = await t.run((ctx) =>
      ctx.db
        .query("properties")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique(),
    );
    expect(failed?.sourceInfo?.data).toEqual(partial?.sourceInfo?.data);
    expect(failed?.sourceInfo?.error).toBe("parse_failed");
    expect(failed?.sourceInfo?.status).toBe("error");
  });
  it("rejects arbitrary slugs without making network requests", async () => {
    const t = await setup();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(
      (
        await t.action(internal.stayRefresh.refreshOne, {
          slug: "unconfigured",
          cycle: cycle(),
        })
      ).reason,
    ).toBe("unconfigured_source");
    expect(fetch).not.toHaveBeenCalled();
  });
});
