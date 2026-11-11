import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);

    const users = await ctx.db.query("users").take(500);
    const operators = await ctx.db.query("operators").take(200);
    const properties = await ctx.db.query("properties").take(200);
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_status")
      .order("desc")
      .take(300);

    const paid = bookings.filter(
      (booking) =>
        booking.paymentStatus === "paid" &&
        !["cancelled", "declined", "expired"].includes(booking.status),
    );
    const grossCents = paid.reduce(
      (sum, booking) => sum + booking.totalCents,
      0,
    );
    const commissionCents = paid.reduce(
      (sum, booking) => sum + booking.commissionCents,
      0,
    );

    return {
      admin,
      users: users.length,
      operators: operators.length,
      pendingOperators: operators.filter(
        (operator) => operator.verificationStatus === "pending",
      ).length,
      properties: properties.length,
      published: properties.filter(
        (property) => property.status === "published",
      ).length,
      bookings: bookings.length,
      pendingBookings: bookings.filter(
        (booking) => booking.status === "pending_payment",
      ).length,
      grossCents,
      commissionCents,
      recentBookings: bookings.slice(0, 10),
    };
  },
});

export const operators = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("operators").order("desc").take(100);
  },
});

export const properties = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const properties = await ctx.db.query("properties").order("desc").take(100);
    return await Promise.all(
      properties.map(async (property) => {
        const operator = await ctx.db.get("operators", property.operatorId);
        return {
          ...property,
          operatorName: operator?.businessName ?? "Unknown",
          operatorVerified: operator?.verificationStatus === "verified",
        };
      }),
    );
  },
});

export const bookings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const bookings = await ctx.db.query("bookings").order("desc").take(100);
    return await Promise.all(
      bookings.map(async (booking) => {
        const property = await ctx.db.get("properties", booking.propertyId);
        return {
          ...booking,
          propertyName: property?.name ?? "Property",
        };
      }),
    );
  },
});

export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("traveler"),
      v.literal("operator"),
      v.literal("admin"),
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.patch("users", args.userId, { role: args.role });
    await ctx.db.insert("auditLogs", {
      actorUserId: admin._id,
      action: "user.role",
      targetType: "users",
      targetId: args.userId,
      metadata: args.role,
    });
    return args.userId;
  },
});
