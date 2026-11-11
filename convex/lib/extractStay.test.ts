import { describe, expect, it } from "vitest";
import { extractStay, validGeo, validRating } from "./extractStay";
import {
  getStaySource,
  publicHttpsUrl,
  refreshCycle,
  REFRESH_CRON,
  sourcePhotoUrl,
} from "./staySources";

const source = getStaySource("pamusha-lodge-victoria-falls")!;
// Entirely synthetic review and price fixtures; never imported into the app.
const lodging = {
  "@type": "LodgingBusiness",
  name: "Pamusha Lodge",
  address: {
    streetAddress: "583 Manyika Road",
    addressLocality: "Victoria Falls",
  },
  telephone: "+263 83 284 4367",
  geo: { latitude: "-17.92", longitude: "25.83" },
  openingHoursSpecification: [
    {
      dayOfWeek: ["https://schema.org/Monday"],
      opens: "08:00",
      closes: "17:00",
    },
  ],
  aggregateRating: {
    ratingValue: "8.7",
    bestRating: "10",
    worstRating: "0",
    reviewCount: "123",
  },
  review: [
    {
      author: { name: "Fixture Reviewer" },
      reviewBody: "Synthetic test excerpt",
      datePublished: "2026-01-01",
    },
  ],
  offers: {
    price: "180",
    priceCurrency: "USD",
    description: "Per person, breakfast included",
    priceSpecification: { unitText: "person/night" },
    validFrom: "2026-01-01",
    priceValidUntil: "2026-12-31",
  },
  image: [
    "https://pamusha.com/wp-content/themes/pamusha/assets/img/room-double.jpg",
    "https://pamusha.com/wp-content/uploads/logo.png",
    "https://unrelated.example/room.jpg",
  ],
};
const page = (value: unknown) =>
  `<title>Pamusha Lodge</title><h1>Pamusha Lodge</h1><script type="application/ld+json">${JSON.stringify(value)}</script>`;

describe("property extraction", () => {
  it("extracts property-matched graph data and preserves scales and price basis", () => {
    const data = extractStay(page({ "@graph": [lodging] }), source);
    expect(data.name).toBe("Pamusha Lodge");
    expect(data.address).toBe("583 Manyika Road, Victoria Falls");
    expect(data.geo).toEqual({ lat: -17.92, lng: 25.83 });
    expect(data.phone).toBe("+263 83 284 4367");
    expect(data.hours).toEqual(["Monday: 08:00–17:00"]);
    expect(data.rating).toEqual({ value: 8.7, best: 10, worst: 0, count: 123 });
    expect(data.reviews?.[0]).toMatchObject({
      author: "Fixture Reviewer",
      url: source.url,
    });
    expect(data.pricing?.[0]).toMatchObject({
      amount: 180,
      currency: "USD",
      basis: "person/night",
      validThrough: "2026-12-31",
    });
    expect(data.photos).toHaveLength(1);
  });
  it("ignores generic organization ratings and mismatched lodging records", () => {
    const data = extractStay(
      page({
        "@graph": [
          { ...lodging, "@type": "Organization" },
          { ...lodging, name: "Unrelated Resort" },
        ],
      }),
      source,
    );
    expect(data.rating).toBeUndefined();
    expect(data.reviews).toBeUndefined();
    expect(data.geo).toBeUndefined();
  });
  it("rejects wrong property pages and handles malformed JSON-LD", () => {
    expect(() => extractStay("<title>Another Lodge</title>", source)).toThrow(
      "property_mismatch",
    );
    expect(
      extractStay(
        '<h1>Pamusha</h1><script type="application/ld+json">{broken</script>',
        source,
      ).name,
    ).toBe("Pamusha");
  });
  it("rejects oversized documents", () => {
    expect(() => extractStay("x".repeat(2_000_001), source)).toThrow(
      "response_too_large",
    );
  });
  it("deduplicates and caps excerpts, and refuses unsafe review links", () => {
    const review = {
      author: "Fixture",
      reviewBody: "Synthetic excerpt",
      url: "javascript:alert(1)",
    };
    const data = extractStay(
      page({
        ...lodging,
        review: [
          review,
          review,
          ...Array.from({ length: 20 }, (_, n) => ({
            ...review,
            author: `Fixture ${n}`,
          })),
        ],
      }),
      source,
    );
    expect(data.reviews).toHaveLength(5);
    expect(data.reviews?.[0].url).toBe(source.url);
  });
  it("does not invent currency for unlabeled amounts", () => {
    const data = extractStay(
      page({ ...lodging, offers: { price: "100" }, priceRange: "100" }),
      source,
    );
    expect(data.pricing).toBeUndefined();
  });
  it("keeps Pamusha dollar prices as text when currency is not explicit", () => {
    const data = extractStay(
      "<h1>Pamusha</h1><p>Double Room $150 per night, bed only</p>",
      source,
    );
    expect(data.pricing).toEqual([{ text: "$150 per night, bed only" }]);
  });
  it("ignores unrelated template addresses and images", () => {
    const data = extractStay(
      page({
        ...lodging,
        address: "CozyStay, Napa Valley",
        image: ["https://pamusha.com/wp-content/uploads/template.jpg"],
      }),
      source,
    );
    expect(data.address).toBeUndefined();
    expect(data.photos).toBeUndefined();
  });
  it("extracts published coordinates without confusing longitude and latitude", () => {
    const backpackers = getStaySource("victoria-falls-backpackers")!;
    const data = extractStay(
      "<h1>Victoria Falls Backpackers</h1><p>Latitude: -17.922428 | Longitude: 25.825659</p>",
      backpackers,
    );
    expect(data.geo).toEqual({ lat: -17.922428, lng: 25.825659 });
  });
});

