"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  DownloadIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  PrinterIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatUsd, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusCopy: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive" | "muted" }
> = {
  pending_payment: { label: "Awaiting payment", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  checked_in: { label: "Checked in", variant: "success" },
  completed: { label: "Completed", variant: "muted" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  declined: { label: "Declined", variant: "destructive" },
  expired: { label: "Expired", variant: "destructive" },
};

export default function BookingPage() {
  const params = useParams<{ code: string }>();
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  const { isAuthenticated } = useConvexAuth();
  const data = useQuery(api.bookings.getByCode, { code });
  const cancel = useMutation(api.bookings.cancel);
  const [cancelling, setCancelling] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl">Sign in to view this booking</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          For your privacy, booking details are only visible to the guest and
          host.
        </p>
        <Button asChild className="mt-6">
          <Link href={`/sign-in?redirect_url=${encodeURIComponent(`/booking/${code}`)}`}>
            Sign in
          </Link>
        </Button>
      </div>
    );
  }

  if (data === undefined) {
    return (
      <div className="container-page grid gap-6 py-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="container-page py-24 text-center">
        <p className="eyebrow">Booking not found</p>
        <h1 className="mt-2 font-display text-4xl">
          We couldn&apos;t find that code.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Check the link in your confirmation email, or sign in with the account
          used to book.
        </p>
        <Button asChild className="mt-6">
          <Link href="/trips">View my trips</Link>
        </Button>
      </div>
    );
  }

  const { booking, property, unit, plan, operator, payment, role } = data;
  const status = statusCopy[booking.status] ?? {
    label: booking.status,
    variant: "muted" as const,
  };
  const canCancel =
    role === "guest" &&
    (booking.status === "confirmed" || booking.status === "pending_payment");
  const isPaid = booking.paymentStatus === "paid";

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancel({
        bookingId: booking._id,
        reason: "Cancelled by guest from booking page",
      });
      toast.success("Booking cancelled. Any eligible refund will follow.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not cancel the booking.",
      );
    } finally {
      setCancelling(false);
    }
  }

  function downloadCalendar() {
    const stamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Tsvaga//Booking//EN",
      "BEGIN:VEVENT",
      `UID:${booking.code}@tsvaga`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${booking.checkIn.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${booking.checkOut.replace(/-/g, "")}`,
      `SUMMARY:${property?.name ?? "Tsvaga stay"}`,
      `LOCATION:${property?.address ?? ""}, ${property?.city ?? ""}`,
      `DESCRIPTION:Booking ${booking.code} · ${unit?.name ?? "Room"}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    const blob = new Blob([lines.join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `tsvaga-${booking.code}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <Link
        href="/trips"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground print:hidden"
      >
        <ArrowLeftIcon className="size-3.5" />
        All trips
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="outline" className="font-mono">
              {booking.code}
            </Badge>
          </div>
          <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
            {isPaid ? "You're going to" : "Your stay at"}{" "}
            <span className="italic">{property?.name ?? "Zimbabwe"}</span>
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPinIcon className="size-3.5" />
            {property?.city}, {property?.region}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={downloadCalendar}>
            <DownloadIcon className="size-3.5" />
            Add to calendar
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <PrinterIcon className="size-3.5" />
            Print
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <div className="surface-card overflow-hidden">
            {property && (
              <div className="relative aspect-[21/9]">
                <Image
                  src={property.coverImage}
                  alt={property.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                />
              </div>
            )}
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <Detail
                label="Check in"
                value={formatDate(booking.checkIn)}
                hint={`From ${property?.checkInTime ?? "14:00"}`}
              />
              <Detail
                label="Check out"
                value={formatDate(booking.checkOut)}
                hint={`By ${property?.checkOutTime ?? "10:00"}`}
              />
              <Detail
                label="Room"
                value={unit?.name ?? "Room"}
                hint={`${booking.adults} adult${booking.adults === 1 ? "" : "s"}${
                  booking.children > 0 ? ` · ${booking.children} children` : ""
                }`}
              />
              <Detail
                label="Rate"
                value={plan?.name ?? "Flexible rate"}
                hint={`${booking.nights} night${booking.nights === 1 ? "" : "s"}`}
              />
            </div>
            {booking.specialRequests && (
              <div className="border-t border-border px-5 py-4 text-sm sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Special requests
                </p>
                <p className="mt-1.5 text-muted-foreground">
                  {booking.specialRequests}
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="surface-card p-5">
              <h2 className="text-sm font-semibold">Your host</h2>
              <p className="mt-1.5 font-display text-xl">
                {operator?.businessName ?? "Tsvaga partner"}
              </p>
              {operator?.verificationStatus === "verified" && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-primary">
                  <ShieldCheckIcon className="size-3.5" />
                  Verified by Tsvaga
                </p>
              )}
              <div className="mt-4 space-y-2 text-sm">
                {operator?.contactEmail && (
                  <a
                    href={`mailto:${operator.contactEmail}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <MailIcon className="size-3.5" />
                    {operator.contactEmail}
                  </a>
                )}
                {operator?.contactPhone && (
                  <a
                    href={`tel:${operator.contactPhone}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <PhoneIcon className="size-3.5" />
                    {operator.contactPhone}
                  </a>
                )}
                {operator?.whatsapp && (
                  <a
                    href={`https://wa.me/${operator.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <PhoneIcon className="size-3.5" />
                    WhatsApp the host
                  </a>
                )}
              </div>
              {property && (
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href={`/stays/${property.slug}`}>View the stay</Link>
                </Button>
              )}
            </div>

            <div className="surface-card flex flex-col items-center justify-center p-5 print:hidden">
              <QRCodeSVG
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/booking/${booking.code}`}
                size={132}
                level="M"
                bgColor="transparent"
                fgColor="currentColor"
                className="text-foreground"
              />
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Show this code at check-in
              </p>
            </div>
          </div>

          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold">Good to know</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                Bring a valid ID matching the guest name on this booking.
              </li>
              <li className="flex gap-2">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                {property?.policies ??
                  "Contact the host directly for early check-in or transfers."}
              </li>
              <li className="flex gap-2">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                {plan?.cancellationPolicy ??
                  "Free cancellation up to 7 days before check-in."}
              </li>
            </ul>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold">Payment summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {formatUsd(booking.nightlyRateCents)} × {booking.nights} night
                  {booking.nights === 1 ? "" : "s"}
                </span>
                <span>{formatUsd(booking.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Service fees</span>
                <span>Included</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatUsd(booking.totalCents)}</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-muted/60 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Payment status</span>
                <Badge
                  variant={
                    booking.paymentStatus === "paid"
                      ? "success"
                      : booking.paymentStatus === "refunded"
                        ? "muted"
                        : booking.paymentStatus === "failed"
                          ? "destructive"
                          : "warning"
                  }
                >
                  {booking.paymentStatus.replace(/_/g, " ")}
                </Badge>
              </div>
              {payment && (
                <>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {payment.method ? `${payment.method} · ` : ""}
                    {payment.reference}
                  </p>
                  {payment.paidAt && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Paid {relativeTime(payment.paidAt)}
                    </p>
                  )}
                </>
              )}
              {booking.status === "pending_payment" && (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <ClockIcon className="mt-0.5 size-3 shrink-0" />
                  Unpaid bookings are released after 30 minutes.
                </p>
              )}
            </div>

            {booking.status === "pending_payment" && (
              <Button asChild className="mt-4 w-full">
                <Link
                  href={`/checkout?unit=${booking.unitId}&plan=${booking.ratePlanId}&checkIn=${booking.checkIn}&checkOut=${booking.checkOut}&adults=${booking.adults}&children=${booking.children}`}
                >
                  Complete payment
                </Link>
              </Button>
            )}

            {canCancel && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="mt-2 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <XCircleIcon className="size-4" />
                    Cancel booking
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel this booking?</DialogTitle>
                    <DialogDescription>
                      This releases your room for other guests. Refunds follow
                      the rate policy — our team will confirm by email.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={cancelling}
                    >
                      {cancelling ? "Cancelling…" : "Yes, cancel booking"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="rounded-2xl border border-border/70 bg-secondary/25 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Need help?
            </p>
            <p className="mt-2 text-sm leading-relaxed">
              WhatsApp us on{" "}
              <a href="tel:+263770000000" className="font-medium underline">
                +263 77 000 0000
              </a>{" "}
              or email{" "}
              <a
                href="mailto:hello@tsvaga.co.zw"
                className="font-medium underline"
              >
                hello@tsvaga.co.zw
              </a>
              .
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CalendarDaysIcon className="size-3" />
              Booking created {relativeTime(booking._creationTime)}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 text-base font-medium")}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
