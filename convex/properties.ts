import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  propertyStatusValidator,
  propertyTypeValidator,
} from "./schema";
import {
  getViewer,
  requireAdmin,
  requireOperator,
  requireViewer,
} from "./lib/auth";
import { slugify } from "./lib/slug";
import { dateRange } from "./lib/dates";
import { cheapestPlan, getStayQuote } from "./lib/stay";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80";

type DbCtx = QueryCtx | MutationCtx;

async function enrich(ctx: DbCtx, properties: Doc<"properties">[]) {
  const operatorIds = Array.from(
    new Set(properties.map((property) => property.operatorId)),
  );
  const operators = await Promise.all(
    operatorIds.map((id) => ctx.db.get(id)),
  );
  const byId = new Map(
    operators
      .filter((operator: Doc<"operators"> | null): operator is Doc<"operators"> =>
        Boolean(operator),
      )
      .map((operator: Doc<"operators">) => [operator._id, operator]),
  );

  return properties.map((property) => {
    const operator = byId.get(property.operatorId);
    return {
      ...property,
      operatorName: operator?.businessName ?? "Tsvaga partner",
      operatorVerified: operator?.verificationStatus === "verified",
    };
  });
}

export const featured = query({
  args: {},
  handler: async (ctx) => {
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_status_and_featured", (q) =>
        q.eq("status", "published").eq("featured", true),
      )
      .take(6);
    return await enrich(ctx, properties);
  },
});

