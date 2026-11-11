import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireViewer } from "./lib/auth";

export const toggle = mutation({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_property", (q) =>
        q.eq("userId", viewer._id).eq("propertyId", args.propertyId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { favorited: false };
    }

    await ctx.db.insert("favorites", {
      userId: viewer._id,
      propertyId: args.propertyId,
    });
    return { favorited: true };
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", viewer._id))
      .order("desc")
      .take(50);

    const properties = await Promise.all(
      favorites.map(async (favorite) => {
        const property = await ctx.db.get(favorite.propertyId);
        if (!property) return null;
        const operator = await ctx.db.get(property.operatorId);
        return {
          ...property,
          operatorName: operator?.businessName ?? "Tsvaga partner",
          operatorVerified: operator?.verificationStatus === "verified",
          savedAt: favorite._creationTime,
        };
      }),
    );

    return properties.filter((property) => property !== null);
  },
});
