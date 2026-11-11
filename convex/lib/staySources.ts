import { seedStayDetails } from "./seedStayDetails";

export const MAX_SOURCES_PER_CYCLE = 13;
export const REFRESH_CRON = "0 5 1,15 * *";
export const MAX_HTML_BYTES = 2_000_000;
export const MAX_PHOTOS = 8;
export const MAX_REVIEWS = 5;

export type StaySource = {
  slug: string;
  url: string;
  provider: string;
  aliases: string[];
  ownerKey: string;
  website?: string;
};

const definitions: Array<[string, string, string[]]> = [
  ["pamusha-lodge-victoria-falls", "owner-1", ["Pamusha"]],
  ["zambezi-sands-river-lodge", "owner-1", ["Zambezi Sands"]],
  ["kwaterry-guest-lodge-harare", "owner-2", ["KwaTerry", "Kwa Terry"]],
  ["bronte-garden-hotel-harare", "owner-2", ["Bronte"]],
  [
    "n1-city-hotel-harare",
    "owner-2",
    ["N1 Hotel Samora Machel", "Samora Machel Harare"],
  ],
  ["bulawayo-grand-lodge", "owner-3", ["Grand Palm"]],
  ["matobo-hills-retreat", "owner-3", ["Matobo Hills Lodge"]],
  ["nyanga-trout-mist-lodge", "owner-4", ["Troutbeck"]],
  ["vumba-forest-guesthouse", "owner-4", ["Forest Creek"]],
  ["kariba-lakeview-lodge", "owner-1", ["Sunset Lakeview Lodge"]],
  ["great-zimbabwe-guesthouse", "owner-3", ["Great Zimbabwe Hotel"]],
  ["chinhoyi-caves-lodge", "owner-2", ["Chinhoyi Caves Motel"]],
  ["victoria-falls-backpackers", "owner-1", ["Victoria Falls Backpackers"]],
];

export const staySources: StaySource[] = definitions.map(
  ([slug, ownerKey, aliases]) => {
    const url = seedStayDetails[slug].sourceUrl;
    const isAggregator = new URL(url).hostname.endsWith("hotels.com");
    return {
      slug,
      ownerKey,
      aliases,
      url,
      provider: isAggregator
        ? "Hotels.com"
        : new URL(url).hostname.replace(/^www\./, ""),
      ...(!isAggregator ? { website: new URL(url).origin + "/" } : {}),
    };
  },
);

export function getStaySource(slug: string) {
  return staySources.find((source) => source.slug === slug);
}

export function refreshCycle(now: number) {
  const date = new Date(now);
  return `${date.toISOString().slice(0, 7)}-${date.getUTCDate() < 15 ? "01" : "15"}`;
}

export function publicHttpsUrl(
  value: unknown,
  base?: string,
): string | undefined {
  if (typeof value !== "string" || value.length > 2048) return;
  try {
    const url = new URL(value, base);
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return;
    const host = url.hostname.toLowerCase();
    // Host allowlists below further restrict fetch and image destinations.
    if (
      !host.includes(".") ||
      host.includes(":") ||
      /^\d/.test(host) ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(host)
    )
      return;
    return url.href;
  } catch {
    return;
  }
}

export function sourcePhotoUrl(value: unknown, source: StaySource) {
  const url = publicHttpsUrl(value, source.url);
  if (!url) return;
  const parsed = new URL(url);
  const ownHost = new URL(source.url).hostname;
  const allowedHost =
    parsed.hostname === ownHost ||
    (source.slug === "matobo-hills-retreat" &&
      parsed.hostname === "cb0528c2.delivery.rocketcdn.me") ||
    (source.slug === "vumba-forest-guesthouse" &&
      parsed.hostname === "pub-c7dca0170fc54d3f90adb45158a92059.r2.dev") ||
    (source.slug === "kariba-lakeview-lodge" &&
      parsed.hostname === "images.trvl-media.com");
  if (!allowedHost || !/\.(?:jpe?g|png|webp)(?:$|\?)/i.test(url)) return;
  if (
    /(?:logo|icon|placeholder|stock|cozystay|template|avatar)/i.test(
      parsed.pathname,
    )
  )
    return;
  if (
    !/^\/(?:wp-content\/uploads\/|wp-content\/themes\/pamusha\/assets\/img\/|images\/|properties\/|rooms\/|lodging\/)/.test(
      parsed.pathname,
    )
  )
    return;
  return url;
}
