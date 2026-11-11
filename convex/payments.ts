import { v } from "convex/values";

import { internal } from "./_generated/api";
import {
  action,
  env,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { requireViewer } from "./lib/auth";
import {
  notifyBookingCancelled,
  notifyBookingConfirmed,
} from "./lib/bookingNotify";
import { releaseInventory } from "./lib/inventory";
import {
  paynowHash,
  parsePaynowResponse,
  toPaynowAmount,
  verifyPaynowHash,
} from "./lib/paynow";

const PAYNOW_INITIATE_URL =
  "https://www.paynow.co.zw/interface/initiatetransaction";

export const initiatePaynow = action({
  args: { bookingId: v.id("bookings") },
  handler: async (
    ctx,
    args,
  ): Promise<
    | { demo: true; reference: string; bookingCode: string }
    | { demo: false; browserUrl: string; reference: string }
    | { paid: true }
  > => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in before paying.");

    const data = await ctx.runQuery(internal.bookings.getForPayment, {
      bookingId: args.bookingId,
      tokenIdentifier: identity.tokenIdentifier,
    });

    const { booking, property } = data;
    if (booking.paymentStatus === "paid") return { paid: true };
    if (booking.status !== "pending_payment") {
      throw new Error("This booking is no longer awaiting payment.");
    }

    const reference = `TSV-${booking.code}-${Date.now()
      .toString(36)
      .toUpperCase()}`;

    const integrationId = env.PAYNOW_INTEGRATION_ID;
    const integrationKey = env.PAYNOW_INTEGRATION_KEY;
    const siteUrl = env.SITE_URL ?? "http://localhost:3000";
    const convexSiteUrl =
      env.CONVEX_SITE_URL ?? env.NEXT_PUBLIC_CONVEX_SITE_URL;

    if (!integrationId || !integrationKey) {
      await ctx.runMutation(internal.payments.recordInitiation, {
        bookingId: booking._id,
        reference,
        amountCents: booking.totalCents,
        status: "initiated",
      });
      return { demo: true, reference, bookingCode: booking.code };
    }

    const fields: Array<[string, string]> = [
      ["id", integrationId],
      ["reference", reference],
      ["amount", toPaynowAmount(booking.totalCents)],
      [
        "additionalinfo",
        `${property?.name ?? "Tsvaga stay"} — ${booking.nights} night${
          booking.nights === 1 ? "" : "s"
        }`,
      ],
      ["returnurl", `${siteUrl}/booking/${booking.code}`],
      ["resulturl", `${convexSiteUrl}/paynow/webhook`],
      ["authemail", booking.guestEmail],
      ["authphone", booking.guestPhone],
      ["authname", booking.guestName],
      ["tokenize", "false"],
      ["merchanttrace", reference],
      ["status", "Message"],
    ];

    const hash = await paynowHash(
      fields.map(([, value]) => value),
      integrationKey,
    );

    const body = new URLSearchParams();
    for (const [key, value] of fields) body.append(key, value);
    body.append("hash", hash);

    const response = await fetch(PAYNOW_INITIATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const text = await response.text();
    const parsed = parsePaynowResponse(text);
    const verification = await verifyPaynowHash(text, integrationKey);
    if (!verification.valid) {
      throw new Error("Paynow returned an invalid security hash.");
    }
    if (parsed.status?.toLowerCase() !== "ok") {
      throw new Error(
        parsed.error ?? "Paynow could not start the payment. Try again.",
      );
    }

    const browserUrl = parsed.browserurl;
    if (!browserUrl) {
      throw new Error("Paynow did not return a payment page.");
    }

    await ctx.runMutation(internal.payments.recordInitiation, {
      bookingId: booking._id,
      reference,
      amountCents: booking.totalCents,
      status: "pending",
      browserUrl,
      pollUrl: parsed.pollurl,
      hashVerified: true,
    });

    return { demo: false, browserUrl, reference };
  },
});

export const recordInitiation = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    reference: v.string(),
    amountCents: v.number(),
    status: v.union(v.literal("initiated"), v.literal("pending")),
    browserUrl: v.optional(v.string()),
    pollUrl: v.optional(v.string()),
    hashVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const previous = await ctx.db
      .query("payments")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .take(10);
    for (const payment of previous) {
      if (payment.status === "initiated") {
        await ctx.db.patch("payments", payment._id, { status: "cancelled" });
      }
    }

    return await ctx.db.insert("payments", {
      bookingId: args.bookingId,
      reference: args.reference,
      provider: "paynow",
      amountCents: args.amountCents,
      status: args.status,
      browserUrl: args.browserUrl,
      pollUrl: args.pollUrl,
      hashVerified: args.hashVerified,
    });
  },
});

