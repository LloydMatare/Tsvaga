import { load } from "cheerio/slim";
import { seedStayDetails } from "./seedStayDetails";
import type { SourceData } from "./staySourceSchema";
import {
  MAX_HTML_BYTES,
  MAX_PHOTOS,
  MAX_REVIEWS,
  publicHttpsUrl,
  sourcePhotoUrl,
  type StaySource,
} from "./staySources";

type JsonObject = Record<string, unknown>;
const object = (value: unknown): JsonObject =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
const array = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value == null ? [] : [value];
const text = (value: unknown, limit = 300): string | undefined =>
  typeof value === "string" && value.trim()
    ? value.replace(/\s+/g, " ").trim().slice(0, limit)
    : undefined;
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const matches = (value: string, source: StaySource) =>
  source.aliases.some((alias) =>
    ` ${normalize(value)} `.includes(` ${normalize(alias)} `),
  );
const numeric = (value: unknown): number | undefined => {
  if (typeof value !== "number" && typeof value !== "string") return;
  if (typeof value === "string" && !/^-?\d+(?:\.\d+)?$/.test(value.trim()))
    return;
  const result = Number(value);
  return Number.isFinite(result) ? result : undefined;
};

export function validGeo(latValue: unknown, lngValue: unknown) {
  const lat = numeric(latValue);
  const lng = numeric(lngValue);
  // All configured stays are in Zimbabwe. Reject swapped or unrelated coordinates.
  if (
    lat === undefined ||
    lng === undefined ||
    lat < -23 ||
    lat > -15 ||
    lng < 25 ||
    lng > 34
  )
    return;
  return { lat, lng };
}

export function validRating(value: unknown): SourceData["rating"] {
  const rating = object(value);
  const score = numeric(rating.ratingValue);
  const best = numeric(rating.bestRating) ?? 5; // Schema.org default scale.
  const worst = numeric(rating.worstRating) ?? 1;
  if (
    score === undefined ||
    best <= worst ||
    best > 100 ||
    score < worst ||
    score > best ||
    worst < 0
  )
    return;
  const count = numeric(rating.reviewCount ?? rating.ratingCount);
  return {
    value: score,
    best,
    worst,
    ...(count !== undefined && Number.isSafeInteger(count) && count >= 0
      ? { count }
      : {}),
  };
}

function phone(value: unknown) {
  const candidate = text(value, 60)?.replace(/^tel:/, "").trim();
  if (!candidate || !/^\+?[\d ()-]{7,50}$/.test(candidate)) return;
  const digits = candidate.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return;
  return candidate;
}

function address(value: unknown) {
  if (typeof value === "string") return text(value, 400);
  const data = object(value);
  return text(
    [
      "streetAddress",
      "addressLocality",
      "addressRegion",
      "postalCode",
      "addressCountry",
    ]
      .map((key) => {
        const part = data[key];
        return typeof part === "string" ? part : text(object(part).name);
      })
      .filter(Boolean)
      .join(", "),
    400,
  );
}

