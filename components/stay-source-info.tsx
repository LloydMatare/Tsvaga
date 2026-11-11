"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import type { SourceInfo } from "../convex/lib/staySourceSchema";

function checkedDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "Africa/Harare",
  }).format(timestamp);
}

function SourcePhoto({ url, name }: { url: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
      <Image
        src={failed ? "/stay-photo-unavailable.svg" : url}
        alt={
          failed
            ? "Property photo unavailable"
            : `${name} — photo from source website`
        }
        fill
        unoptimized
        sizes="(max-width: 640px) 100vw, 33vw"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function StaySourceInfo({
  info,
  sourceUrl,
  name,
}: {
  info?: SourceInfo;
  sourceUrl: string;
  name: string;
}) {
  const data = info?.data ?? {};
  const sourceLink = (label: string, url = sourceUrl) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline"
    >
      {label}
    </a>
  );
  function field(key: string, label: string, content?: ReactNode) {
    const provenance = info?.provenance[key];
    return (
      <div className="rounded-xl border border-border/70 p-4">
        <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
        <dd className="mt-1.5 text-sm">
          {content ?? "Not published or not yet verified"}
        </dd>
        {provenance && (
          <dd className="mt-2 text-[11px] text-muted-foreground">
            {sourceLink("Source", provenance.url)} · checked{" "}
            {checkedDate(provenance.checkedAt)}
          </dd>
        )}
      </div>
    );
  }
  return (
    <section aria-labelledby="source-details-heading" className="mt-8">
      <h2 id="source-details-heading" className="font-display text-2xl">
        From the property sources
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {sourceLink(info?.provider ?? "Property source")} · Scheduled for the
        1st and 15th of each month.
        {info?.lastSuccessAt
          ? ` Last successful extraction: ${checkedDate(info.lastSuccessAt)}.`
          : " Awaiting the first successful refresh."}
        {info?.status === "partial" &&
          " Some fields are unavailable; individual check dates appear below."}
        {info?.status === "error" &&
          " The latest refresh failed. Previously verified details are retained."}
        {(info?.status === "queued" || info?.status === "running") &&
          " A refresh is pending."}
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {field("name", "Published name", data.name)}
        {field("address", "Published address", data.address)}
        {field(
          "phone",
          "Phone",
          data.phone && (
            <a
              href={`tel:${data.phone.replace(/[^\d+]/g, "")}`}
              className="text-primary underline"
            >
              {data.phone}
            </a>
          ),
        )}
        {field(
          "website",
          "Official website",
          data.website && sourceLink("Visit website", data.website),
        )}
        {field(
          "geo",
          "GPS / directions",
          data.geo && (
            <>
              {data.geo.lat}, {data.geo.lng} ·{" "}
              {sourceLink(
                "Open map",
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.geo.lat},${data.geo.lng}`)}`,
              )}
            </>
          ),
        )}
        {field(
          "hours",
          "Published business hours (not check-in times)",
          data.hours?.length ? data.hours.join(" · ") : undefined,
        )}
        {field(
          "rating",
          `External rating${info ? ` — ${info.provider}` : ""}`,
          data.rating && (
            <>
              {data.rating.value} / {data.rating.best}
              {data.rating.count !== undefined
                ? ` (${data.rating.count} source ratings/reviews)`
                : ""}
              <p className="mt-1 text-xs text-muted-foreground">
                Reported by the source, not a Tsvaga-verified guest score.
              </p>
            </>
          ),
        )}
        {field(
          "pricing",
          "Advertised prices — informational only",
          data.pricing?.length ? (
            <>
              {data.pricing.map((price, index) => (
                <p key={index} className="mb-1">
                  {price.text}
                  {price.basis ? ` · ${price.basis}` : ""}
                  {price.validFrom ? ` · from ${price.validFrom}` : ""}
                  {price.validThrough ? ` · until ${price.validThrough}` : ""}
                </p>
              ))}
              <p className="mt-2 text-xs text-muted-foreground">
                Confirm dates, occupancy, currency and inclusions with the
                property. These are not Tsvaga booking quotes.
              </p>
            </>
          ) : undefined,
        )}
      </dl>
      <div className="mt-5">
        <h3 className="text-sm font-semibold">External review excerpts</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Attributed to the source, separate from Tsvaga guest reviews.
          {info?.provenance.reviews &&
            ` Checked ${checkedDate(info.provenance.reviews.checkedAt)}.`}
        </p>
        {data.reviews?.length ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {data.reviews.map((review) => (
              <blockquote
                key={review.key}
                className="rounded-xl border border-border/70 p-4"
              >
                <p className="text-sm leading-relaxed">{review.text}</p>
                <footer className="mt-2 text-xs text-muted-foreground">
                  {review.author}
                  {review.date ? ` · ${review.date}` : ""}
                  {review.rating
                    ? ` · ${review.rating.value}/${review.rating.best}`
                    : ""}
                  {" · "}
                  {sourceLink("Original source", review.url)}
                </footer>
              </blockquote>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No external review excerpts verified yet.
          </p>
        )}
      </div>
      <div className="mt-5">
        <h3 className="text-sm font-semibold">Photos from the source</h3>
        {data.photos?.length ? (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {data.photos.map((url) => (
                <SourcePhoto key={url} url={url} name={data.name ?? name} />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Photos: {sourceLink(info?.provider ?? "Property website")}
              {info?.provenance.photos &&
                ` · checked ${checkedDate(info.provenance.photos.checkedAt)}`}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No source photos verified by the refresh yet.
          </p>
        )}
      </div>
    </section>
  );
}