export const confirmFromPaynow = internalMutation({
  args: {
    reference: v.string(),
    paynowReference: v.optional(v.string()),
    amountCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();
    if (!payment) {
      throw new Error(`Unknown payment reference: ${args.reference}`);
    }
    if (payment.status === "paid") {
      return { ok: true, alreadyPaid: true };
    }

    const booking = await ctx.db.get("bookings", payment.bookingId);
    if (!booking) throw new Error("Booking not found.");

    if (
      args.amountCents !== undefined &&
      Math.abs(args.amountCents - booking.totalCents) > 1
    ) {
      await ctx.db.patch("payments", payment._id, {
        status: "failed",
        failureReason: "Amount mismatch",
      });
      throw new Error("Payment amount does not match the booking total.");
    }

    await ctx.db.patch("payments", payment._id, {
      status: "paid",
      paynowReference: args.paynowReference,
      paidAt: Date.now(),
      hashVerified: true,
    });

    await ctx.db.patch("bookings", booking._id, {
      status: "confirmed",
      paymentStatus: "paid",
      confirmedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      action: "payment.paid",
      targetType: "bookings",
      targetId: booking._id,
      metadata: args.paynowReference ?? args.reference,
    });

    await notifyBookingConfirmed(ctx, booking._id);

    return { ok: true, alreadyPaid: false };
  },
});

export const recordFailure = internalMutation({
  args: {
    reference: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .unique();
    if (!payment || payment.status === "paid") return;
    await ctx.db.patch("payments", payment._id, {
      status: "failed",
      failureReason: args.reason,
    });
  },
});

export const markDemoPaid = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    if (env.PAYNOW_INTEGRATION_ID) {
      throw new Error("Demo payments are disabled once Paynow is configured.");
    }
    const viewer = await requireViewer(ctx);
    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) throw new Error("Booking not found.");
    if (booking.guestUserId !== viewer._id && viewer.role !== "admin") {
      throw new Error("You do not have access to this booking.");
    }
    if (booking.paymentStatus === "paid") return booking._id;
    if (booking.status === "expired" || booking.status === "cancelled") {
      throw new Error("This booking has expired. Start a new booking.");
    }

    const existing = await ctx.db
      .query("payments")
      .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
      .order("desc")
      .first();

    if (existing) {
      await ctx.db.patch("payments", existing._id, {
        status: "paid",
        paidAt: Date.now(),
        hashVerified: false,
        method: "demo",
      });
    } else {
      await ctx.db.insert("payments", {
        bookingId: booking._id,
        reference: `DEMO-${booking.code}`,
        provider: "paynow",
        method: "demo",
        amountCents: booking.totalCents,
        status: "paid",
        hashVerified: false,
        paidAt: Date.now(),
      });
    }

    await ctx.db.patch("bookings", booking._id, {
      status: "confirmed",
      paymentStatus: "paid",
      confirmedAt: Date.now(),
    });

    await notifyBookingConfirmed(ctx, booking._id);

    return booking._id;
  },
});

export const forBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) return null;
    if (booking.guestUserId !== viewer._id && viewer.role !== "admin") {
      return null;
    }
    return await ctx.db
      .query("payments")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .order("desc")
      .take(10);
  },
});

export const refund = mutation({
  args: {
    bookingId: v.id("bookings"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    if (viewer.role !== "admin") {
      throw new Error("Only an admin can issue a refund.");
    }
    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) throw new Error("Booking not found.");

    if (!["cancelled", "declined", "expired"].includes(booking.status)) {
      await releaseInventory(ctx, booking);
    }

    await ctx.db.patch("bookings", args.bookingId, {
      paymentStatus: "refunded",
      status: "cancelled",
      cancelledAt: Date.now(),
      cancelledReason: args.note ?? "Refunded by admin",
    });

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .take(10);
    for (const payment of payments) {
      if (payment.status === "paid") {
        await ctx.db.patch("payments", payment._id, { status: "cancelled" });
      }
    }

    await ctx.db.insert("auditLogs", {
      actorUserId: viewer._id,
      action: "payment.refunded",
      targetType: "bookings",
      targetId: args.bookingId,
      metadata: args.note,
    });

    await notifyBookingCancelled(
      ctx,
      args.bookingId,
      args.note ?? "Refunded by Tsvaga",
    );

    return args.bookingId;
  },
});
