"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import {
  ArrowRightIcon,
  BanknoteIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  CircleDollarSignIcon,
  LayoutDashboardIcon,
  Loader2Icon,
  PencilIcon,
  ShieldAlertIcon,
  StoreIcon,
  TrendingUpIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CITIES } from "@/lib/constants";
import { formatDate, formatUsd } from "@/lib/format";
import { BlockDatesDialog } from "./block-dates-dialog";
import { PropertyForm } from "./property-form";

const bookingStatus: Record<
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

export default function DashboardPage() {
  const { isAuthenticated } = useConvexAuth();
  const viewer = useQuery(api.users.me);
  const overview = useQuery(api.bookings.operatorOverview);
  const mine = useQuery(api.properties.mine);
  const bookings = useQuery(api.bookings.operatorList);

  if (!isAuthenticated) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
        <div className="surface-card max-w-md p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <LayoutDashboardIcon className="size-5" />
          </span>
          <h1 className="mt-4 font-display text-3xl">Operator dashboard</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sign in to manage rooms, rates, availability and bookings.
          </p>
          <Button asChild className="mt-6 w-full" size="lg">
            <Link href="/sign-in?redirect_url=%2Fdashboard">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (overview === undefined || mine === undefined) {
    return (
      <div className="container-page space-y-5 py-10">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (overview === null || mine === null) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-lg text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <StoreIcon className="size-6" />
          </span>
          <h1 className="mt-5 font-display text-4xl">No operator profile yet</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Create an operator profile to list properties and receive bookings.
            If you&apos;re just exploring, you can claim a seeded demo operator
            from the application page.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/list-your-property">Apply as an operator</Link>
            </Button>
            {viewer?.role === "admin" && (
              <Button asChild size="lg" variant="outline">
                <Link href="/admin">Admin dashboard</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { operator } = overview;
  const properties = mine.properties;
  const allUnits = properties.flatMap((property) =>
    property.units.map((unit) => ({
      _id: unit._id,
      name: `${property.name} — ${unit.name}`,
    })),
  );

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Operator dashboard</p>
          <h1 className="mt-1 font-display text-4xl leading-tight sm:text-5xl">
            {operator.businessName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge
              variant={
                operator.verificationStatus === "verified"
                  ? "success"
                  : operator.verificationStatus === "rejected"
                    ? "destructive"
                    : "warning"
              }
            >
              {operator.verificationStatus}
            </Badge>
            <span>
              {operator.city} · {properties.length} propert
              {properties.length === 1 ? "y" : "ies"}
            </span>
            <span>· {operator.commissionRateBps / 100}% commission</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/operators/${operator.slug}`}>
              View public profile
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </Button>
          <PropertyForm />
        </div>
      </div>

      {operator.verificationStatus !== "verified" && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#e7c283] bg-[#fdf1dc] p-4 text-[#7a5317] dark:border-[#6a5228] dark:bg-[#3a2c17] dark:text-[#e7c283]">
          <ShieldAlertIcon className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Verification pending</p>
            <p className="mt-0.5 text-xs leading-relaxed">
              Guests cannot book your rooms until our team verifies the
              operator. Keep your contact and payout details up to date.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<CircleDollarSignIcon className="size-4" />}
          label="Gross bookings"
          value={formatUsd(overview.grossCents)}
          hint="Paid, active stays"
        />
        <Stat
          icon={<TrendingUpIcon className="size-4" />}
          label="Commission"
          value={formatUsd(overview.commissionCents)}
          hint="Tsvaga fee"
        />
        <Stat
          icon={<BanknoteIcon className="size-4" />}
          label="Net payout"
          value={formatUsd(overview.netCents)}
          hint="After commission"
        />
        <Stat
          icon={<CalendarCheckIcon className="size-4" />}
          label="Upcoming stays"
          value={String(overview.upcoming)}
          hint={`${overview.pending} awaiting payment`}
        />
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">
            Bookings
            <span className="ml-1 text-xs text-muted-foreground">
              {overview.bookings}
            </span>
          </TabsTrigger>
          <TabsTrigger value="properties">
            Properties
            <span className="ml-1 text-xs text-muted-foreground">
              {properties.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div className="surface-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Recent bookings</h2>
                <span className="text-xs text-muted-foreground">
                  Last {overview.recent.length}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {overview.recent.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No bookings yet. Share your listing to get the first one.
                  </p>
                ) : (
                  overview.recent.map((booking) => {
                    const status = bookingStatus[booking.status] ?? {
                      label: booking.status,
                      variant: "muted" as const,
                    };
                    return (
                      <div
                        key={booking._id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {booking.guestName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {booking.code} · {formatDate(booking.checkIn)} ·{" "}
                            {booking.nights} night
                            {booking.nights === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">
                            {formatUsd(booking.totalCents)}
                          </span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="surface-card p-5">
                <h2 className="text-sm font-semibold">This month</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <Row label="Confirmed" value={String(overview.confirmed)} />
                  <Row label="Awaiting payment" value={String(overview.pending)} />
                  <Row label="Properties live" value={String(properties.filter((p) => p.status === "published").length)} />
                  <Row label="Room types" value={String(allUnits.length)} />
                </div>
                <Separator className="my-4" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Payouts are batched after check-in. Keep your payout details
                  current in Settings.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-secondary/25 p-5">
                <p className="text-sm font-semibold">Need a hand?</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  WhatsApp our operator team for help with photos, pricing or
                  availability.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <a href="https://wa.me/263770000000" target="_blank" rel="noreferrer">
                    WhatsApp support
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="mt-5">
          {bookings === undefined ? (
            <Skeleton className="h-64 rounded-2xl" />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={<CalendarDaysIcon className="size-5" />}
              title="No bookings yet"
              description="Once guests book your rooms, they will appear here."
            />
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const status = bookingStatus[booking.status] ?? {
                  label: booking.status,
                  variant: "muted" as const,
                };
                return (
                  <div key={booking._id} className="surface-card p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {booking.code}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold">
                          {booking.guestName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.guestEmail}
                          {booking.guestPhone ? ` · ${booking.guestPhone}` : ""}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {booking.propertyName} · {booking.unitName} ·{" "}
                          {formatDate(booking.checkIn)} –{" "}
                          {formatDate(booking.checkOut)} · {booking.nights} night
                          {booking.nights === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold">
                          {formatUsd(booking.totalCents)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {booking.paymentStatus.replace(/_/g, " ")}
                        </p>
                        <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                          <BookingActions
                            bookingId={booking._id}
                            status={booking.status}
                          />
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/booking/${booking.code}`}>Open</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                    {booking.specialRequests && (
                      <p className="mt-3 rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Request:
                        </span>{" "}
                        {booking.specialRequests}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="properties" className="mt-5">
          {properties.length === 0 ? (
            <EmptyState
              icon={<StoreIcon className="size-5" />}
              title="Add your first property"
              description="Publish a property with at least one room type to start taking bookings."
              action={<PropertyForm />}
            />
          ) : (
            <div className="space-y-3">
              {properties.map((property) => (
                <div key={property._id} className="surface-card overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative aspect-[16/9] shrink-0 sm:aspect-auto sm:w-52">
                      <Image
                        src={property.coverImage}
                        alt={property.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 13rem"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant={
                                property.status === "published"
                                  ? "success"
                                  : "muted"
                              }
                            >
                              {property.status}
                            </Badge>
                            {property.featured && (
                              <Badge variant="heritage">Featured</Badge>
                            )}
                          </div>
                          <h3 className="mt-1.5 font-display text-xl">
                            {property.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {property.city} · From{" "}
                            {formatUsd(property.priceFromCents)} / night
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/stays/${property.slug}`}>Preview</Link>
                          </Button>
                          <StatusToggle
                            propertyId={property._id}
                            status={property.status}
                          />
                          <BlockDatesDialog
                            units={property.units.map((unit) => ({
                              _id: unit._id,
                              name: unit.name,
                            }))}
                          />
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {property.units.map((unit) => (
                          <div
                            key={unit._id}
                            className="rounded-xl border border-border/70 p-3 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium">{unit.name}</p>
                              <Badge variant="muted">
                                {unit.status === "active" ? "Active" : "Hidden"}
                              </Badge>
                            </div>
                            <p className="mt-1 text-muted-foreground">
                              {formatUsd(unit.basePriceCents)} / night ·{" "}
                              {unit.capacityAdults} adults
                              {unit.capacityChildren > 0
                                ? ` + ${unit.capacityChildren} children`
                                : ""}{" "}
                              · {unit.totalUnits} room
                              {unit.totalUnits === 1 ? "" : "s"}
                            </p>
                            {unit.ratePlans[0] && (
                              <p className="mt-1 text-muted-foreground">
                                {unit.ratePlans[0].name} ·{" "}
                                {formatUsd(unit.ratePlans[0].priceCents)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-5">
          <OperatorSettings
            operator={{
              _id: operator._id,
              businessName: operator.businessName,
              description: operator.description,
              contactEmail: operator.contactEmail,
              contactPhone: operator.contactPhone,
              whatsapp: operator.whatsapp ?? "",
              city: operator.city,
              payoutMethod: operator.payoutMethod,
              payoutDetails: operator.payoutDetails ?? "",
              instantBook: operator.instantBook,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          {icon}
        </span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl">{value}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function BookingActions({
  bookingId,
  status,
}: {
  bookingId: Id<"bookings">;
  status: string;
}) {
  const update = useMutation(api.bookings.updateStatus);
  const [pending, setPending] = useState<string | null>(null);

  async function setStatus(next: "confirmed" | "checked_in" | "completed" | "declined") {
    setPending(next);
    try {
      await update({ bookingId, status: next });
      toast.success("Booking updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update booking.",
      );
    } finally {
      setPending(null);
    }
  }

  if (status === "confirmed") {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStatus("checked_in")}
          disabled={pending !== null}
        >
          {pending === "checked_in" && (
            <Loader2Icon className="size-3.5 animate-spin" />
          )}
          Check in
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setStatus("declined")}
          disabled={pending !== null}
        >
          Cancel
        </Button>
      </>
    );
  }

  if (status === "checked_in") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setStatus("completed")}
        disabled={pending !== null}
      >
        {pending === "completed" && (
          <Loader2Icon className="size-3.5 animate-spin" />
        )}
        Complete stay
      </Button>
    );
  }

  if (status === "pending_payment") {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setStatus("declined")}
        disabled={pending !== null}
      >
        Cancel
      </Button>
    );
  }

  return null;
}

function StatusToggle({
  propertyId,
  status,
}: {
  propertyId: Id<"properties">;
  status: string;
}) {
  const setStatus = useMutation(api.properties.setStatus);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      await setStatus({
        propertyId,
        status: status === "published" ? "paused" : "published",
      });
      toast.success(status === "published" ? "Property unpublished." : "Property published.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update the property.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={pending}>
      {pending && <Loader2Icon className="size-3.5 animate-spin" />}
      {status === "published" ? "Unpublish" : "Publish"}
    </Button>
  );
}

function OperatorSettings({
  operator,
}: {
  operator: {
    _id: Id<"operators">;
    businessName: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
    whatsapp: string;
    city: string;
    payoutMethod: "ecocash" | "bank" | "cash";
    payoutDetails: string;
    instantBook: boolean;
  };
}) {
  const update = useMutation(api.operators.update);
  const [businessName, setBusinessName] = useState(operator.businessName);
  const [description, setDescription] = useState(operator.description);
  const [contactEmail, setContactEmail] = useState(operator.contactEmail);
  const [contactPhone, setContactPhone] = useState(operator.contactPhone);
  const [whatsapp, setWhatsapp] = useState(operator.whatsapp);
  const [city, setCity] = useState(operator.city);
  const [payoutMethod, setPayoutMethod] = useState(operator.payoutMethod);
  const [payoutDetails, setPayoutDetails] = useState(operator.payoutDetails);
  const [instantBook, setInstantBook] = useState(operator.instantBook);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      await update({
        businessName,
        description,
        contactEmail,
        contactPhone,
        whatsapp,
        city,
        payoutMethod,
        payoutDetails,
        instantBook,
      });
      toast.success("Operator profile updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save your changes.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface-card max-w-2xl space-y-4 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <PencilIcon className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Operator profile</h2>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="op-name">Business name</Label>
        <Input
          id="op-name"
          value={businessName}
          onChange={(event) => setBusinessName(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="op-description">Description</Label>
        <Textarea
          id="op-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="op-email">Contact email</Label>
          <Input
            id="op-email"
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="op-phone">Contact phone</Label>
          <Input
            id="op-phone"
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="op-whatsapp">WhatsApp</Label>
          <Input
            id="op-whatsapp"
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Payout method</Label>
          <Select
            value={payoutMethod}
            onValueChange={(value) =>
              setPayoutMethod(value as "ecocash" | "bank" | "cash")
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ecocash">EcoCash</SelectItem>
              <SelectItem value="bank">Bank transfer</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="op-payout">Payout details</Label>
          <Input
            id="op-payout"
            value={payoutDetails}
            onChange={(event) => setPayoutDetails(event.target.value)}
          />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={instantBook}
          onChange={(event) => setInstantBook(event.target.checked)}
          className="size-4 rounded border-border"
        />
        Allow instant booking across my properties
      </label>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2Icon className="size-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
