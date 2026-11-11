import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { bookingStatusValidator } from "./schema";
import { getViewer, requireOperator, requireViewer } from "./lib/auth";
import { dateRange, isValidISODate, nightsBetween } from "./lib/dates";
import { bookingCode } from "./lib/slug";
import { getStayQuote } from "./lib/stay";

const RELEASED_STATUSES = new Set(["cancelled", "declined", "expired"]);

async function reserveInventory(
  ctx: MutationCtx,
  unit: Doc<"units">,
  checkIn: string,
  checkOut: string,
) {
  for (const date of dateRange(checkIn, checkOut)) {
    const existing = await ctx.db
      .query("availability")
      .withIndex("by_unit_and_date", (q) =>
        q.eq("unitId", unit._id).eq("date", date),
      )
      .unique();

    if (existing) {
      const total = existing.totalUnits ?? unit.totalUnits;
      if (existing.closed || existing.bookedUnits + 1 > total) {
        throw new Error(`Sorry, ${date} is no longer available.`);
      }
      await ctx.db.patch(existing._id, {
        bookedUnits: existing.bookedUnits + 1,
      });
    } else {
      if (unit.totalUnits < 1) {
        throw new Error("This room is not bookable yet.");
      }
      await ctx.db.insert("availability", {
        unitId: unit._id,
        date,
        totalUnits: unit.totalUnits,
        bookedUnits: 1,
        closed: false,
      });
    }
  }
}

async function releaseInventory(
  ctx: MutationCtx,
  booking: Doc<"bookings">,
) {
  for (const date of dateRange(booking.checkIn, booking.checkOut)) {
    const existing = await ctx.db
      .query("availability")
      .withIndex("by_unit_and_date", (q) =>
        q.eq("unitId", booking.unitId).eq("date", date),
      )
      .unique();
    if (existing && existing.bookedUnits > 0) {
      await ctx.db.patch(existing._id, {
        bookedUnits: existing.bookedUnits - 1,
      });
    }
  }
}

export const quote = query({
  args: {
    unitId: v.id("units"),
    ratePlanId: v.id("ratePlans"),
    checkIn: v.string(),
    checkOut: v.string(),
  },
  handler: async (ctx, args) => {
    const unit = await ctx.db.get(args.unitId);
    const plan = await ctx.db.get(args.ratePlanId);
    if (!unit || !plan || plan.unitId !== unit._id) {
      return null;
    }
    const property = await ctx.db.get(unit.propertyId);
    const operator = property ? await ctx.db.get(property.operatorId) : null;
    const stay = await getStayQuote(ctx, unit, plan, args.checkIn, args.checkOut);
    return { unit, plan, stay, property, operator };
  },
});