export const search = query({
  args: {
    q: v.optional(v.string()),
    city: v.optional(v.string()),
    propertyType: v.optional(propertyTypeValidator),
    guests: v.optional(v.number()),
    checkIn: v.optional(v.string()),
    checkOut: v.optional(v.string()),
    minPriceCents: v.optional(v.number()),
    maxPriceCents: v.optional(v.number()),
    instantBook: v.optional(v.boolean()),
    amenities: v.optional(v.array(v.string())),
    sort: v.optional(
      v.union(
        v.literal("recommended"),
        v.literal("price_asc"),
        v.literal("price_desc"),
        v.literal("rating"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 12, 1), 24);
    const text = args.q?.trim();
    let candidates: Doc<"properties">[];

    if (text) {
      candidates = await ctx.db
        .query("properties")
        .withSearchIndex("search_text", (q) =>
          q.search("searchText", text).eq("status", "published"),
        )
        .take(60);
    } else if (args.city) {
      candidates = await ctx.db
        .query("properties")
        .withIndex("by_city_and_status", (q) =>
          q.eq("city", args.city!).eq("status", "published"),
        )
        .take(60);
    } else {
      candidates = await ctx.db
        .query("properties")
        .withIndex("by_status_and_featured", (q) =>
          q.eq("status", "published"),
        )
        .take(60);
    }

    const hasDates = Boolean(args.checkIn && args.checkOut);
    const results: Array<
      Awaited<ReturnType<typeof enrich>>[number] & {
        livePriceFromCents: number;
        liveTotalCents: number | null;
        availableUnits: number;
      }
    > = [];

    for (const property of candidates) {
      if (args.propertyType && property.propertyType !== args.propertyType) {
        continue;
      }
      if (args.instantBook && !property.instantBook) continue;
      if (
        args.amenities &&
        args.amenities.length > 0 &&
        !args.amenities.every((amenity) => property.amenities.includes(amenity))
      ) {
        continue;
      }

      const units = await ctx.db
        .query("units")
        .withIndex("by_property", (q) => q.eq("propertyId", property._id))
        .take(10);

      let livePriceFromCents = property.priceFromCents;
      let liveTotalCents: number | null = null;
      let availableUnits = 0;

      for (const unit of units) {
        if (unit.status !== "active") continue;
        if (args.guests && unit.capacityAdults < args.guests) continue;

        const plan = await cheapestPlan(ctx, unit._id);
        if (!plan) continue;

        if (hasDates) {
          const quote = await getStayQuote(
            ctx,
            unit,
            plan,
            args.checkIn!,
            args.checkOut!,
          );
          if (quote.available) {
            availableUnits += 1;
            const nightly = quote.nightlyTotalCents;
            const total = quote.totalCents;
            if (
              liveTotalCents === null ||
              total < liveTotalCents ||
              nightly < livePriceFromCents
            ) {
              livePriceFromCents = nightly;
              liveTotalCents = total;
            }
          }
        } else {
          availableUnits += 1;
          if (plan.priceCents < livePriceFromCents) {
            livePriceFromCents = plan.priceCents;
          }
        }
      }

      if (hasDates && availableUnits === 0) continue;
      if (args.guests && availableUnits === 0) continue;
      if (livePriceFromCents < (args.minPriceCents ?? 0)) continue;
      if (livePriceFromCents > (args.maxPriceCents ?? Number.MAX_SAFE_INTEGER)) {
        continue;
      }

      results.push({
        ...property,
        operatorName: "",
        operatorVerified: false,
        livePriceFromCents,
        liveTotalCents,
        availableUnits,
      });
    }

    const sort = args.sort ?? "recommended";
    results.sort((a, b) => {
      if (sort === "price_asc") return a.livePriceFromCents - b.livePriceFromCents;
      if (sort === "price_desc") return b.livePriceFromCents - a.livePriceFromCents;
      if (sort === "rating") return b.ratingAvg - a.ratingAvg;
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (b.ratingAvg !== a.ratingAvg) return b.ratingAvg - a.ratingAvg;
      return b.reviewCount - a.reviewCount;
    });

    const sliced = results.slice(0, limit);
    const enriched = await enrich(ctx, sliced);

    return {
      count: results.length,
      results: enriched.map((property, index) => ({
        ...property,
        livePriceFromCents: sliced[index].livePriceFromCents,
        liveTotalCents: sliced[index].liveTotalCents,
        availableUnits: sliced[index].availableUnits,
      })),
    };
  },
});

export const getDetail = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const property = await ctx.db
      .query("properties")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!property) return null;

    const operator = await ctx.db.get(property.operatorId);
    const units = await ctx.db
      .query("units")
      .withIndex("by_property", (q) => q.eq("propertyId", property._id))
      .take(10);

    const unitsWithPlans = await Promise.all(
      units
        .filter((unit) => unit.status === "active")
        .map(async (unit) => {
          const plans = await ctx.db
            .query("ratePlans")
            .withIndex("by_unit", (q) => q.eq("unitId", unit._id))
            .take(10);
          return {
            ...unit,
            ratePlans: plans.filter((plan) => plan.active),
          };
        }),
    );

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_property", (q) => q.eq("propertyId", property._id))
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(8);

    const viewer = await getViewer(ctx);
    let isFavorite = false;
    if (viewer) {
      const favorite = await ctx.db
        .query("favorites")
        .withIndex("by_user_and_property", (q) =>
          q.eq("userId", viewer._id).eq("propertyId", property._id),
        )
        .unique();
      isFavorite = Boolean(favorite);
    }

    return {
      property,
      operator,
      units: unitsWithPlans,
      reviews,
      isFavorite,
    };
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return null;

    const operator = await ctx.db
      .query("operators")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", viewer._id))
      .first();
    if (!operator) return { operator: null, properties: [] };

    const properties = await ctx.db
      .query("properties")
      .withIndex("by_operator", (q) => q.eq("operatorId", operator._id))
      .order("desc")
      .take(50);

    const withUnits = await Promise.all(
      properties.map(async (property) => {
        const units = await ctx.db
          .query("units")
          .withIndex("by_property", (q) => q.eq("propertyId", property._id))
          .take(10);
        const unitsWithPlans = await Promise.all(
          units.map(async (unit) => {
            const plans = await ctx.db
              .query("ratePlans")
              .withIndex("by_unit", (q) => q.eq("unitId", unit._id))
              .take(10);
            return { ...unit, ratePlans: plans };
          }),
        );
        return { ...property, units: unitsWithPlans };
      }),
    );

    return { operator, properties: withUnits };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    summary: v.string(),
    description: v.string(),
    propertyType: propertyTypeValidator,
    city: v.string(),
    region: v.string(),
    address: v.string(),
    amenities: v.array(v.string()),
    images: v.array(v.string()),
    coverImage: v.optional(v.string()),
    checkInTime: v.string(),
    checkOutTime: v.string(),
    policies: v.string(),
    houseRules: v.array(v.string()),
    instantBook: v.boolean(),
    unitName: v.string(),
    unitDescription: v.string(),
    capacityAdults: v.number(),
    capacityChildren: v.number(),
    bedrooms: v.number(),
    beds: v.string(),
    basePriceCents: v.number(),
    totalUnits: v.number(),
    mealPlan: v.union(
      v.literal("room_only"),
      v.literal("breakfast"),
      v.literal("half_board"),
      v.literal("full_board"),
    ),
    minNights: v.number(),
    refundable: v.boolean(),
    cancellationPolicy: v.string(),
  },
  handler: async (ctx, args) => {
    const { operator } = await requireOperator(ctx);

    if (args.name.trim().length < 2) {
      throw new Error("Please enter a property name.");
    }
    if (args.basePriceCents < 100) {
      throw new Error("Nightly rate must be at least US$1.");
    }
    if (args.totalUnits < 1) {
      throw new Error("Add at least one room or unit.");
    }

    let slug = slugify(args.name);
    const conflict = await ctx.db
      .query("properties")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (conflict) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const images =
      args.images.filter((image) => image.trim().length > 0).length > 0
        ? args.images.filter((image) => image.trim().length > 0)
        : [FALLBACK_IMAGE];
    const coverImage = args.coverImage?.trim() || images[0];

    const searchText = [
      args.name,
      args.summary,
      args.description,
      args.city,
      args.region,
      args.propertyType,
      ...args.amenities,
    ]
      .join(" ")
      .toLowerCase();

    const propertyId = await ctx.db.insert("properties", {
      operatorId: operator._id,
      name: args.name.trim(),
      slug,
      summary: args.summary.trim(),
      description: args.description.trim(),
      propertyType: args.propertyType,
      city: args.city.trim(),
      region: args.region.trim(),
      address: args.address.trim(),
      amenities: args.amenities,
      images,
      coverImage,
      checkInTime: args.checkInTime,
      checkOutTime: args.checkOutTime,
      policies: args.policies,
      houseRules: args.houseRules,
      ratingAvg: 0,
      reviewCount: 0,
      priceFromCents: args.basePriceCents,
      instantBook: args.instantBook,
      featured: false,
      status: "published",
      searchText,
    });

    const unitId = await ctx.db.insert("units", {
      propertyId,
      name: args.unitName.trim() || "Standard room",
      description: args.unitDescription.trim(),
      capacityAdults: Math.max(1, args.capacityAdults),
      capacityChildren: Math.max(0, args.capacityChildren),
      bedrooms: Math.max(1, args.bedrooms),
      beds: args.beds.trim() || "1 double bed",
      basePriceCents: args.basePriceCents,
      totalUnits: Math.max(1, args.totalUnits),
      amenities: args.amenities.slice(0, 8),
      images,
      status: "active",
    });

    await ctx.db.insert("ratePlans", {
      unitId,
      name: "Flexible rate",
      priceCents: args.basePriceCents,
      minNights: Math.max(1, args.minNights),
      mealPlan: args.mealPlan,
      refundable: args.refundable,
      cancellationPolicy:
        args.cancellationPolicy.trim() ||
        "Free cancellation up to 7 days before check-in.",
      active: true,
    });

    await ctx.db.insert("auditLogs", {
      actorUserId: operator.ownerUserId,
      action: "property.created",
      targetType: "properties",
      targetId: propertyId,
      metadata: args.name,
    });

    return { propertyId, unitId, slug };
  },
});

