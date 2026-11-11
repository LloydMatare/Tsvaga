"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import {
  ArrowLeftIcon,
  BedDoubleIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronRightIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersIcon,
  WifiIcon,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { FavoriteButton } from "@/components/favorite-button";
import { Stars } from "@/components/stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { mealPlanLabel, propertyTypeLabel } from "@/lib/constants";
import {
  addDaysISO,
  formatDate,
  formatUsd,
  nightsBetween,
  todayISO,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type Unit = {
  _id: string;
  name: string;
  description: string;
  capacityAdults: number;
  capacityChildren: number;
  bedrooms: number;
  beds: string;
  sizeSqm?: number;
  basePriceCents: number;
  ratePlans: Array<{
    _id: string;
    name: string;
    priceCents: number;
    minNights: number;
    mealPlan: string;
    refundable: boolean;
    cancellationPolicy: string;
  }>;
};

export function PropertyDetail({
  slug,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: {
  slug: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}) {
  const detail = useQuery(api.properties.getDetail, { slug });
  const today = todayISO();
  const [checkIn, setCheckIn] = useState(
    initialCheckIn || addDaysISO(today, 1),
  );
  const [checkOut, setCheckOut] = useState(
    initialCheckOut || addDaysISO(today, 3),
  );
  const [adults, setAdults] = useState(initialGuests ?? 2);
  const [children, setChildren] = useState(0);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();

  const units = (detail?.units ?? []) as unknown as Unit[];
  const selectedUnit =
    units.find((unit) => unit._id === selectedUnitId) ?? units[0];
  const selectedPlan =
    selectedUnit?.ratePlans.find((plan) => plan._id === selectedPlanId) ??
    selectedUnit?.ratePlans[0];

  const quote = useQuery(
    api.bookings.quote,
    selectedUnit && selectedPlan
      ? {
          unitId: selectedUnit._id as never,
          ratePlanId: selectedPlan._id as never,
          checkIn,
          checkOut,
        }
      : "skip",
  );

  const nights = nightsBetween(checkIn, checkOut);
  const checkoutUrl = useMemo(() => {
    if (!selectedUnit || !selectedPlan) return "/stays";
    const params = new URLSearchParams({
      unit: selectedUnit._id,
      plan: selectedPlan._id,
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
    });
    return `/checkout?${params.toString()}`;
  }, [selectedUnit, selectedPlan, checkIn, checkOut, adults, children]);

  if (detail === undefined) {
    return (
      <div className="container-page space-y-5 py-10">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="aspect-[21/9] w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[1fr_23rem]">
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (detail === null) {
    return (
      <div className="container-page py-24 text-center">
        <p className="eyebrow">Not found</p>
        <h1 className="mt-2 font-display text-4xl">This stay has moved.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The link may be out of date, or the property is no longer listed.
        </p>
        <Button asChild className="mt-6">
          <Link href="/stays">Browse all stays</Link>
        </Button>
      </div>
    );
  }

  const { property, operator, reviews, isFavorite } = detail;
  const images = property.images.length > 0 ? property.images : [property.coverImage];
  const activeImage = images[Math.min(photoIndex, images.length - 1)];
  const minNights = selectedPlan?.minNights ?? 1;
  const canReserve =
    quote !== undefined &&
    quote !== null &&
    quote.stay.available &&
    selectedUnit !== undefined &&
    selectedPlan !== undefined;

  function reserve() {
    if (!isAuthenticated) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(checkoutUrl)}`);
      return;
    }
    router.push(checkoutUrl);
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <Link
        href={`/stays?city=${encodeURIComponent(property.city)}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        Stays in {property.city}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">
              {propertyTypeLabel(property.propertyType)}
            </Badge>
            {property.featured && <Badge variant="heritage">Guest favourite</Badge>}
            {operator?.verificationStatus === "verified" && (
              <Badge variant="success">
                <ShieldCheckIcon className="size-3" />
                Verified operator
              </Badge>
            )}
            {property.instantBook && <Badge variant="outline">Instant book</Badge>}
          </div>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            {property.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="size-3.5" />
              {property.address}, {property.city}
            </span>
            <Stars rating={property.ratingAvg} count={property.reviewCount} />
            {operator && <span>Hosted by {operator.businessName}</span>}
          </div>
        </div>
        <FavoriteButton
          propertyId={property._id}
          initialFavorite={isFavorite}
          className="static bg-muted text-foreground shadow-none hover:bg-muted/80"
        />
      </div>

      <div className="mt-6 grid gap-2 overflow-hidden rounded-2xl sm:grid-cols-[2.2fr_1fr]">
        <button
          type="button"
          onClick={() => setPhotoIndex(0)}
          className="relative aspect-[16/10] overflow-hidden sm:aspect-auto sm:min-h-[24rem]"
        >
          <Image
            src={activeImage}
            alt={property.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover"
          />
        </button>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
          {images.slice(1, 3).map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setPhotoIndex(index + 1)}
              className="relative aspect-[4/3] overflow-hidden sm:aspect-auto sm:min-h-0"
            >
              <Image
                src={image}
                alt={`${property.name} photo ${index + 2}`}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform hover:scale-105"
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_23rem] lg:gap-12">
        <div className="min-w-0">
          <section>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl">
                  {propertyTypeLabel(property.propertyType)} in {property.city}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {property.region} · {property.amenities.length} amenities ·{" "}
                  {units.length} room type{units.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
              {property.description}
            </p>
          </section>

          <Separator className="my-8" />

          <section>
            <h2 className="font-display text-2xl">What this place offers</h2>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {property.amenities.map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center gap-2.5 text-sm text-foreground/85"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    {amenity === "Wi-Fi" ? (
                      <WifiIcon className="size-3.5" />
                    ) : (
                      <CheckIcon className="size-3.5" />
                    )}
                  </span>
                  {amenity}
                </div>
              ))}
            </div>
          </section>

          <Separator className="my-8" />

          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl">Choose your room</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Rates are per room, per night in USD.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {units.map((unit) => {
                const plan = unit.ratePlans[0];
                const active = selectedUnit?._id === unit._id;
                return (
                  <div
                    key={unit._id}
                    className={cn(
                      "rounded-2xl border p-4 transition-colors",
                      active
                        ? "border-primary/50 bg-secondary/25"
                        : "border-border bg-card",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold">{unit.name}</h3>
                        <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
                          {unit.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <UsersIcon className="size-3.5" />
                            {unit.capacityAdults} adults
                            {unit.capacityChildren > 0
                              ? ` + ${unit.capacityChildren} children`
                              : ""}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <BedDoubleIcon className="size-3.5" />
                            {unit.beds}
                          </span>
                          {unit.sizeSqm && (
                            <span>{unit.sizeSqm} m²</span>
                          )}
                          {plan && (
                            <span>{mealPlanLabel(plan.mealPlan)}</span>
                          )}
                          {plan?.refundable && (
                            <span className="text-primary">Free cancellation</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold">
                          {formatUsd(plan?.priceCents ?? unit.basePriceCents)}
                          <span className="text-xs font-normal text-muted-foreground">
                            {" "}
                            / night
                          </span>
                        </p>
                        <Button
                          size="sm"
                          variant={active ? "default" : "outline"}
                          className="mt-2"
                          onClick={() => {
                            setSelectedUnitId(unit._id);
                            setSelectedPlanId(plan?._id ?? null);
                            document
                              .getElementById("book")
                              ?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                        >
                          {active ? "Selected" : "Select room"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <Separator className="my-8" />

          <section>
            <h2 className="font-display text-2xl">Good to know</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoCard title="Check-in / check-out">
                From {property.checkInTime} · out by {property.checkOutTime}
              </InfoCard>
              <InfoCard title="House rules">
                {property.houseRules.join(" · ")}
              </InfoCard>
              <InfoCard title="Cancellation">
                {selectedPlan?.cancellationPolicy ?? property.policies}
              </InfoCard>
              <InfoCard title="Payment">
                Pay in USD with EcoCash, OneMoney or card via Paynow.
              </InfoCard>
            </div>
          </section>

          <Separator className="my-8" />

          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl">
                Guest reviews
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {property.reviewCount} review
                  {property.reviewCount === 1 ? "" : "s"}
                </span>
              </h2>
              <span className="flex items-center gap-1 text-sm font-semibold">
                <StarIcon className="size-4 fill-[#d9a350] text-[#d9a350]" />
                {property.ratingAvg.toFixed(1)}
              </span>
            </div>
            {reviews.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Be the first to review this stay after your trip.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {reviews.map((review) => (
                  <div key={review._id} className="surface-card p-4">
                    <Stars rating={review.rating} showValue={false} />
                    <h3 className="mt-2 text-sm font-semibold">{review.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {review.body}
                    </p>
                    <p className="mt-3 text-[11px] font-medium">
                      {review.guestName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside id="book" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-lift)]">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-2xl font-semibold leading-none">
                  {formatUsd(selectedPlan?.priceCents ?? property.priceFromCents)}
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}
                    / night
                  </span>
                </p>
                <Stars
                  rating={property.ratingAvg}
                  count={property.reviewCount}
                  className="mt-2"
                />
              </div>
              {selectedUnit && (
                <Badge variant="muted">{selectedUnit.name}</Badge>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 rounded-xl border border-border px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Check in
                </span>
                <input
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCheckIn(value);
                    if (value && checkOut <= value) {
                      setCheckOut(addDaysISO(value, Math.max(nights, 1)));
                    }
                  }}
                  className="bg-transparent text-sm outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 rounded-xl border border-border px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Check out
                </span>
                <input
                  type="date"
                  value={checkOut}
                  min={addDaysISO(checkIn, 1)}
                  onChange={(event) => setCheckOut(event.target.value)}
                  className="bg-transparent text-sm outline-none"
                />
              </label>
            </div>

            <div className="mt-3 space-y-2 rounded-xl border border-border px-3 py-2">
              <Stepper
                label="Adults"
                value={adults}
                min={1}
                max={selectedUnit?.capacityAdults ?? 4}
                onChange={setAdults}
              />
              <Stepper
                label="Children"
                value={children}
                min={0}
                max={selectedUnit?.capacityChildren ?? 0}
                onChange={setChildren}
              />
            </div>

            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={reserve}
              disabled={!canReserve}
            >
              {isAuthenticated ? "Reserve" : "Sign in to book"}
              <ChevronRightIcon className="size-4" />
            </Button>

            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {canReserve
                ? `You won't be charged until the next step.`
                : quote && quote.stay.available === false
                  ? quote.stay.reason
                  : "Select dates and a room."}
            </p>

            {quote && quote.stay.available && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      {formatUsd(quote.stay.nightlyTotalCents)} ×{" "}
                      {quote.stay.nights} night
                      {quote.stay.nights === 1 ? "" : "s"}
                    </span>
                    <span>{formatUsd(quote.stay.subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service fees</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-semibold">
                    <span>Total</span>
                    <span>{formatUsd(quote.stay.totalCents)}</span>
                  </div>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <CalendarDaysIcon className="size-3" />
                  {formatDate(checkIn)} – {formatDate(checkOut)}
                </p>
              </>
            )}

            {nights > 0 && nights < minNights && (
              <p className="mt-2 text-[11px] text-destructive">
                Minimum stay is {minNights} night{minNights === 1 ? "" : "s"}.
              </p>
            )}
          </div>

          {operator && (
            <div className="mt-4 rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Your host
              </p>
              <p className="mt-2 text-sm font-semibold">{operator.businessName}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {operator.description}
              </p>
              {operator.whatsapp && (
                <p className="mt-2 text-xs text-muted-foreground">
                  WhatsApp {operator.whatsapp}
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label}`}
        >
          <MinusIcon className="size-3.5" />
        </Button>
        <span className="w-6 text-center text-sm font-medium">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Increase ${label}`}
        >
          <PlusIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
