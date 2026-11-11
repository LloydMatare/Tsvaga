import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  bookingCancelledEmail,
  bookingConfirmedEmail,
  bookingExpiredEmail,
  bookingReceivedEmail,
  operatorCancellationEmail,
  operatorNewBookingEmail,
} from "./emailTemplates";
import { appUrl, queueEmail } from "./notify";

async function loadBooking(ctx: MutationCtx, bookingId: Id<"bookings">) {
  const booking = await ctx.db.get("bookings", bookingId);
  if (!booking) return null;
  const property = await ctx.db.get("properties", booking.propertyId);
  const unit = await ctx.db.get("units", booking.unitId);
  const operator = await ctx.db.get("operators", booking.operatorId);
  return { appUrl: appUrl(), booking, property, unit, operator };
}

export async function notifyBookingReceived(
  ctx: MutationCtx,
  bookingId: Id<"bookings">,
) {
  const data = await loadBooking(ctx, bookingId);
  if (!data) return;

  const guest = bookingReceivedEmail(data);
  await queueEmail(ctx, {
    type: "booking_received",
    recipient: data.booking.guestEmail,
    subject: guest.subject,
    body: guest.body,
    userId: data.booking.guestUserId,
    bookingId,
  });

  if (!data.operator) return;
  const operator = operatorNewBookingEmail(data);
  await queueEmail(ctx, {
    type: "operator_new_booking",
    recipient: data.operator.contactEmail,
    subject: operator.subject,
    body: operator.body,
    userId: data.operator.ownerUserId,
    bookingId,
  });
}

export async function notifyBookingConfirmed(
  ctx: MutationCtx,
  bookingId: Id<"bookings">,
) {
  const data = await loadBooking(ctx, bookingId);
  if (!data) return;

  const email = bookingConfirmedEmail(data);
  await queueEmail(ctx, {
    type: "booking_confirmed",
    recipient: data.booking.guestEmail,
    subject: email.subject,
    body: email.body,
    userId: data.booking.guestUserId,
    bookingId,
  });
}

export async function notifyBookingCancelled(
  ctx: MutationCtx,
  bookingId: Id<"bookings">,
  reason?: string,
) {
  const data = await loadBooking(ctx, bookingId);
  if (!data) return;
  const context = { ...data, reason };

  const guest = bookingCancelledEmail(context);
  await queueEmail(ctx, {
    type: "booking_cancelled",
    recipient: data.booking.guestEmail,
    subject: guest.subject,
    body: guest.body,
    userId: data.booking.guestUserId,
    bookingId,
  });

  if (!data.operator) return;
  const operator = operatorCancellationEmail(context);
  await queueEmail(ctx, {
    type: "booking_cancelled",
    recipient: data.operator.contactEmail,
    subject: operator.subject,
    body: operator.body,
    userId: data.operator.ownerUserId,
    bookingId,
  });
}

export async function notifyBookingExpired(
  ctx: MutationCtx,
  bookingId: Id<"bookings">,
) {
  const data = await loadBooking(ctx, bookingId);
  if (!data) return;

  const email = bookingExpiredEmail(data);
  await queueEmail(ctx, {
    type: "booking_expired",
    recipient: data.booking.guestEmail,
    subject: email.subject,
    body: email.body,
    userId: data.booking.guestUserId,
    bookingId,
  });
}