export const create = mutation({
  args: {
    unitId: v.id("units"),
    ratePlanId: v.id("ratePlans"),
    checkIn: v.string(),
    checkOut: v.string(),
    adults: v.number(),
    children: v.number(),
    guestName: v.string(),
    guestEmail: v.string(),
    guestPhone: v.string(),
    specialRequests: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);

    if (!isValidISODate(args.checkIn) || !isValidISODate(args.checkOut)) {
      throw new Error("Choose valid dates.");
    }

    const unit = await ctx.db.get(args.unitId);
    if (!unit) throw new Error("Room not found.");
    const plan = await ctx.db.get(args.ratePlanId);
    if (!plan || plan.unitId !== unit._id || !plan.active) {
      throw new Error("Rate plan is not available.");
    }
    const property = await ctx.db.get(unit.propertyId);
    if (!property || property.status !== "published") {
      throw new Error("This property is not accepting bookings.");
    }
    const operator = await ctx.db.get(property.operatorId);
    if (!operator || operator.status !== "active") {
      throw new Error("This property is not accepting bookings.");
    }
    if (operator.verificationStatus !== "verified") {
      throw new Error("This property is awaiting verification.");
    }

    const adults = Math.max(1, Math.floor(args.adults));
    const children = Math.max(0, Math.floor(args.children));
    if (adults > unit.capacityAdults) {
      throw new Error(`This room sleeps up to ${unit.capacityAdults} adults.`);
    }
    if (children > unit.capacityChildren) {
      throw new Error(
        `This room allows up to ${unit.capacityChildren} children.`,
      );
    }

    if (!args.guestName.trim() || !args.guestEmail.trim()) {
      throw new Error("Add the guest name and email.");
    }

    const stay = await getStayQuote(
      ctx,
      unit,
      plan,
      args.checkIn,
      args.checkOut,
    );
    if (!stay.available) {
      throw new Error(stay.reason);
    }

    await reserveInventory(ctx, unit, args.checkIn, args.checkOut);

    const commissionCents = Math.round(
      (stay.subtotalCents * operator.commissionRateBps) / 10_000,
    );

    let code = bookingCode();
    let conflict = await ctx.db
      .query("bookings")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    while (conflict) {
      code = bookingCode();
      conflict = await ctx.db
        .query("bookings")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
    }

    const bookingId = await ctx.db.insert("bookings", {
      code,
      guestUserId: viewer._id,
      guestName: args.guestName.trim(),
      guestEmail: args.guestEmail.trim().toLowerCase(),
      guestPhone: args.guestPhone.trim(),
      operatorId: operator._id,
      propertyId: property._id,
      unitId: unit._id,
      ratePlanId: plan._id,
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      nights: stay.nights,
      adults,
      children,
      nightlyRateCents: stay.nightlyTotalCents,
      subtotalCents: stay.subtotalCents,
      commissionRateBps: operator.commissionRateBps,
      commissionCents,
      totalCents: stay.subtotalCents,
      currency: "USD",
      status: "pending_payment",
      paymentStatus: "unpaid",
      specialRequests: args.specialRequests?.trim() || undefined,
      source: "web",
    });

    await ctx.db.insert("auditLogs", {
      actorUserId: viewer._id,
      action: "booking.created",
      targetType: "bookings",
      targetId: bookingId,
      metadata: code,
    });

    return {
      bookingId,
      code,
      totalCents: stay.subtotalCents,
      nights: stay.nights,
    };
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return [];

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_guest", (q) => q.eq("guestUserId", viewer._id))
      .order("desc")
      .take(50);

    return await Promise.all(
      bookings.map(async (booking) => {
        const property = await ctx.db.get(booking.propertyId);
        const unit = await ctx.db.get(booking.unitId);
        const review = await ctx.db
          .query("reviews")
          .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
          .unique();
        return {
          ...booking,
          propertyName: property?.name ?? "Stay",
          propertySlug: property?.slug ?? "",
          propertyCity: property?.city ?? "",
          coverImage: property?.coverImage ?? "",
          unitName: unit?.name ?? "Room",
          canReview: booking.status === "completed" && !review,
          hasReview: Boolean(review),
        };
      }),
    );
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return null;

    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!booking) return null;

    const property = await ctx.db.get(booking.propertyId);
    const unit = await ctx.db.get(booking.unitId);
    const plan = await ctx.db.get(booking.ratePlanId);
    const operator = await ctx.db.get(booking.operatorId);
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
      .order("desc")
      .first();

    const isGuest = booking.guestUserId === viewer._id;
    const isAdmin = viewer.role === "admin";
    let isOperator = false;
    if (viewer.role === "operator" && operator) {
      isOperator = operator.ownerUserId === viewer._id;
    }
    if (!isGuest && !isAdmin && !isOperator) return null;

    return {
      booking,
      property,
      unit,
      plan,
      operator,
      payment,
      role: isAdmin ? "admin" : isOperator ? "operator" : "guest",
    };
  },
});

export const operatorList = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return [];
    const operator = await ctx.db
      .query("operators")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", viewer._id))
      .first();
    if (!operator) return [];

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_operator_and_status", (q) =>
        q.eq("operatorId", operator._id),
      )
      .order("desc")
      .take(100);

    return await Promise.all(
      bookings.map(async (booking) => {
        const property = await ctx.db.get(booking.propertyId);
        const unit = await ctx.db.get(booking.unitId);
        return {
          ...booking,
          propertyName: property?.name ?? "Property",
          unitName: unit?.name ?? "Room",
        };
      }),
    );
  },
});

