import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireAdmin, requireViewer } from "./lib/auth";

const SETTLED_STATUSES = ["confirmed", "checked_in", "completed"];

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const operator = await ctx.db
      .query("operators")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", viewer._id))
      .first();
    if (!operator) return null;

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_operator_and_status", (q) =>
        q.eq("operatorId", operator._id),
      )
      .take(500);

    const settled = bookings.filter(
      (booking) =>
        booking.paymentStatus === "paid" &&
        SETTLED_STATUSES.includes(booking.status),
    );

    const grossCents = settled.reduce(
      (sum, booking) => sum + booking.totalCents,
      0,
    );
    const commissionCents = settled.reduce(
      (sum, booking) => sum + booking.commissionCents,
      0,
    );

    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_operator", (q) => q.eq("operatorId", operator._id))
      .order("desc")
      .take(50);

    const paidOutCents = payouts
      .filter((payout) => payout.status === "paid")
      .reduce((sum, payout) => sum + payout.netCents, 0);
    const inFlightCents = payouts
      .filter((payout) => payout.status !== "paid")
      .reduce((sum, payout) => sum + payout.netCents, 0);

    return {
      operator,
      grossCents,
      commissionCents,
      netCents: grossCents - commissionCents,
      paidOutCents,
      inFlightCents,
      availableCents: grossCents - commissionCents - paidOutCents - inFlightCents,
      payouts,
      bookings: settled.slice(0, 20),
    };
  },
});

export const adminList = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireViewer(ctx);
    if (admin.role !== "admin") return [];
    return await ctx.db
      .query("payouts")
      .withIndex("by_status")
      .order("desc")
      .take(100);
  },
});

export const createBatch = mutation({
  args: {
    operatorId: v.id("operators"),
    periodStart: v.string(),
    periodEnd: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const operator = await ctx.db.get("operators", args.operatorId);
    if (!operator) throw new Error("Operator not found.");

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_operator_and_status", (q) =>
        q.eq("operatorId", args.operatorId),
      )
      .take(500);

    const included = bookings.filter(
      (booking) =>
        booking.paymentStatus === "paid" &&
        SETTLED_STATUSES.includes(booking.status) &&
        booking.checkOut >= args.periodStart &&
        booking.checkOut <= args.periodEnd,
    );

    if (included.length === 0) {
      throw new Error("No settled bookings in that period.");
    }

    const grossCents = included.reduce(
      (sum, booking) => sum + booking.totalCents,
      0,
    );
    const commissionCents = included.reduce(
      (sum, booking) => sum + booking.commissionCents,
      0,
    );

    const payoutId = await ctx.db.insert("payouts", {
      operatorId: args.operatorId,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      grossCents,
      commissionCents,
      adjustmentsCents: 0,
      netCents: grossCents - commissionCents,
      status: "pending",
    });

    await ctx.db.insert("auditLogs", {
      actorUserId: admin._id,
      action: "payout.created",
      targetType: "payouts",
      targetId: payoutId,
      metadata: `${included.length} bookings`,
    });

    return payoutId;
  },
});

export const markPaid = mutation({
  args: {
    payoutId: v.id("payouts"),
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const payout = await ctx.db.get("payouts", args.payoutId);
    if (!payout) throw new Error("Payout not found.");
    await ctx.db.patch("payouts", args.payoutId, {
      status: "paid",
      reference: args.reference.trim(),
      paidAt: Date.now(),
    });
    await ctx.db.insert("auditLogs", {
      actorUserId: admin._id,
      action: "payout.paid",
      targetType: "payouts",
      targetId: args.payoutId,
      metadata: args.reference,
    });
    return args.payoutId;
  },
});
