"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  HandCoinsIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  SparklesIcon,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { PropertyCard } from "@/components/property-card";
import { SearchForm } from "@/components/search-form";
import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DESTINATIONS } from "@/lib/constants";

const trustPoints = [
  {
    icon: ShieldCheckIcon,
    title: "Verified local operators",
    body: "Every stay is checked by our team before it goes live.",
  },
  {
    icon: SmartphoneIcon,
    title: "Pay with EcoCash or card",
    body: "Secure USD checkout through Paynow, built for Zimbabwe.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Instant confirmation",
    body: "Book in minutes and get your confirmation code right away.",
  },
  {
    icon: HandCoinsIcon,
    title: "Fair local pricing",
    body: "No surprise fees. The price you see is the price you pay.",
  },
];

const steps = [
  {
    title: "Search where you're going",
    body: "Compare lodges, guesthouses and safari camps across Zimbabwe with live availability.",
  },
  {
    title: "Book and pay securely",
    body: "Reserve your room and pay in USD with EcoCash, OneMoney or a card via Paynow.",
  },
  {
    title: "Show up and switch off",
    body: "Your booking code and host details arrive instantly. The rest is holiday.",
  },
];

export default function HomePage() {
  const featured = useQuery(api.properties.featured);

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=2000&q=85"
            alt="Zimbabwe landscape at golden hour"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#101a12]/85 via-[#101a12]/55 to-[#101a12]/20" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="container-page flex min-h-[36rem] flex-col justify-center py-16 sm:min-h-[40rem] sm:py-24">
          <div className="max-w-2xl text-white">
            <Badge
              variant="outline"
              className="border-white/25 bg-white/10 text-white backdrop-blur"
            >
              <SparklesIcon className="size-3" />
              Zimbabwe, booked locally
            </Badge>
            <h1 className="mt-5 font-display text-5xl leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Find your
              <span className="block italic text-[#d9edc9]">Zimbabwe.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              From the mist of Nyanga to the thunder of Victoria Falls. Book
              verified lodges, guesthouses and safari camps with local support
              and USD pricing.
            </p>
          </div>

          <div className="mt-10 max-w-4xl">
            <SearchForm />
          </div>
        </div>
      </section>

      <section className="container-page -mt-2 grid gap-3 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {trustPoints.map((point) => (
          <div
            key={point.title}
            className="surface-card flex items-start gap-3 p-4"
          >
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <point.icon className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">{point.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {point.body}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="container-page py-10 sm:py-14">
        <SectionHeading
          eyebrow="Handpicked stays"
          title="Places worth packing for."
          description="A mix of city guesthouses, riverside lodges and bush camps — each one run by people who know the area."
          action={
            <Button asChild variant="outline">
              <Link href="/stays">
                Browse all stays
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          }
        />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured === undefined
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            : featured.map((property, index) => (
                <PropertyCard
                  key={property._id}
                  property={property}
                  priority={index < 3}
                />
              ))}
        </div>
      </section>

      <section className="border-y border-border/70 bg-secondary/25 py-12 sm:py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Where to next"
            title="Six reasons to leave the city."
            description="Tap a destination to see stays, or search by dates to check live availability."
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DESTINATIONS.map((destination, index) => (
              <Link
                key={destination.slug}
                href={`/stays?city=${encodeURIComponent(destination.name)}`}
                className={`group image-zoom relative overflow-hidden rounded-2xl ${
                  index === 0 ? "sm:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={destination.image}
                    alt={destination.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
                  <div>
                    <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/70">
                      <MapPinIcon className="size-3" />
                      Zimbabwe
                    </p>
                    <h3 className="mt-1 font-display text-2xl">
                      {destination.name}
                    </h3>
                    <p className="text-sm text-white/75">{destination.blurb}</p>
                  </div>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-transform group-hover:translate-x-1">
                    <ArrowRightIcon className="size-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
              Less admin. More Zimbabwe.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Tsvaga is built for how people actually travel here — diaspora
              coming home, families on holiday and locals taking a weekend off.
            </p>
            <div className="mt-8 rounded-2xl border border-border/70 bg-card p-6">
              <p className="font-display text-xl leading-snug">
                “We booked a lodge in Nyanga on a Friday and were drinking tea by
                the fire on Saturday afternoon.”
              </p>
              <p className="mt-4 text-sm font-medium">Rudo &amp; Tafadzwa</p>
              <p className="text-xs text-muted-foreground">Harare → Nyanga</p>
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="surface-card flex gap-4 p-5 sm:p-6"
              >
                <span className="font-display text-3xl text-primary/30">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-12 sm:py-16">
          <div className="absolute -right-24 -top-24 size-72 rounded-full border border-white/10" />
          <div className="absolute -bottom-32 -left-10 size-96 rounded-full border border-white/10" />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                For operators
              </p>
              <h2 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
                Fill your rooms. Keep your independence.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
                List your lodge, guesthouse or safari camp on Tsvaga. We bring
                the bookings and handle online payments. You keep the guest
                relationship and pay a simple per-booking commission.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button asChild variant="secondary" size="lg">
                <Link href="/list-your-property">
                  List your property
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/list-your-property#how">How it works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