export const operatorOverview = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return null;
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
      .order("desc")
      .take(300);

    const properties = await ctx.db
      .query("properties")
      .withIndex("by_operator", (q) => q.eq("operatorId", operator._id))
      .take(100);

    const settled = bookings.filter(
      (booking) =>
        booking.paymentStatus === "paid" &&
        !RELEASED_STATUSES.has(booking.status),
    );
    const gross = settled.reduce((sum, booking) => sum + booking.totalCents, 0);
    const commission = settled.reduce(
      (sum, booking) => sum + booking.commissionCents,
      0,
    );

    const today = new Date().toISOString().slice(0, 10);
    const upcoming = bookings.filter(
      (booking) =>
        booking.checkIn >= today &&
        ["confirmed", "checked_in"].includes(booking.status),
    ).length;

    return {
      operator,
      properties: properties.length,
      bookings: bookings.length,
      pending: bookings.filter((booking) => booking.status === "pending_payment")
        .length,
      confirmed: bookings.filter((booking) => booking.status === "confirmed")
        .length,
      upcoming,
      grossCents: gross,
      commissionCents: commission,
      netCents: gross - commission,
      recent: bookings.slice(0, 8),
    };
  },
});

export const updateStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    status: bookingStatusValidator,
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found.");

    if (viewer.role !== "admin") {
      const { operator } = await requireOperator(ctx);
      if (booking.operatorId !== operator._id) {
        throw new Error("You do not have access to this booking.");
      }
    }

    if (
      RELEASED_STATUSES.has(args.status) &&
      !RELEASED_STATUSES.has(booking.status)
    ) {
      await releaseInventory(ctx, booking);
    }

    await ctx.db.patch(args.bookingId, {
      status: args.status,
      cancelledAt: RELEASED_STATUSES.has(args.status)
        ? Date.now()
        : booking.cancelledAt,
      paymentStatus:
        RELEASED_STATUSES.has(args.status) && booking.paymentStatus === "paid"
          ? "refunded"
          : booking.paymentStatus,
    });

    return args.bookingId;
  },
});

export const cancel = mutation({
  args: {
    bookingId: v.id("bookings"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found.");
    if (booking.guestUserId !== viewer._id && viewer.role !== "admin") {
      throw new Error("You can only cancel your own booking.");
    }
    if (
      booking.status === "cancelled" ||
      booking.status === "declined" ||
      booking.status === "expired"
    ) {
      return args.bookingId;
    }
    if (booking.status === "completed" || booking.status === "checked_in") {
      throw new Error("This stay can no longer be cancelled online.");
    }

    await releaseInventory(ctx, booking);
    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
      cancelledAt: Date.now(),
      cancelledReason: args.reason?.trim() || "Cancelled by guest",
      paymentStatus: booking.paymentStatus === "paid" ? "refunded" : "unpaid",
    });

    return args.bookingId;
  },
});

export const getForPayment = internalQuery({
  args: {
    bookingId: v.id("bookings"),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .unique();
    if (!user) throw new Error("Signed-in user not found.");

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found.");
    if (booking.guestUserId !== user._id && user.role !== "admin") {
      throw new Error("You do not have access to this booking.");
    }

    const property = await ctx.db.get(booking.propertyId);
    return { booking, property };
  },
});

export const confirmPaid = internalMutation({
  args: {
    bookingId: v.id("bookings"),
    paynowReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found.");
    if (booking.paymentStatus === "paid") return booking._id;

    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      paymentStatus: "paid",
      confirmedAt: Date.now(),
    });
    return args.bookingId;
  },
});

export const expirePending = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    const pending = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "pending_payment"))
      .take(100);

    let expired = 0;
    for (const booking of pending) {
      if (booking._creationTime > cutoff) continue;
      if (expired >= 25) break;

      const payments = await ctx.db
        .query("payments")
        .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
        .take(5);
      const paymentInFlight = payments.some(
        (payment) =>
          (payment.status === "initiated" || payment.status === "pending") &&
          payment._creationTime > Date.now() - 2 * 60 * 60 * 1000,
      );
      if (paymentInFlight) continue;

      await releaseInventory(ctx, booking);
      await ctx.db.patch(booking._id, {
        status: "expired",
        cancelledAt: Date.now(),
        cancelledReason: "Payment was not completed in time",
      });
      expired += 1;
    }
    return { expired };
  },
});

export const operatorBookingCount = internalQuery({
  args: { operatorId: v.id("operators") },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_operator_and_status", (q) =>
        q.eq("operatorId", args.operatorId),
      )
      .take(1000);
    return bookings.length;
  },
});

export type BookingId = Id<"bookings">;
