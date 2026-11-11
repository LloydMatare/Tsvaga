import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { env } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";

export type NotificationType =
  | "booking_received"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_expired"
  | "operator_new_booking"
  | "stay_reminder";

type QueueEmailArgs = {
  type: NotificationType;
  recipient: string;
  subject: string;
  body: string;
  userId?: Id<"users">;
  bookingId?: Id<"bookings">;
};

export function appUrl(path = "") {
  const base = (env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function queueEmail(ctx: MutationCtx, args: QueueEmailArgs) {
  const recipient = args.recipient.trim().toLowerCase();
  if (!recipient) return null;

  const notificationId = await ctx.db.insert("notifications", {
    type: args.type,
    channel: "email",
    recipient,
    subject: args.subject,
    body: args.body,
    status: "queued",
    userId: args.userId,
    bookingId: args.bookingId,
  });

  await ctx.scheduler.runAfter(0, internal.notifications.deliver, {
    notificationId,
  });

  return notificationId;
}
