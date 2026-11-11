import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireOperator, requireViewer } from "./lib/auth";

export const forProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_property_and_status", (q) =>
        q.eq("propertyId", args.propertyId).eq("status", "published"),
      )
      .order("desc")
      .take(20);
  },
});

export const create = mutation({
  args: {
    bookingId: v.id("bookings"),
    rating: v.number(),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) throw new Error("Booking not found.");
    if (booking.guestUserId !== viewer._id) {
      throw new Error("You can only review your own stay.");
    }
    if (booking.status !== "completed") {
      throw new Error("You can review a stay after check-out.");
    }

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .unique();
    if (existing) throw new Error("You have already reviewed this stay.");

    const rating = Math.min(5, Math.max(1, Math.round(args.rating)));

    await ctx.db.insert("reviews", {
      propertyId: booking.propertyId,
      bookingId: args.bookingId,
      guestUserId: viewer._id,
      guestName: viewer.name,
      rating,
      title: args.title.trim() || "A lovely stay",
      body: args.body.trim(),
      status: "published",
    });

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_property_and_status", (q) => q.eq("propertyId", booking.propertyId))
      .take(200);
    const published = reviews.filter((review) => review.status === "published");
    const average =
      published.length > 0
        ? published.reduce((sum, review) => sum + review.rating, 0) /
          published.length
        : 0;

    await ctx.db.patch("properties", booking.propertyId, {
      ratingAvg: Math.round(average * 10) / 10,
      reviewCount: published.length,
    });

    return args.bookingId;
  },
});

export const respond = mutation({
  args: {
    reviewId: v.id("reviews"),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    const { operator } = await requireOperator(ctx);
    const review = await ctx.db.get("reviews", args.reviewId);
    if (!review) throw new Error("Review not found.");
    const property = await ctx.db.get("properties", review.propertyId);
    if (!property || property.operatorId !== operator._id) {
      throw new Error("You do not have access to this review.");
    }
    await ctx.db.patch("reviews", args.reviewId, {
      ownerResponse: args.response.trim(),
    });
    return args.reviewId;
  },
});
