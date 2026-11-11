import { v } from "convex/values";

import { internal } from "./_generated/api";
import {
  env,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { addDaysISO, todayISO } from "./lib/dates";
import { appUrl, queueEmail } from "./lib/notify";
import { stayReminderEmail } from "./lib/emailTemplates";
import { getViewer } from "./lib/auth";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const getForDelivery = internalQuery({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    return await ctx.db.get("notifications", args.notificationId);
  },
});

export const markSending = internalMutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch("notifications", args.notificationId, {
      status: "sending",
    });
  },
});

export const markSent = internalMutation({
  args: {
    notificationId: v.id("notifications"),
    provider: v.string(),
    providerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("notifications", args.notificationId, {
      status: "sent",
      provider: args.provider,
      providerId: args.providerId,
      sentAt: Date.now(),
    });
  },
});

export const markSkipped = internalMutation({
  args: {
    notificationId: v.id("notifications"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("notifications", args.notificationId, {
      status: "skipped",
      error: args.reason,
    });
  },
});

export const markFailed = internalMutation({
  args: {
    notificationId: v.id("notifications"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("notifications", args.notificationId, {
      status: "failed",
      error: args.error,
    });
  },
});

export const deliver = internalAction({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.runQuery(internal.notifications.getForDelivery, {
      notificationId: args.notificationId,
    });
    if (!notification) return { ok: false, reason: "missing" };
    if (notification.status === "sent" || notification.status === "skipped") {
      return { ok: true, skipped: true };
    }

    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      console.log(
        `[email:demo] ${notification.type} to ${notification.recipient}: ${notification.subject}`,
      );
      await ctx.runMutation(internal.notifications.markSkipped, {
        notificationId: args.notificationId,
        reason: "RESEND_API_KEY is not configured",
      });
      return { ok: true, demo: true };
    }

    await ctx.runMutation(internal.notifications.markSending, {
      notificationId: args.notificationId,
    });

    const from = env.EMAIL_FROM ?? "Tsvaga <bookings@tsvaga.co.zw>";
    const html = `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#1f2a22;line-height:1.6"><h1 style="font-size:22px;margin:0 0 20px">${escapeHtml(
      notification.subject,
    )}</h1><pre style="white-space:pre-wrap;font-family:inherit;font-size:15px;margin:0">${escapeHtml(
      notification.body,
    )}</pre><p style="margin-top:28px;font-size:12px;color:#6b7a6f">Tsvaga · Zimbabwe stays, booked locally</p></div>`;

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [notification.recipient],
          subject: notification.subject,
          text: notification.body,
          html,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { id?: string; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.message ?? `Resend returned HTTP ${response.status}.`,
        );
      }

      await ctx.runMutation(internal.notifications.markSent, {
        notificationId: args.notificationId,
        provider: "resend",
        providerId: payload?.id,
      });
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not send email.";
      await ctx.runMutation(internal.notifications.markFailed, {
        notificationId: args.notificationId,
        error: message,
      });
      return { ok: false, error: message };
    }
  },
});

export const sendStayReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const target = addDaysISO(todayISO(), 1);
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "confirmed"))
      .take(300);

    let queued = 0;
    for (const booking of bookings) {
      if (booking.checkIn !== target || booking.paymentStatus !== "paid") {
        continue;
      }
      const existing = await ctx.db
        .query("notifications")
        .withIndex("by_booking_and_type", (q) =>
          q.eq("bookingId", booking._id).eq("type", "stay_reminder"),
        )
        .first();
      if (existing) continue;

      const property = await ctx.db.get("properties", booking.propertyId);
      const unit = await ctx.db.get("units", booking.unitId);
      const operator = await ctx.db.get("operators", booking.operatorId);
      const email = stayReminderEmail({
        appUrl: appUrl(),
        booking,
        property,
        unit,
        operator,
      });

      await queueEmail(ctx, {
        type: "stay_reminder",
        recipient: booking.guestEmail,
        subject: email.subject,
        body: email.body,
        userId: booking.guestUserId,
        bookingId: booking._id,
      });
      queued += 1;
      if (queued >= 50) break;
    }

    return { queued, target };
  },
});

export const forBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return [];
    const booking = await ctx.db.get("bookings", args.bookingId);
    if (!booking) return [];

    const isGuest = booking.guestUserId === viewer._id;
    const isAdmin = viewer.role === "admin";
    let isOperator = false;
    if (viewer.role === "operator") {
      const operator = await ctx.db.get("operators", booking.operatorId);
      isOperator = operator?.ownerUserId === viewer._id;
    }
    if (!isGuest && !isAdmin && !isOperator) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_booking_and_type", (q) => q.eq("bookingId", booking._id))
      .take(20);

    const guestEmail = booking.guestEmail.trim().toLowerCase();
    return notifications
      .sort((a, b) => b._creationTime - a._creationTime)
      .filter((notification) => {
        if (isAdmin) return true;
        if (isGuest && notification.recipient === guestEmail) {
          return true;
        }
        if (isOperator) {
          return notification.type === "operator_new_booking";
        }
        return false;
      });
  },
});