export const update = mutation({
  args: {
    propertyId: v.id("properties"),
    name: v.optional(v.string()),
    summary: v.optional(v.string()),
    description: v.optional(v.string()),
    city: v.optional(v.string()),
    region: v.optional(v.string()),
    address: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    coverImage: v.optional(v.string()),
    checkInTime: v.optional(v.string()),
    checkOutTime: v.optional(v.string()),
    policies: v.optional(v.string()),
    houseRules: v.optional(v.array(v.string())),
    instantBook: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { operator } = await requireOperator(ctx);
    const property = await ctx.db.get(args.propertyId);
    if (!property) throw new Error("Property not found.");
    if (property.operatorId !== operator._id) {
      throw new Error("You do not have access to this property.");
    }

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.summary !== undefined) patch.summary = args.summary.trim();
    if (args.description !== undefined)
      patch.description = args.description.trim();
    if (args.city !== undefined) patch.city = args.city.trim();
    if (args.region !== undefined) patch.region = args.region.trim();
    if (args.address !== undefined) patch.address = args.address.trim();
    if (args.amenities !== undefined) patch.amenities = args.amenities;
    if (args.images !== undefined) patch.images = args.images;
    if (args.coverImage !== undefined) patch.coverImage = args.coverImage;
    if (args.checkInTime !== undefined) patch.checkInTime = args.checkInTime;
    if (args.checkOutTime !== undefined) patch.checkOutTime = args.checkOutTime;
    if (args.policies !== undefined) patch.policies = args.policies;
    if (args.houseRules !== undefined) patch.houseRules = args.houseRules;
    if (args.instantBook !== undefined) patch.instantBook = args.instantBook;

    const name = (args.name ?? property.name).trim();
    const summary = (args.summary ?? property.summary).trim();
    const description = (args.description ?? property.description).trim();
    const city = (args.city ?? property.city).trim();
    const region = (args.region ?? property.region).trim();
    const amenities = args.amenities ?? property.amenities;
    patch.searchText = [
      name,
      summary,
      description,
      city,
      region,
      property.propertyType,
      ...amenities,
    ]
      .join(" ")
      .toLowerCase();

    await ctx.db.patch(args.propertyId, patch);
    return args.propertyId;
  },
});

