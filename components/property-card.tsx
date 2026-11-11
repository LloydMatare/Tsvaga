import Image from "next/image";
import Link from "next/link";
import { BedDoubleIcon, MapPinIcon, UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/favorite-button";
import { Stars } from "@/components/stars";
import { formatDate, formatUsd, nightsBetween } from "@/lib/format";
import { propertyTypeLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

export type PropertyCardData = {
  _id: Id<"properties">;
  name: string;
  slug: string;
  summary: string;
  city: string;
  region: string;
  propertyType: string;
  coverImage: string;
  amenities: string[];
  ratingAvg: number;
  reviewCount: number;
  instantBook: boolean;
  featured: boolean;
  priceFromCents: number;
  livePriceFromCents?: number;
  liveTotalCents?: number | null;
  operatorName?: string;
  operatorVerified?: boolean;
  policies?: string;
};

export function PropertyCard({
  property,
  checkIn,
  checkOut,
  priority = false,
  className,
}: {
  property: PropertyCardData;
  checkIn?: string;
  checkOut?: string;
  priority?: boolean;
  className?: string;
}) {
  const price = property.livePriceFromCents ?? property.priceFromCents;
  const isDemo = property.policies?.startsWith("Demo booking data:") ?? false;
  const nights =
    checkIn && checkOut ? Math.max(nightsBetween(checkIn, checkOut), 1) : 0;
  const href =
    checkIn && checkOut
      ? `/stays/${property.slug}?checkIn=${checkIn}&checkOut=${checkOut}`
      : `/stays/${property.slug}`;

  return (
    <article
      className={cn(
        "group image-zoom relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Link href={href} aria-label={`View ${property.name}`} className="absolute inset-0">
          <Image
            src={property.coverImage}
            alt={property.name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </Link>
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="backdrop-blur">
              {propertyTypeLabel(property.propertyType)}
            </Badge>
            {property.featured && (
              <Badge variant="heritage" className="backdrop-blur">
                Guest favourite
              </Badge>
            )}
          </div>
          <FavoriteButton propertyId={property._id} />
        </div>
        {property.instantBook && (
          <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold text-primary shadow-sm backdrop-blur">
            Instant book
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={href}>
              <h3 className="truncate text-base font-semibold leading-snug group-hover:text-primary">
                {property.name}
              </h3>
            </Link>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPinIcon className="size-3" />
              {property.city}
              {property.region ? ` · ${property.region}` : ""}
            </p>
          </div>
          <div className="text-right">
            <Stars rating={property.ratingAvg} count={property.reviewCount} />
            {isDemo && <p className="mt-1 text-[10px] text-muted-foreground">Demo reviews</p>}
          </div>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {property.summary}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/60 pt-3">
          <div>
            {isDemo && <p className="mb-1 text-[10px] text-muted-foreground">Demo rate</p>}
            <p className="text-lg font-semibold leading-none">
              {formatUsd(price)}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                / night
              </span>
            </p>
            {nights > 0 && property.liveTotalCents ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatUsd(property.liveTotalCents, true)} total · {nights}{" "}
                night{nights === 1 ? "" : "s"}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {property.operatorVerified ? "Verified operator" : "Local host"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {checkIn && checkOut ? (
              <span className="hidden text-right sm:block">
                {formatDate(checkIn, { year: undefined })} –{" "}
                {formatDate(checkOut, { year: undefined })}
              </span>
            ) : (
              <>
                <UsersIcon className="size-3" />
                <BedDoubleIcon className="size-3" />
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
