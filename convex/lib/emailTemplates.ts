import type { Doc } from "../_generated/dataModel";

type TemplateContext = {
  appUrl: string;
  booking: Doc<"bookings">;
  property?: Doc<"properties"> | null;
  unit?: Doc<"units"> | null;
  operator?: Doc<"operators"> | null;
  reason?: string;
};

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function date(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

function stayLine(context: TemplateContext) {
  const { booking, property, unit } = context;
  const name = property?.name ?? "your Tsvaga stay";
  const room = unit?.name ? ` (${unit.name})` : "";
  return `${name}${room}\n${date(booking.checkIn)} to ${date(booking.checkOut)} · ${
    booking.nights
  } night${booking.nights === 1 ? "" : "s"} · ${
    booking.adults
  } adult${booking.adults === 1 ? "" : "s"}${
    booking.children ? `, ${booking.children} children` : ""
  }`;
}

function locationLine(context: TemplateContext) {
  const { property, operator } = context;
  if (!property) return "";
  const host = operator
    ? `${operator.businessName} · ${operator.contactPhone}`
    : "Contact the host through Tsvaga";
  return `${property.address}, ${property.city}\nHost: ${host}`;
}

export function bookingReceivedEmail(context: TemplateContext) {
  const { booking, appUrl } = context;
  return {
    subject: `Booking ${booking.code} received — complete payment`,
    body: `Hi ${booking.guestName},

We have held your room. Complete payment to confirm your booking.

${stayLine(context)}

Total due: ${money(booking.totalCents)}
Reference: ${booking.code}

Complete payment: ${appUrl}/booking/${booking.code}

Your room is held for 30 minutes. If payment is not completed, the booking will expire automatically.

The Tsvaga team`,
  };
}

export function bookingConfirmedEmail(context: TemplateContext) {
  const { booking, appUrl } = context;
  return {
    subject: `Booking ${booking.code} confirmed`,
    body: `Hi ${booking.guestName},

Your payment is in and your stay is confirmed. We look forward to hosting you.

${stayLine(context)}

${locationLine(context)}

Check in from ${context.property?.checkInTime ?? "14:00"} and check out by ${
      context.property?.checkOutTime ?? "10:00"
    }.

Total paid: ${money(booking.totalCents)}

View your booking: ${appUrl}/booking/${booking.code}

The Tsvaga team`,
  };
}

export function bookingCancelledEmail(context: TemplateContext) {
  const { booking, appUrl } = context;
  const refundNote = context.reason ?? booking.cancelledReason ?? "Cancelled";
  return {
    subject: `Booking ${booking.code} cancelled`,
    body: `Hi ${booking.guestName},

Your booking has been cancelled.

${stayLine(context)}

Reason: ${refundNote}

${
  booking.paymentStatus === "refunded"
    ? "Any payment received will be refunded to your original payment method."
    : "No payment was collected for this booking."
}

View details: ${appUrl}/booking/${booking.code}

The Tsvaga team`,
  };
}

export function bookingExpiredEmail(context: TemplateContext) {
  const { booking, appUrl } = context;
  return {
    subject: `Booking ${booking.code} expired`,
    body: `Hi ${booking.guestName},

We held your room, but payment was not completed in time, so the booking has expired.

${stayLine(context)}

Nothing has been charged. You can book again here: ${appUrl}/stays/${
      context.property?.slug ?? ""
    }

The Tsvaga team`,
  };
}

export function operatorNewBookingEmail(context: TemplateContext) {
  const { booking, appUrl, operator } = context;
  const net = booking.totalCents - booking.commissionCents;
  return {
    subject: `New booking ${booking.code} — ${stayLine(context).split("\n")[0]}`,
    body: `Hi ${operator?.businessName ?? "there"},

You have a new booking on Tsvaga.

${stayLine(context)}

Guest: ${booking.guestName}
Email: ${booking.guestEmail}
Phone: ${booking.guestPhone}
${
  booking.specialRequests
    ? `Special requests: ${booking.specialRequests}\n`
    : ""
}
Booking total: ${money(booking.totalCents)}
Your payout after commission: ${money(net)}
Payment status: ${booking.paymentStatus}

Manage this booking: ${appUrl}/dashboard

The Tsvaga team`,
  };
}

export function stayReminderEmail(context: TemplateContext) {
  const { booking, appUrl } = context;
  return {
    subject: `Your stay at ${context.property?.name ?? "Tsvaga"} is tomorrow`,
    body: `Hi ${booking.guestName},

Your stay is tomorrow. Here are the details one more time.

${stayLine(context)}

${locationLine(context)}

Check in from ${context.property?.checkInTime ?? "14:00"}.

View your booking: ${appUrl}/booking/${booking.code}

Travel safely,
The Tsvaga team`,
  };
}

export function operatorCancellationEmail(context: TemplateContext) {
  const { booking, appUrl, operator } = context;
  const reason = context.reason ?? booking.cancelledReason ?? "Cancelled";
  return {
    subject: `Booking ${booking.code} cancelled — ${
      context.property?.name ?? "your property"
    }`,
    body: `Hi ${operator?.businessName ?? "there"},

A booking on your property has been cancelled.

${stayLine(context)}

Guest: ${booking.guestName}
Phone: ${booking.guestPhone}
Reason: ${reason}
Booking total: ${money(booking.totalCents)}

Manage your bookings: ${appUrl}/dashboard

The Tsvaga team`,
  };
}
