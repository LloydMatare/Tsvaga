"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckIcon,
  CreditCardIcon,
  Loader2Icon,
  LockIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatUsd, nightsBetween } from "@/lib/format";

export function CheckoutClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const viewer = useQuery(api.users.me);

  const unitId = params.get("unit") ?? "";
  const ratePlanId = params.get("plan") ?? "";
  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const adults = Number(params.get("adults") ?? "2") || 2;
  const children = Number(params.get("children") ?? "0") || 0;

  const quote = useQuery(
    api.bookings.quote,
    unitId && ratePlanId && checkIn && checkOut
      ? {
          unitId: unitId as Id<"units">,
          ratePlanId: ratePlanId as Id<"ratePlans">,
          checkIn,
          checkOut,
        }
      : "skip",
  );

  const createBooking = useMutation(api.bookings.create);
  const initiate = useMutation(api.payments.initiatePaynow);
  const markDemoPaid = useMutation(api.payments.markDemoPaid);
  const cancelBooking = useMutation(api.bookings.cancel);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requests, setRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<{
    id: Id<"bookings">;
    code: string;
  } | null>(null);
  const [demoReference, setDemoReference] = useState<string | null>(null);

  useEffect(() => {
    if (!viewer) return;
    setName((value) => value || viewer.name || "");
    setEmail((value) => value || viewer.email || "");
    setPhone((value) => value || viewer.phone || "");
  }, [viewer]);

  const nights = useMemo(
    () => (checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0),
    [checkIn, checkOut],
  );

  if (!unitId || !ratePlanId || !checkIn || !checkOut) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-3xl">Your booking link is incomplete.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Head back to the stay, choose your dates and try again.
        </p>
        <Button asChild className="mt-6">
          <Link href="/stays">Browse stays</Link>
        </Button>
      </div>
    );
  }

  async function handlePay() {
    if (!quote || !quote.stay.available) return;
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Add your name, email and phone number.");
      return;
    }

    setSubmitting(true);
    try {
      let current = booking;
      if (!current) {
        const created = await createBooking({
          unitId: quote.unit._id,
          ratePlanId: quote.plan._id,
          checkIn,
          checkOut,
          adults,
          children,
          guestName: name,
          guestEmail: email,
          guestPhone: phone,
          specialRequests: requests || undefined,
        });
        current = { id: created.bookingId, code: created.code };
        setBooking(current);
      }

      const result = await initiate({ bookingId: current.id });
      if ("paid" in result) {
        router.push(`/booking/${current.code}`);
        return;
      }
      if (result.demo) {
        setDemoReference(result.reference);
        toast("Paynow is not configured", {
          description:
            "Use the demo payment button below to complete this booking.",
        });
        return;
      }
      window.location.href = result.browserUrl;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not start the payment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function payDemo() {
    if (!booking) return;
    setSubmitting(true);
    try {
      await markDemoPaid({ bookingId: booking.id });
      router.push(`/booking/${booking.code}?new=1`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not complete payment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function abandon() {
    if (booking) {
      try {
        await cancelBooking({ bookingId: booking.id });
      } catch {
        // The pending booking will expire on its own.
      }
    }
    setBooking(null);
    setDemoReference(null);
  }

  if (!isAuthenticated) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
        <div className="surface-card max-w-md p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <LockIcon className="size-5" />
          </span>
          <h1 className="mt-4 font-display text-3xl">Sign in to reserve</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Tsvaga keeps your bookings, confirmation codes and receipts in one
            place. Sign in to continue to checkout.
          </p>
          <Button asChild className="mt-6 w-full" size="lg">
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(
                `/checkout?${params.toString()}`,
              )}`}
            >
              Sign in
            </Link>
          </Button>
          <p className="mt-3 text-[11px] text-muted-foreground">
            New here? You can create an account from the sign-in page.
          </p>
        </div>
      </div>
    );
  }

  if (quote === undefined) {
    return (
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (quote === null || !quote.stay.available || !quote.property) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-3xl">These dates are no longer available.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {quote && !quote.stay.available
            ? quote.stay.reason
            : "Choose another room or different dates."}
        </p>
        <Button asChild className="mt-6">
          <Link
            href={
              quote?.property
                ? `/stays/${quote.property.slug}?checkIn=${checkIn}&checkOut=${checkOut}`
                : "/stays"
            }
          >
            Back to the stay
          </Link>
        </Button>
      </div>
    );
  }

  const property = quote.property;
  const unit = quote.unit;
  const plan = quote.plan;
  const stay = quote.stay;

  return (
    <div className="container-page py-8 sm:py-10">
      <Link
        href={`/stays/${property.slug}?checkIn=${checkIn}&checkOut=${checkOut}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back to {property.name}
      </Link>

      <div className="mt-4">
        <p className="eyebrow">Secure checkout</p>
        <h1 className="mt-1 font-display text-4xl leading-tight sm:text-5xl">
          Almost there.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Confirm your details and pay in USD. Your room is held while you
          complete payment.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem] lg:gap-12">
        <div className="space-y-6">
          <section className="surface-card p-5 sm:p-6">
            <h2 className="font-display text-2xl">Guest details</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              We send the confirmation and host contact details to this email.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="guest-name">Full name</Label>
                <Input
                  id="guest-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Tendai Moyo"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="guest-email">Email</Label>
                <Input
                  id="guest-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="guest-phone">Phone / WhatsApp</Label>
                <Input
                  id="guest-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+263 77 123 4567"
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="guest-requests">
                  Special requests <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="guest-requests"
                  value={requests}
                  onChange={(event) => setRequests(event.target.value)}
                  placeholder="Late check-in, dietary needs, airport transfer…"
                  rows={3}
                />
              </div>
            </div>
          </section>

          <section className="surface-card p-5 sm:p-6">
            <h2 className="font-display text-2xl">Payment</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Payments are processed by Paynow. Card details never touch Tsvaga.
            </p>
            <div className="mt-4 space-y-2">
              <PaymentMethod
                icon={<SmartphoneIcon className="size-4" />}
                title="EcoCash / OneMoney"
                body="Pay from your mobile wallet."
              />
              <PaymentMethod
                icon={<CreditCardIcon className="size-4" />}
                title="Visa / Mastercard"
                body="Local and international cards accepted."
              />
            </div>
            {demoReference && (
              <div className="mt-4 rounded-xl border border-[#e7c283] bg-[#fdf1dc] p-4 text-sm text-[#7a5317] dark:border-[#6a5228] dark:bg-[#3a2c17] dark:text-[#e7c283]">
                <p className="font-semibold">Demo mode</p>
                <p className="mt-1 text-xs leading-relaxed">
                  Paynow credentials are not configured, so no real money will
                  move. Use the button below to mark this booking paid and see
                  the confirmation flow.
                </p>
                <p className="mt-2 font-mono text-[11px]">
                  Reference {demoReference}
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-lift)]">
            <div className="relative aspect-[16/9]">
              <Image
                src={property.coverImage}
                alt={property.name}
                fill
                sizes="24rem"
                className="object-cover"
              />
              <Badge className="absolute left-3 top-3" variant="secondary">
                {plan.name}
              </Badge>
            </div>
            <div className="p-5">
              <h2 className="text-base font-semibold">{property.name}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {property.city} · {unit.name}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-3 text-xs">
                <div>
                  <p className="font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Check in
                  </p>
                  <p className="mt-1 font-medium">{formatDate(checkIn)}</p>
                  <p className="text-muted-foreground">
                    from {property.checkInTime}
                  </p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Check out
                  </p>
                  <p className="mt-1 font-medium">{formatDate(checkOut)}</p>
                  <p className="text-muted-foreground">
                    by {property.checkOutTime}
                  </p>
                </div>
                <div className="col-span-2 mt-1 flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDaysIcon className="size-3.5" />
                  {nights} night{nights === 1 ? "" : "s"} · {adults} adult
                  {adults === 1 ? "" : "s"}
                  {children > 0
                    ? ` · ${children} child${children === 1 ? "" : "ren"}`
                    : ""}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    {formatUsd(stay.nightlyTotalCents)} × {nights} night
                    {nights === 1 ? "" : "s"}
                  </span>
                  <span>{formatUsd(stay.subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Service fees</span>
                  <span className="text-primary">Included</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2.5 text-base font-semibold">
                  <span>Total due</span>
                  <span>{formatUsd(stay.totalCents)}</span>
                </div>
              </div>

              {demoReference ? (
                <div className="mt-4 space-y-2">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={payDemo}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <CheckIcon className="size-4" />
                    )}
                    Complete demo payment
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={abandon}
                    disabled={submitting}
                  >
                    Cancel and release room
                  </Button>
                </div>
              ) : (
                <Button
                  className="mt-4 w-full"
                  size="lg"
                  onClick={handlePay}
                  disabled={submitting || !stay.available}
                >
                  {submitting ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <LockIcon className="size-4" />
                  )}
                  Continue to payment
                </Button>
              )}

              <div className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <ShieldCheckIcon className="size-3" />
                  Verified operator · secure Paynow checkout
                </p>
                <p>
                  Free cancellation until 7 days before check-in. See the rate
                  policy for details.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PaymentMethod({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