describe("source validation and calendar schedule", () => {
  it("does not truncate an invalid currency into a valid one", () => {
    const data = extractStay(
      page({ ...lodging, offers: { price: 100, priceCurrency: "USDX" } }),
      source,
    );
    expect(data.pricing).toBeUndefined();
  });
  it("ignores malformed phone links without losing other fields", () => {
    const data = extractStay(
      "<h1>Pamusha Lodge</h1><a href='tel:%ZZ'>Broken</a><a href='tel:+263832844367'>Call</a>",
      source,
    );
    expect(data.phone).toBe("+263832844367");
  });
  it("rejects invalid clock times", () => {
    const data = extractStay(
      page({
        ...lodging,
        openingHoursSpecification: [
          { dayOfWeek: "Monday", opens: "99:00", closes: "18:99" },
        ],
      }),
      source,
    );
    expect(data.hours).toBeUndefined();
  });
  it("rejects invalid and swapped coordinates", () => {
    expect(validGeo(25.83, -17.92)).toBeUndefined();
    expect(validGeo("", 25.83)).toBeUndefined();
    expect(validGeo(-91, 25.83)).toBeUndefined();
  });
  it("rejects out-of-scale ratings without guessing a scale", () => {
    expect(validRating({ ratingValue: 8.7 })).toBeUndefined();
    expect(validRating({ ratingValue: 4.6, reviewCount: -2 })).toEqual({
      value: 4.6,
      best: 5,
      worst: 1,
    });
  });
  it("refuses unsafe URLs and non-allowlisted photos", () => {
    for (const url of [
      "http://pamusha.com/",
      "https://127.0.0.1/",
      "https://user:password@pamusha.com/",
      "javascript:alert(1)",
      "https://x.internal/",
    ]) {
      expect(publicHttpsUrl(url)).toBeUndefined();
    }
    expect(
      sourcePhotoUrl(
        "https://other.example/wp-content/uploads/room.jpg",
        source,
      ),
    ).toBeUndefined();
    expect(
      sourcePhotoUrl("https://pamusha.com/wp-content/uploads/logo.jpg", source),
    ).toBeUndefined();
  });
  it("uses the 1st and 15th rather than a 14-day interval", () => {
    expect(REFRESH_CRON).toBe("0 5 1,15 * *");
    expect(refreshCycle(Date.parse("2026-02-14T23:59:59Z"))).toBe("2026-02-01");
    expect(refreshCycle(Date.parse("2026-02-15T00:00:00Z"))).toBe("2026-02-15");
    expect(refreshCycle(Date.parse("2026-03-01T00:00:00Z"))).toBe("2026-03-01");
  });
});
