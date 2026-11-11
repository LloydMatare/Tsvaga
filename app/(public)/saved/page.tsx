"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { HeartIcon } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/empty-state";
import { PropertyCard } from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function SavedPage() {
  const { isAuthenticated } = useConvexAuth();
  const favorites = useQuery(api.favorites.mine);

  if (!isAuthenticated) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
        <div className="surface-card max-w-md p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <HeartIcon className="size-5" />
          </span>
          <h1 className="mt-4 font-display text-3xl">Save what you love</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Tap the heart on any stay to keep it here for later. Sign in to see
            your saved places.
          </p>
          <Button asChild className="mt-6 w-full" size="lg">
            <Link href="/sign-in?redirect_url=%2Fsaved">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (favorites === undefined) {
    return (
      <div className="container-page py-10">
        <Skeleton className="h-10 w-56" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[4/3] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <p className="eyebrow">Saved stays</p>
      <h1 className="mt-1 font-display text-4xl leading-tight sm:text-5xl">
        Your shortlist.
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {favorites.length} place{favorites.length === 1 ? "" : "s"} saved. Prices
        update when you search with dates.
      </p>

      {favorites.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<HeartIcon className="size-5" />}
          title="No saved stays yet"
          description="Tap the heart on any stay to add it to your shortlist."
          action={
            <Button asChild>
              <Link href="/stays">Browse stays</Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((property) => (
            <PropertyCard key={property._id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
