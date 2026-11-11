import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
  getViewer,
  requireAdmin,
  requireOperator,
  requireViewer,
} from "./lib/auth";
import { slugify } from "./lib/slug";

const payoutMethodValidator = v.union(
  v.literal("ecocash"),
  v.literal("bank"),
  v.literal("cash"),
);

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return null;
    return await ctx.db
      .query("operators")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", viewer._id))
      .first();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("operators")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const create = mutation({
  args: {
    businessName: v.string(),
    description: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
    whatsapp: v.string(),
    city: v.string(),
    payoutMethod: payoutMethodValidator,
    payoutDetails: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);

    const existing = await ctx.db
      .query("operators")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", viewer._id))
      .first();

    if (existing) {
      return existing._id;
    }

    if (args.businessName.trim().length < 2) {
      throw new Error("Please enter your business name.");
    }

    let slug = slugify(args.businessName);
    const conflict = await ctx.db
      .query("operators")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (conflict) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const operatorId = await ctx.db.insert("operators", {
      ownerUserId: viewer._id,
      businessName: args.businessName.trim(),
      slug,
      description: args.description.trim(),
      verificationStatus: "pending",
      contactEmail: args.contactEmail.trim(),
      contactPhone: args.contactPhone.trim(),
      whatsapp: args.whatsapp.trim(),
      city: args.city.trim(),
      payoutMethod: args.payoutMethod,
      payoutDetails: args.payoutDetails?.trim() || undefined,
      commissionRateBps: 900,
      instantBook: true,
      status: "active",
    });

    if (viewer.role === "traveler") {
      await ctx.db.patch("users", viewer._id, { role: "operator" });
    }

    return operatorId;
  },
});

export const update = mutation({
  args: {
    businessName: v.optional(v.string()),
    description: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    city: v.optional(v.string()),
    payoutMethod: v.optional(payoutMethodValidator),
    payoutDetails: v.optional(v.string()),
    instantBook: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { operator } = await requireOperator(ctx);
    const patch: Record<string, string | boolean> = {};
    if (args.businessName) patch.businessName = args.businessName.trim();
    if (args.description !== undefined)
      patch.description = args.description.trim();
    if (args.contactEmail) patch.contactEmail = args.contactEmail.trim();
    if (args.contactPhone) patch.contactPhone = args.contactPhone.trim();
    if (args.whatsapp) patch.whatsapp = args.whatsapp.trim();
    if (args.city) patch.city = args.city.trim();
    if (args.payoutMethod) patch.payoutMethod = args.payoutMethod;
    if (args.payoutDetails !== undefined)
      patch.payoutDetails = args.payoutDetails.trim();
    if (args.instantBook !== undefined) patch.instantBook = args.instantBook;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch("operators", operator._id, patch);
    }
    return operator._id;
  },
});

export const claimDemo = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);

    const own = await ctx.db
      .query("operators")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", viewer._id))
      .first();
    if (own) return own._id;

    const demo = await ctx.db
      .query("operators")
      .withIndex("by_verification", (q) => q.eq("verificationStatus", "verified"))
      .first();

    if (!demo) {
      throw new Error("No demo operator is available yet. Create your own profile.");
    }

    await ctx.db.patch("operators", demo._id, { ownerUserId: viewer._id });
    if (viewer.role === "traveler") {
      await ctx.db.patch("users", viewer._id, { role: "operator" });
    }
    return demo._id;
  },
});

export const pending = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getViewer(ctx);
    if (!admin || admin.role !== "admin") return [];
    return await ctx.db
      .query("operators")
      .withIndex("by_verification", (q) => q.eq("verificationStatus", "pending"))
      .take(50);
  },
});

export const setVerification = mutation({
  args: {
    operatorId: v.id("operators"),
    verificationStatus: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected"),
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const operator = await ctx.db.get("operators", args.operatorId);
    if (!operator) throw new Error("Operator not found.");
    await ctx.db.patch("operators", args.operatorId, {
      verificationStatus: args.verificationStatus,
    });
    await ctx.db.insert("auditLogs", {
      actorUserId: admin._id,
      action: "operator.verification",
      targetType: "operators",
      targetId: args.operatorId,
      metadata: args.verificationStatus,
    });
    return args.operatorId;
  },
});
