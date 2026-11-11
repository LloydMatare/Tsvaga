"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { FilterIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/empty-state";
import { PropertyCard } from "@/components/property-card";
import { SearchForm } from "@/components/search-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AMENITIES,
  CITIES,
  PROPERTY_TYPES,
  type PropertyType,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const amenityFilters = [
  "Wi-Fi",
  "Backup power",
  "Swimming pool",
  "Secure parking",
  "Restaurant",
  "Breakfast",
  "Family rooms",
  "Safari drives",
];

type Sort = "recommended" | "price_asc" | "price_desc" | "rating";

export function StaysBrowser() {
  const params = useSearchParams();
  const router = useRouter();
  const city = params.get("city") ?? undefined;
  const checkIn = params.get("checkIn") ?? undefined;
  const checkOut = params.get("checkOut") ?? undefined;
  const guests = Number(params.get("guests") ?? "2") || 2;

  const [q, setQ] = useState("");
  const [propertyType, setPropertyType] = useState<"all" | PropertyType>("all");
  const [sort, setSort] = useState<Sort>("recommended");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [instantOnly, setInstantOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const queryArgs = useMemo(
    () => ({
      q: q.trim() || undefined,
      city,
      checkIn,
      checkOut,
      guests,
      propertyType: propertyType === "all" ? undefined : propertyType,
      minPriceCents: minPrice ? Number(minPrice) * 100 : undefined,
      maxPriceCents: maxPrice ? Number(maxPrice) * 100 : undefined,
      amenities: amenities.length > 0 ? amenities : undefined,
      instantBook: instantOnly || undefined,
      sort,
      limit: 24,
    }),
    [
      q,
      city,
      checkIn,
      checkOut,
      guests,
      propertyType,
      minPrice,
      maxPrice,
      amenities,
      instantOnly,
      sort,
    ],
  );

  const data = useQuery(api.properties.search, queryArgs);
  const activeFilterCount =
    amenities.length +
    (propertyType !== "all" ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (instantOnly ? 1 : 0);

  function toggleAmenity(amenity: string) {
    setAmenities((current) =>
      current.includes(amenity)
        ? current.filter((item) => item !== amenity)
        : [...current, amenity],
    );
  }

  function clearFilters() {
    setQ("");
    setPropertyType("all");
    setMinPrice("");
    setMaxPrice("");
    setAmenities([]);
    setInstantOnly(false);
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-col gap-2">
        <p className="eyebrow">Stays</p>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">
          {city ? `Stays in ${city}` : "Every stay, one search."}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          {checkIn && checkOut
            ? `Showing availability for ${formatDate(checkIn)} – ${formatDate(
                checkOut,
              )} for ${guests} guest${guests === 1 ? "" : "s"}.`
            : "Compare verified lodges, guesthouses, hotels and safari camps across Zimbabwe."}
        </p>
      </div>

      <div className="mt-6">
        <SearchForm
          variant="compact"
          initialCity={city}
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          initialGuests={guests}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside
          className={cn(
            "lg:sticky lg:top-24 lg:self-start",
            !showFilters && "hidden lg:block",
          )}
        >
          <div className="surface-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontalIcon className="size-4" />
                Filters
              </h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-primary hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Search
                </label>
                <div className="relative mt-1.5">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    placeholder="Lodge, city, feature"
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  City
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <FilterPill
                    active={!city}
                    onClick={() => {
                      const next = new URLSearchParams(params.toString());
                      next.delete("city");
                      router.replace(`/stays?${next.toString()}`);
                    }}
                  >
                    All
                  </FilterPill>
                  {CITIES.map((name) => (
                    <FilterPill
                      key={name}
                      active={city === name}
                      onClick={() => {
                        const next = new URLSearchParams(params.toString());
                        next.set("city", name);
                        router.replace(`/stays?${next.toString()}`);
                      }}
                    >
                      {name}
                    </FilterPill>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Property type
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <FilterPill
                    active={propertyType === "all"}
                    onClick={() => setPropertyType("all")}
                  >
                    All
                  </FilterPill>
                  {PROPERTY_TYPES.map((type) => (
                    <FilterPill
                      key={type.value}
                      active={propertyType === type.value}
                      onClick={() => setPropertyType(type.value)}
                    >
                      {type.label}
                    </FilterPill>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Price per night (USD)
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Min"
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Must have
                </p>
                <div className="mt-2 space-y-2.5">
                  {amenityFilters.map((amenity) => (
                    <label
                      key={amenity}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={amenities.includes(amenity)}
                        onCheckedChange={() => toggleAmenity(amenity)}
                      />
                      {amenity}
                    </label>
                  ))}
                  {AMENITIES.length > amenityFilters.length && (
                    <p className="text-[11px] text-muted-foreground">
                      More filters coming soon.
                    </p>
                  )}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={instantOnly}
                  onCheckedChange={(checked) => setInstantOnly(Boolean(checked))}
                />
                Instant book only
              </label>
            </div>
          </div>
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setShowFilters((value) => !value)}
              >
                <FilterIcon className="size-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                {data === undefined
                  ? "Searching stays…"
                  : `${data.count} stay${data.count === 1 ? "" : "s"} found`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Sort by
              </span>
              <Select value={sort} onValueChange={(value) => setSort(value as Sort)}>
                <SelectTrigger size="sm" className="w-[11rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="price_asc">Price: low to high</SelectItem>
                  <SelectItem value="price_desc">Price: high to low</SelectItem>
                  <SelectItem value="rating">Guest rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {data === undefined ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : data.results.length === 0 ? (
            <EmptyState
              className="mt-5"
              icon={<SearchIcon className="size-5" />}
              title="No stays match those filters"
              description="Try removing a filter, widening your dates or searching a different city."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {data.results.map((property, index) => (
                <PropertyCard
                  key={property._id}
                  property={property}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  priority={index < 3}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