function openingHours(value: JsonObject) {
  const result: string[] = [];
  for (const entry of array(value.openingHours)) {
    const line = text(entry, 150);
    if (line) result.push(line);
  }
  for (const raw of array(value.openingHoursSpecification).slice(0, 14)) {
    const entry = object(raw);
    const opens = text(entry.opens, 8);
    const closes = text(entry.closes, 8);
    const days = array(entry.dayOfWeek)
      .map((day) => text(day)?.replace(/^https?:\/\/schema.org\//, ""))
      .filter(Boolean)
      .join(", ");
    if (
      days &&
      opens &&
      closes &&
      /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(opens) &&
      /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(closes)
    ) {
      result.push(`${days}: ${opens}–${closes}`);
    }
  }
  return result.length ? [...new Set(result)].slice(0, 14) : undefined;
}

function pricing(value: JsonObject): SourceData["pricing"] {
  const result: NonNullable<SourceData["pricing"]> = [];
  const range = text(value.priceRange);
  if (range && /(?:USD|US\$|ZAR|ZWL|ZWG|\$|€|£|\bR\s*\d)/i.test(range)) {
    result.push({ text: range });
  }
  for (const raw of array(value.offers).slice(0, 5)) {
    const offer = object(raw);
    const amount = numeric(offer.price ?? offer.lowPrice);
    const currency = text(offer.priceCurrency);
    if (
      !amount ||
      amount < 0 ||
      amount > 1_000_000 ||
      !currency ||
      !/^[A-Z]{3}$/.test(currency)
    )
      continue;
    const description = text(offer.description, 500);
    const basis = text(object(offer.priceSpecification).unitText, 150);
    const validFrom = text(offer.validFrom, 40);
    const validThrough = text(offer.validThrough ?? offer.priceValidUntil, 40);
    result.push({
      text: `${currency} ${amount}${description ? ` — ${description}` : ""}`,
      currency,
      amount,
      ...(basis ? { basis } : {}),
      ...(validFrom ? { validFrom } : {}),
      ...(validThrough ? { validThrough } : {}),
    });
  }
  return result.length ? result.slice(0, 5) : undefined;
}

function reviews(value: unknown, source: StaySource): SourceData["reviews"] {
  const seen = new Set<string>();
  const result: NonNullable<SourceData["reviews"]> = [];
  for (const raw of array(value).slice(0, 30)) {
    const entry = object(raw);
    const author = text(
      typeof entry.author === "string"
        ? entry.author
        : object(entry.author).name,
      100,
    );
    const body = text(entry.reviewBody, 1000);
    if (!author || !body) continue;
    const date = text(entry.datePublished, 40);
    const url = publicHttpsUrl(entry.url, source.url);
    const safeUrl =
      url && new URL(url).hostname === new URL(source.url).hostname
        ? url
        : source.url;
    const key = `${normalize(author)}|${date ?? ""}|${body}`.slice(0, 1200);
    if (seen.has(key)) continue;
    seen.add(key);
    const rating = validRating(entry.reviewRating);
    result.push({
      key,
      author,
      text: body,
      url: safeUrl,
      ...(date ? { date } : {}),
      ...(rating ? { rating } : {}),
    });
    if (result.length === MAX_REVIEWS) break;
  }
  return result.length ? result : undefined;
}

const addressPatterns: Record<string, RegExp> = {
  "pamusha-lodge-victoria-falls":
    /583\s+Manyika Road\s*,?\s*Victoria Falls(?:\s*,\s*Zimbabwe)?/i,
  "bulawayo-grand-lodge":
    /91\s+Circular Drive\s*,?\s*Burnside(?:\s*,?\s*Bulawayo)?/i,
  "bronte-garden-hotel-harare":
    /132\s+Baines Avenue(?:\s*,?\s*(?:Corner|Cnr)\s+(?:Simon|S\.)\s+Muzenda\s+St(?:reet)?)?(?:\s*,?\s*Harare)?/i,
  "n1-city-hotel-harare": /126\s+Samora Machel Avenue(?:\s*,?\s*Harare)?/i,
  "victoria-falls-backpackers": /357\s+Gibson R(?:oa)?d\s*,?\s*Victoria Falls/i,
  "nyanga-trout-mist-lodge":
    /1\s+Nyamaropa Road\s*,?\s*Troutbeck\s*,?\s*Nyanga(?:\s*,?\s*Zimbabwe)?/i,
};

export function extractStay(html: string, source: StaySource): SourceData {
  if (new TextEncoder().encode(html).byteLength > MAX_HTML_BYTES) {
    throw new Error("response_too_large");
  }
  const $ = load(html);
  const heading = $("h1")
    .toArray()
    .map((node) => $(node).text())
    .join(" ");
  const title = $("title").text();
  if (!matches(`${title} ${heading}`, source))
    throw new Error("property_mismatch");
  const nodes: JsonObject[] = [];
  function visit(value: unknown, depth = 0) {
    if (depth > 8 || nodes.length >= 300) return;
    if (Array.isArray(value)) {
      for (const child of value.slice(0, 100)) visit(child, depth + 1);
    } else if (value && typeof value === "object") {
      const entry = object(value);
      nodes.push(entry);
      if (entry["@graph"]) visit(entry["@graph"], depth + 1);
      if (entry.mainEntity) visit(entry.mainEntity, depth + 1);
    }
  }
  $('script[type="application/ld+json"]')
    .slice(0, 20)
    .each((_, script) => {
      try {
        visit(JSON.parse($(script).text()));
      } catch {
        /* Ignore invalid source markup. */
      }
    });
  const lodgingTypes = new Set([
    "Hotel",
    "LodgingBusiness",
    "Resort",
    "Hostel",
    "BedAndBreakfast",
    "Motel",
    "Campground",
    "TouristAccommodation",
    "GuestHouse",
  ]);
  const lodging = nodes.find(
    (node) =>
      array(node["@type"]).some((type) => lodgingTypes.has(String(type))) &&
      typeof node.name === "string" &&
      matches(node.name, source),
  );
  const data: SourceData = {};
  const namedHeading = $("h1")
    .toArray()
    .map((node) => text($(node).text(), 120))
    .find((line) => line && matches(line, source));
  const name = text(lodging?.name, 120) ?? namedHeading;
  if (name) data.name = name;
  if (source.website) data.website = source.website;

  if (lodging) {
    const location = address(lodging.address);
    if (location && !/Napa|Alps|CozyStay|Lorem ipsum/i.test(location))
      data.address = location;
    const geo = object(lodging.geo);
    const coords = validGeo(geo.latitude, geo.longitude);
    if (coords) data.geo = coords;
    const number = phone(lodging.telephone);
    if (number) data.phone = number;
    const hours = openingHours(lodging);
    if (hours) data.hours = hours;
    const rating = validRating(lodging.aggregateRating);
    if (rating) data.rating = rating;
    const excerpts = reviews(lodging.review, source);
    if (excerpts) data.reviews = excerpts;
    const rates = pricing(lodging);
    if (rates) data.pricing = rates;
  }
  // On official sites, use published contact links rather than unrelated prose.
  if (!data.phone && source.website) {
    const candidate = $('a[href^="tel:"]')
      .toArray()
      .map((node) => {
        try {
          return phone(decodeURIComponent($(node).attr("href") ?? ""));
        } catch {
          return undefined;
        }
      })
      .find(Boolean);
    if (candidate) data.phone = candidate;
  }
  const readable = $.root().clone();
  readable.find("script, style, nav").remove();
  const plain = readable.text().replace(/[ \t]+/g, " ");
  if (!data.address) {
    const pattern = addressPatterns[source.slug];
    const found = pattern ? text(plain.match(pattern)?.[0], 200) : undefined;
    if (found) data.address = found;
  }
  if (!data.geo && source.slug === "victoria-falls-backpackers") {
    const coords = plain.match(
      /Latitude:\s*(-?\d+\.\d+)\s*\|\s*Longitude:\s*(-?\d+\.\d+)/i,
    );
    const found = coords ? validGeo(coords[1], coords[2]) : undefined;
    if (found) data.geo = found;
  }
  if (!data.hours && source.slug === "kwaterry-guest-lodge-harare") {
    const found = plain.match(
      /Sun\s*[–-]\s*Sat:\s*\d{1,2}\s*am\s*[–-]\s*\d{1,2}\s*pm/i,
    );
    if (found) data.hours = [found[0]];
  }
  if (!data.pricing && source.slug === "pamusha-lodge-victoria-falls") {
    const found = [
      ...plain.matchAll(
        /(?:From\s+)?\$\d+(?:\.\d{2})?\s*(?:\/night|per night)(?:,\s*bed only)?/gi,
      ),
    ];
    if (found.length)
      data.pricing = found.slice(0, 5).map((match) => ({ text: match[0] }));
  }
  const candidates = [
    ...array(lodging?.image).map((image) =>
      typeof image === "string" ? image : object(image).url,
    ),
    ...(seedStayDetails[source.slug]?.images ?? []).filter((url) =>
      html.includes(url),
    ),
  ];
  const photos = [
    ...new Set(
      candidates
        .map((value) => sourcePhotoUrl(value, source))
        .filter((url): url is string => Boolean(url)),
    ),
  ].slice(0, MAX_PHOTOS);
  if (photos.length) data.photos = photos;
  if (!Object.keys(data).some((key) => key !== "website"))
    throw new Error("no_property_data");
  return data;
}
