import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, MapPinIcon } from "lucide-react";

import { SearchForm } from "@/components/search-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DESTINATIONS } from "@/lib/constants";

export const metadata = {
  title: "Destinations",
  description:
    "Explore Zimbabwe by destination — Victoria Falls, Harare, Bulawayo, Nyanga, Kariba, Hwange and more.",
};

const notes = [
  {
    title: "Two nights minimum",
    body: "Most of Zimbabwe is best seen slowly. We flag minimum stays up front so there are no surprises.",
  },
  {
    title: "USD pricing",
    body: "All rates are in USD. EcoCash, OneMoney and card payments are supported through Paynow.",
  },
  {
    title: "Local support",
    body: "Our team and hosts are on the ground in Zimbabwe. WhatsApp us if plans change.",
  },
];

export default function DestinationsPage() {
  return (
    <div className="pb-16">
      <section className="border-b border-border/70 bg-secondary/25">
        <div className="container-page py-12 sm:py-16">
          <Badge variant="outline">Zimbabwe, by region</Badge>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl">
            Pick a place.
            <span className="block italic text-primary">We&apos;ll find the stay.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            From the Zambezi to the eastern highlands, these are the corners of
            Zimbabwe our travellers return to. Search by dates to see live
            availability.
          </p>
          <div className="mt-8 max-w-4xl">
            <SearchForm />
          </div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DESTINATIONS.map((destination, index) => (
            <Link
              key={destination.slug}
              href={`/stays?city=${encodeURIComponent(destination.name)}`}
              className="group image-zoom relative overflow-hidden rounded-2xl"
            >
              <div className="relative aspect-[4/5]">
                <Image
                  src={destination.image}
                  alt={destination.name}
                  fill
                  priority={index < 3}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/5" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/65">
                  <MapPinIcon className="size-3" />
                  Zimbabwe
                </p>
                <h2 className="mt-1 font-display text-3xl">
                  {destination.name}
                </h2>
                <p className="mt-1 text-sm text-white/75">{destination.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold">
                  View stays
                  <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {notes.map((note) => (
            <div key={note.title} className="surface-card p-5">
              <p className="text-sm font-semibold">{note.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {note.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl">Not sure where to start?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us your dates and budget and we&apos;ll send three good
              options.
            </p>
          </div>
          <Button asChild>
            <a
              href="https://wa.me/263770000000?text=Hi%20Tsvaga%2C%20can%20you%20help%20me%20choose%20a%20stay%3F"
              target="_blank"
              rel="noreferrer"
            >
              Ask on WhatsApp
              <ArrowRightIcon className="size-4" />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
