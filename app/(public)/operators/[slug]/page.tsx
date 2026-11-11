"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  MailIcon,
  MapPinIcon,
  MessageCircleIcon,
  PhoneIcon,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/empty-state";
import { PropertyCard } from "@/components/property-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function OperatorPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const data = useQuery(api.properties.forOperator, { slug });

  if (data === undefined) {
    return (
      <div className="container-page space-y-5 py-10">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[4/3] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="container-page py-24 text-center">
        <p className="eyebrow">Operator not found</p>
        <h1 className="mt-2 font-display text-4xl">
          This host isn&apos;t listed.
        </h1>
        <Button asChild className="mt-6">
          <Link href="/stays">Browse stays</Link>
        </Button>
      </div>
    );
  }

  const { operator, properties } = data;

  return (
    <div className="container-page py-8 sm:py-10">
      <Link
        href="/stays"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        All stays
      </Link>

      <div className="mt-4 rounded-3xl border border-border/70 bg-secondary/25 p-6 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Local operator</Badge>
              {operator.verificationStatus === "verified" && (
                <Badge variant="success">
                  <BadgeCheckIcon className="size-3" />
                  Verified by Tsvaga
                </Badge>
              )}
            </div>
            <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              {operator.businessName}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPinIcon className="size-3.5" />
              {operator.city}, Zimbabwe
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {operator.description}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {operator.whatsapp && (
              <Button asChild>
                <a
                  href={`https://wa.me/${operator.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircleIcon className="size-4" />
                  WhatsApp
                </a>
              </Button>
            )}
            {operator.contactEmail && (
              <Button asChild variant="outline">
                <a href={`mailto:${operator.contactEmail}`}>
                  <MailIcon className="size-4" />
                  Email
                </a>
              </Button>
            )}
            {operator.contactPhone && (
              <Button asChild variant="ghost">
                <a href={`tel:${operator.contactPhone}`}>
                  <PhoneIcon className="size-4" />
                  {operator.contactPhone}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Stays</p>
          <h2 className="mt-1 font-display text-3xl">
            {properties.length} propert{properties.length === 1 ? "y" : "ies"} by{" "}
            {operator.businessName}
          </h2>
        </div>
        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
          <Link href={`/stays?city=${encodeURIComponent(operator.city)}`}>
            More in {operator.city}
          </Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No published stays yet"
          description="This operator is still setting up their listings. Check back soon."
        />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property._id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
