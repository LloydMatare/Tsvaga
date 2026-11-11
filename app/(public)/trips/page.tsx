"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CompassIcon,
  Loader2Icon,
  StarIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatUsd } from "@/lib/format";
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

export default function TripsPage() {
  const { isAuthenticated } = useConvexAuth();
  const bookings = useQuery(api.bookings.mine);

  if (!isAuthenticated) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
        <div className="surface-card max-w-md p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <CompassIcon className="size-5" />
          </span>
          <h1 className="mt-4 font-display text-3xl">Your trips live here</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sign in to see upcoming stays, download receipts and review places
            you&apos;ve visited.
          </p>
          <Button asChild className="mt-6 w-full" size="lg">
            <Link href="/sign-in?redirect_url=%2Ftrips">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (bookings === undefined) {
    return (
      <div className="container-page space-y-4 py-10">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  const upcoming = bookings.filter((booking) =>
    ["pending_payment", "confirmed", "checked_in"].includes(booking.status),
  );
  const past = bookings.filter(
    (booking) => !["pending_payment", "confirmed", "checked_in"].includes(booking.status),
  );

  return (
    <div className="container-page py-8 sm:py-10">
      <p className="eyebrow">My trips</p>
      <h1 className="mt-1 font-display text-4xl leading-tight sm:text-5xl">
        Where you&apos;re going next.
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Confirmations, host details and receipts for every Tsvaga booking.
      </p>

      {bookings.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<CompassIcon className="size-5" />}
          title="No trips yet"
          description="When you book a stay, it will appear here with your confirmation code and host contact."
          action={
            <Button asChild>
              <Link href="/stays">Find a stay</Link>
            </Button>
          }
        />
      ) : (
        <Tabs defaultValue="upcoming" className="mt-8">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming
              <span className="ml-1.5 text-xs text-muted-foreground">
                {upcoming.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="past">
              Past
              <span className="ml-1.5 text-xs text-muted-foreground">
                {past.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="all">
              All
              <span className="ml-1.5 text-xs text-muted-foreground">
                {bookings.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-5">
            <TripList bookings={upcoming} />
          </TabsContent>
          <TabsContent value="past" className="mt-5">
            <TripList bookings={past} />
          </TabsContent>
          <TabsContent value="all" className="mt-5">
            <TripList bookings={bookings} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

type TripBooking = {
  _id: Id<"bookings">;
  code: string;
  status: string;
  paymentStatus: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalCents: number;
  adults: number;
  children: number;
  propertyId: Id<"properties">;
  propertyName: string;
  propertySlug: string;
  propertyCity: string;
  coverImage: string;
  unitName: string;
  canReview: boolean;
  hasReview: boolean;
};

function TripList({ bookings }: { bookings: TripBooking[] }) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDaysIcon className="size-5" />}
        title="Nothing here yet"
        description="Book a stay and it will show up in this list."
        action={
          <Button asChild variant="outline">
            <Link href="/stays">Browse stays</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <TripCard key={booking._id} booking={booking} />
      ))}
    </div>
  );
}

function TripCard({ booking }: { booking: TripBooking }) {
  const status = statusCopy[booking.status] ?? {
    label: booking.status,
    variant: "muted" as const,
  };
  const [openReview, setOpenReview] = useState(false);

  return (
    <>
      <div className="surface-card overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="relative aspect-[16/9] shrink-0 sm:aspect-auto sm:w-56">
            {booking.coverImage ? (
              <Image
                src={booking.coverImage}
                alt={booking.propertyName}
                fill
                sizes="(max-width: 640px) 100vw, 14rem"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {booking.code}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-xl leading-tight">
                  {booking.propertyName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {booking.propertyCity} · {booking.unitName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-semibold">
                  {formatUsd(booking.totalCents)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {booking.paymentStatus === "paid" ? "Paid" : "Not paid"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDaysIcon className="size-3.5" />
                {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
              </span>
              <span>
                {booking.nights} night{booking.nights === 1 ? "" : "s"} ·{" "}
                {booking.adults} adult{booking.adults === 1 ? "" : "s"}
                {booking.children > 0 ? ` · ${booking.children} children` : ""}
              </span>
            </div>

            <div className="mt-auto flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm" variant="outline">
                <Link href={`/booking/${booking.code}`}>
                  View booking
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              </Button>
              {booking.status === "pending_payment" && (
                <Button asChild size="sm">
                  <Link href={`/booking/${booking.code}`}>Complete payment</Link>
                </Button>
              )}
              {booking.canReview && (
                <Button size="sm" onClick={() => setOpenReview(true)}>
                  <StarIcon className="size-3.5" />
                  Write a review
                </Button>
              )}
              {booking.hasReview && (
                <Badge variant="success" className="self-center">
                  Reviewed
                </Badge>
              )}
              {booking.propertySlug && (
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/stays/${booking.propertySlug}`}>View stay</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReviewDialog
        open={openReview}
        onOpenChange={setOpenReview}
        bookingId={booking._id}
        propertyName={booking.propertyName}
      />
    </>
  );
}

function ReviewDialog({
  open,
  onOpenChange,
  bookingId,
  propertyName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: Id<"bookings">;
  propertyName: string;
}) {
  const createReview = useMutation(api.reviews.create);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (body.trim().length < 10) {
      toast.error("Tell other travellers a little more (at least 10 characters).");
      return;
    }
    setPending(true);
    try {
      await createReview({
        bookingId,
        rating,
        title: title || "A lovely stay",
        body,
      });
      toast.success("Review published. Thank you!");
      onOpenChange(false);
      setTitle("");
      setBody("");
      setRating(5);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not publish the review.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review your stay</DialogTitle>
          <DialogDescription>
            How was {propertyName}? Your review helps other travellers choose
            well.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Rating</Label>
            <div className="mt-1.5 flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setRating(index + 1)}
                  aria-label={`${index + 1} star${index === 0 ? "" : "s"}`}
                  className="rounded p-0.5"
                >
                  <StarIcon
                    className={cn(
                      "size-6 transition-colors",
                      index < rating
                        ? "fill-[#d9a350] text-[#d9a350]"
                        : "text-border",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="review-title">Title</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Felt like staying with family"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="review-body">Your review</Label>
            <Textarea
              id="review-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              placeholder="What stood out? The room, the food, the host, the location…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2Icon className="size-4 animate-spin" />}
            Publish review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
