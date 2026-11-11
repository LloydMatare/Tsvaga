"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import {
  BadgeCheckIcon,
  BanknoteIcon,
  CircleDollarSignIcon,
  Loader2Icon,
  LockIcon,
  ShieldCheckIcon,
  StarIcon,
  StoreIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDaysISO, formatDate, formatUsd, todayISO } from "@/lib/format";

const statusVariant: Record<
  string,
  "success" | "warning" | "destructive" | "muted"
> = {
  pending_payment: "warning",
  confirmed: "success",
  checked_in: "success",
  completed: "muted",
  cancelled: "destructive",
  declined: "destructive",
  expired: "destructive",
  pending: "warning",
  paid: "success",
  failed: "destructive",
};

export default function AdminPage() {
  const { isAuthenticated } = useConvexAuth();
  const viewer = useQuery(api.users.me);
  const isAdmin = viewer?.role === "admin";

  const overview = useQuery(api.admin.overview, isAdmin ? {} : "skip");
  const operators = useQuery(api.admin.operators, isAdmin ? {} : "skip");
  const properties = useQuery(api.admin.properties, isAdmin ? {} : "skip");
  const bookings = useQuery(api.admin.bookings, isAdmin ? {} : "skip");
  const payouts = useQuery(api.payouts.adminList, isAdmin ? {} : "skip");
  const bootstrap = useMutation(api.users.bootstrapAdmin);
  const [bootstrapping, setBootstrapping] = useState(false);

  async function becomeAdmin() {
    setBootstrapping(true);
    try {
      await bootstrap({});
      toast.success("You are now an admin. Welcome.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not grant admin access.",
      );
    } finally {
      setBootstrapping(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
        <div className="surface-card max-w-md p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <LockIcon className="size-5" />
          </span>
          <h1 className="mt-4 font-display text-3xl">Admin access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with an admin account to manage Tsvaga.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link href="/sign-in?redirect_url=%2Fadmin">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!viewer) {
    return (
      <div className="container-page py-10">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-6 h-64 rounded-2xl" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-lg text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <ShieldCheckIcon className="size-6" />
          </span>
          <h1 className="mt-5 font-display text-4xl">Admin access required</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Signed in as <span className="font-medium">{viewer.name}</span> (
            {viewer.role}). If this is a fresh deployment with no admin yet, you
            can claim the first admin account below. After that, admins are
            granted by an existing admin.
          </p>
          <Button
            className="mt-6"
            size="lg"
            onClick={becomeAdmin}
            disabled={bootstrapping}
          >
            {bootstrapping && <Loader2Icon className="size-4 animate-spin" />}
            Become the first admin
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Alternatively, run{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
              npx convex run users:bootstrapAdmin
            </code>{" "}
            from a signed-in context is not possible — use this button.
          </p>
        </div>
      </div>
    );
  }

  if (
    overview === undefined ||
    operators === undefined ||
    properties === undefined ||
    bookings === undefined ||
    payouts === undefined
  ) {
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

  const operatorNames = new Map(
    operators.map((operator) => [operator._id, operator.businessName]),
  );

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Tsvaga admin</p>
          <h1 className="mt-1 font-display text-4xl leading-tight sm:text-5xl">
            Marketplace control.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {overview.admin.name}. Verify operators, curate
            properties and settle payouts.
          </p>
        </div>
        <Badge variant="success">Admin</Badge>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStat
          icon={<UsersIcon className="size-4" />}
          label="Users"
          value={String(overview.users)}
          hint={`${overview.operators} operators`}
        />
        <AdminStat
          icon={<StoreIcon className="size-4" />}
          label="Properties"
          value={String(overview.properties)}
          hint={`${overview.published} published`}
        />
        <AdminStat
          icon={<CircleDollarSignIcon className="size-4" />}
          label="Gross bookings"
          value={formatUsd(overview.grossCents)}
          hint={`${overview.bookings} bookings`}
        />
        <AdminStat
          icon={<BanknoteIcon className="size-4" />}
          label="Commission"
          value={formatUsd(overview.commissionCents)}
          hint={`${overview.pendingOperators} operators pending`}
        />
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="operators">
            Operators
            {overview.pendingOperators > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                {overview.pendingOperators}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <div className="surface-card p-5">
            <h2 className="text-sm font-semibold">Recent bookings</h2>
            <div className="mt-4 space-y-2">
              {overview.recentBookings.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No bookings yet.
                </p>
              ) : (
                overview.recentBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{booking.guestName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {booking.code} · {formatDate(booking.checkIn)} ·{" "}
                        {booking.nights} night{booking.nights === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        {formatUsd(booking.totalCents)}
                      </span>
                      <Badge variant={statusVariant[booking.status] ?? "muted"}>
                        {booking.status.replace(/_/g, " ")}
                      </Badge>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/booking/${booking.code}`}>Open</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="operators" className="mt-5">
          <div className="space-y-2">
            {operators.map((operator) => (
              <div
                key={operator._id}
                className="surface-card flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold">
                      {operator.businessName}
                    </p>
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
                    <Badge variant="muted">{operator.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {operator.city} · {operator.contactEmail} ·{" "}
                    {operator.commissionRateBps / 100}% commission ·{" "}
                    {operator.payoutMethod}
                  </p>
                </div>
                <OperatorVerification
                  operatorId={operator._id}
                  status={operator.verificationStatus}
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="properties" className="mt-5">
          <div className="space-y-2">
            {properties.map((property) => (
              <div
                key={property._id}
                className="surface-card flex flex-wrap items-center gap-3 p-3"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={property.coverImage}
                    alt={property.name}
                    fill
                    sizes="4rem"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold">{property.name}</p>
                    <Badge
                      variant={
                        property.status === "published" ? "success" : "muted"
                      }
                    >
                      {property.status}
                    </Badge>
                    {property.featured && (
                      <Badge variant="heritage">Featured</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {property.city} · {property.operatorName} ·{" "}
                    {formatUsd(property.priceFromCents)} / night ·{" "}
                    {property.ratingAvg.toFixed(1)}★ ({property.reviewCount})
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <FeatureToggle
                    propertyId={property._id}
                    featured={property.featured}
                  />
                  <AdminPropertyStatus
                    propertyId={property._id}
                    status={property.status}
                  />
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/stays/${property.slug}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="mt-5">
          <div className="space-y-2">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="surface-card flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold">{booking.guestName}</p>
                    <Badge variant={statusVariant[booking.status] ?? "muted"}>
                      {booking.status.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {booking.code}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {booking.propertyName} · {formatDate(booking.checkIn)} –{" "}
                    {formatDate(booking.checkOut)} · {booking.paymentStatus}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {formatUsd(booking.totalCents)}
                  </span>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/booking/${booking.code}`}>Open</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payouts" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
            <PayoutForm operators={operators} />
            <div className="space-y-2">
              {payouts.length === 0 ? (
                <div className="surface-card p-8 text-center text-sm text-muted-foreground">
                  No payouts yet. Create a batch for a settled operator.
                </div>
              ) : (
                payouts.map((payout) => (
                  <div key={payout._id} className="surface-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">
                          {operatorNames.get(payout.operatorId) ?? "Operator"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payout.periodStart)} –{" "}
                          {formatDate(payout.periodEnd)}
                        </p>
                      </div>
                      <Badge variant={statusVariant[payout.status] ?? "muted"}>
                        {payout.status}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Gross</p>
                        <p className="font-medium">
                          {formatUsd(payout.grossCents)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Commission</p>
                        <p className="font-medium">
                          {formatUsd(payout.commissionCents)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Net</p>
                        <p className="font-medium">
                          {formatUsd(payout.netCents)}
                        </p>
                      </div>
                    </div>
                    {payout.status !== "paid" ? (
                      <MarkPaid payoutId={payout._id} />
                    ) : (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Paid {payout.reference ? `· ${payout.reference}` : ""}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminStat({
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

function OperatorVerification({
  operatorId,
  status,
}: {
  operatorId: Id<"operators">;
  status: string;
}) {
  const setVerification = useMutation(api.operators.setVerification);
  const [pending, setPending] = useState<string | null>(null);

  async function update(next: "verified" | "rejected" | "pending") {
    setPending(next);
    try {
      await setVerification({ operatorId, verificationStatus: next });
      toast.success(`Operator marked ${next}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update operator.",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {status !== "verified" && (
        <Button
          size="sm"
          onClick={() => update("verified")}
          disabled={pending !== null}
        >
          {pending === "verified" ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <BadgeCheckIcon className="size-3.5" />
          )}
          Verify
        </Button>
      )}
      {status !== "rejected" && (
        <Button
          size="sm"
          variant="outline"
          className="text-destructive"
          onClick={() => update("rejected")}
          disabled={pending !== null}
        >
          Reject
        </Button>
      )}
      {status === "verified" && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => update("pending")}
          disabled={pending !== null}
        >
          Reset
        </Button>
      )}
    </div>
  );
}

function FeatureToggle({
  propertyId,
  featured,
}: {
  propertyId: Id<"properties">;
  featured: boolean;
}) {
  const setFeatured = useMutation(api.properties.adminSetFeatured);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      await setFeatured({ propertyId, featured: !featured });
      toast.success(featured ? "Removed from featured." : "Added to featured.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update feature.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      size="sm"
      variant={featured ? "default" : "outline"}
      onClick={toggle}
      disabled={pending}
    >
      {pending ? (
        <Loader2Icon className="size-3.5 animate-spin" />
      ) : (
        <StarIcon className="size-3.5" />
      )}
      {featured ? "Featured" : "Feature"}
    </Button>
  );
}

function AdminPropertyStatus({
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
      toast.success(status === "published" ? "Property paused." : "Property published.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update property.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={pending}>
      {pending && <Loader2Icon className="size-3.5 animate-spin" />}
      {status === "published" ? "Pause" : "Publish"}
    </Button>
  );
}

function PayoutForm({
  operators,
}: {
  operators: Array<{ _id: Id<"operators">; businessName: string }>;
}) {
  const createBatch = useMutation(api.payouts.createBatch);
  const [operatorId, setOperatorId] = useState<string>(operators[0]?._id ?? "");
  const [periodStart, setPeriodStart] = useState(addDaysISO(todayISO(), -30));
  const [periodEnd, setPeriodEnd] = useState(todayISO());
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!operatorId) {
      toast.error("Choose an operator.");
      return;
    }
    setPending(true);
    try {
      await createBatch({
        operatorId: operatorId as Id<"operators">,
        periodStart,
        periodEnd,
      });
      toast.success("Payout batch created.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create the batch.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface-card h-fit space-y-3 p-5">
      <h2 className="text-sm font-semibold">Create payout batch</h2>
      <div className="space-y-1.5">
        <Label>Operator</Label>
        <Select value={operatorId} onValueChange={setOperatorId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose operator" />
          </SelectTrigger>
          <SelectContent>
            {operators.map((operator) => (
              <SelectItem key={operator._id} value={operator._id}>
                {operator.businessName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="payout-start">From</Label>
          <Input
            id="payout-start"
            type="date"
            value={periodStart}
            onChange={(event) => setPeriodStart(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payout-end">To</Label>
          <Input
            id="payout-end"
            type="date"
            value={periodEnd}
            onChange={(event) => setPeriodEnd(event.target.value)}
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2Icon className="size-4 animate-spin" />}
        Create batch
      </Button>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Includes paid bookings with check-out inside the period. Commission is
        deducted automatically.
      </p>
    </form>
  );
}

function MarkPaid({ payoutId }: { payoutId: Id<"payouts"> }) {
  const markPaid = useMutation(api.payouts.markPaid);
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    try {
      await markPaid({ payoutId, reference: reference || "manual" });
      toast.success("Payout marked paid.");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not mark payout paid.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="mt-3">
          <BanknoteIcon className="size-3.5" />
          Mark paid
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark payout paid</DialogTitle>
          <DialogDescription>
            Add the EcoCash or bank reference so the operator can reconcile it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="payout-reference">Payment reference</Label>
          <Input
            id="payout-reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="EcoCash ref / bank ref"
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2Icon className="size-4 animate-spin" />}
            Confirm paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