export const setStatus = mutation({
  args: {
    propertyId: v.id("properties"),
    status: propertyStatusValidator,
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const property = await ctx.db.get(args.propertyId);
    if (!property) throw new Error("Property not found.");

    if (viewer.role !== "admin") {
      const { operator } = await requireOperator(ctx);
      if (property.operatorId !== operator._id) {
        throw new Error("You do not have access to this property.");
      }
    }

    await ctx.db.patch(args.propertyId, { status: args.status });
    return args.propertyId;
  },
});

export const updateUnit = mutation({
  args: {
    unitId: v.id("units"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    capacityAdults: v.optional(v.number()),
    capacityChildren: v.optional(v.number()),
    bedrooms: v.optional(v.number()),
    beds: v.optional(v.string()),
    basePriceCents: v.optional(v.number()),
    totalUnits: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("hidden"))),
  },
  handler: async (ctx, args) => {
    const { operator } = await requireOperator(ctx);
    const unit = await ctx.db.get(args.unitId);
    if (!unit) throw new Error("Unit not found.");
    const property = await ctx.db.get(unit.propertyId);
    if (!property || property.operatorId !== operator._id) {
      throw new Error("You do not have access to this unit.");
    }

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.description !== undefined)
      patch.description = args.description.trim();
    if (args.capacityAdults !== undefined)
      patch.capacityAdults = Math.max(1, args.capacityAdults);
    if (args.capacityChildren !== undefined)
      patch.capacityChildren = Math.max(0, args.capacityChildren);
    if (args.bedrooms !== undefined)
      patch.bedrooms = Math.max(1, args.bedrooms);
    if (args.beds !== undefined) patch.beds = args.beds.trim();
    if (args.basePriceCents !== undefined) {
      if (args.basePriceCents < 100) throw new Error("Rate must be at least US$1.");
      patch.basePriceCents = args.basePriceCents;
    }
    if (args.totalUnits !== undefined)
      patch.totalUnits = Math.max(1, args.totalUnits);
    if (args.status !== undefined) patch.status = args.status;

    await ctx.db.patch(args.unitId, patch);

    const units = await ctx.db
      .query("units")
      .withIndex("by_property", (q) => q.eq("propertyId", unit.propertyId))
      .take(20);
    const prices = units
      .filter((item) => item.status === "active")
      .map((item) =>
        item._id === args.unitId && args.basePriceCents !== undefined
          ? args.basePriceCents
          : item.basePriceCents,
      );
    if (prices.length > 0) {
      await ctx.db.patch(unit.propertyId, {
        priceFromCents: Math.min(...prices),
      });
    }

    return args.unitId;
  },
});

export const updateRatePlan = mutation({
  args: {
    ratePlanId: v.id("ratePlans"),
    name: v.optional(v.string()),
    priceCents: v.optional(v.number()),
    minNights: v.optional(v.number()),
    mealPlan: v.optional(
      v.union(
        v.literal("room_only"),
        v.literal("breakfast"),
        v.literal("half_board"),
        v.literal("full_board"),
      ),
    ),
    refundable: v.optional(v.boolean()),
    cancellationPolicy: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { operator } = await requireOperator(ctx);
    const plan = await ctx.db.get(args.ratePlanId);
    if (!plan) throw new Error("Rate plan not found.");
    const unit = await ctx.db.get(plan.unitId);
    if (!unit) throw new Error("Unit not found.");
    const property = await ctx.db.get(unit.propertyId);
    if (!property || property.operatorId !== operator._id) {
      throw new Error("You do not have access to this rate plan.");
    }

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.priceCents !== undefined) {
      if (args.priceCents < 100) throw new Error("Rate must be at least US$1.");
      patch.priceCents = args.priceCents;
    }
    if (args.minNights !== undefined)
      patch.minNights = Math.max(1, args.minNights);
    if (args.mealPlan !== undefined) patch.mealPlan = args.mealPlan;
    if (args.refundable !== undefined) patch.refundable = args.refundable;
    if (args.cancellationPolicy !== undefined)
      patch.cancellationPolicy = args.cancellationPolicy;
    if (args.active !== undefined) patch.active = args.active;

    await ctx.db.patch(args.ratePlanId, patch);
    return args.ratePlanId;
  },
});

export const setAvailabilityRange = mutation({
  args: {
    unitId: v.id("units"),
    from: v.string(),
    to: v.string(),
    closed: v.boolean(),
    priceOverrideCents: v.optional(v.number()),
    clearOverride: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { operator } = await requireOperator(ctx);
    const unit = await ctx.db.get(args.unitId);
    if (!unit) throw new Error("Unit not found.");
    const property = await ctx.db.get(unit.propertyId);
    if (!property || property.operatorId !== operator._id) {
      throw new Error("You do not have access to this unit.");
    }

    const dates = dateRange(args.from, args.to);
    if (dates.length === 0) {
      throw new Error("Choose a valid date range.");
    }

    let updated = 0;
    for (const date of dates) {
      const existing = await ctx.db
        .query("availability")
        .withIndex("by_unit_and_date", (q) =>
          q.eq("unitId", unit._id).eq("date", date),
        )
        .unique();

      if (existing) {
        const patch: Record<string, unknown> = { closed: args.closed };
        if (args.priceOverrideCents !== undefined) {
          patch.priceOverrideCents = args.priceOverrideCents;
        }
        if (args.clearOverride) {
          patch.priceOverrideCents = undefined;
        }
        await ctx.db.patch(existing._id, patch);
      } else {
        await ctx.db.insert("availability", {
          unitId: unit._id,
          date,
          totalUnits: unit.totalUnits,
          bookedUnits: 0,
          closed: args.closed,
          priceOverrideCents:
            args.priceOverrideCents !== undefined && !args.clearOverride
              ? args.priceOverrideCents
              : undefined,
        });
      }
      updated += 1;
    }

    return { updated };
  },
});

export const adminSetFeatured = mutation({
  args: {
    propertyId: v.id("properties"),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.propertyId, { featured: args.featured });
    return args.propertyId;
  },
});
