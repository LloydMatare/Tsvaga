import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { addDaysISO, dateRange, todayISO } from "./lib/dates";
import { demoStayPolicies, seedStayDetails } from "./lib/seedStayDetails";

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

type MealPlan = "room_only" | "breakfast" | "half_board" | "full_board";
type PropertyType =
  | "hotel"
  | "lodge"
  | "guesthouse"
  | "safari_camp"
  | "apartment"
  | "villa";

type SeedUnit = {
  name: string;
  description: string;
  capacityAdults: number;
  capacityChildren: number;
  bedrooms: number;
  beds: string;
  sizeSqm?: number;
  priceCents: number;
  totalUnits: number;
  mealPlan: MealPlan;
  refundable: boolean;
  minNights: number;
};

type SeedProperty = {
  name: string;
  slug: string;
  city: string;
  region: string;
  address: string;
  propertyType: PropertyType;
  summary: string;
  description: string;
  amenities: string[];
  images: string[];
  rating: number;
  featured: boolean;
  instantBook: boolean;
  operatorIndex: number;
  units: SeedUnit[];
};

function makeUnits(base: number): SeedUnit[] {
  return [
    {
      name: "Garden room",
      description:
        "A calm, well-appointed room with a private bathroom, air conditioning and backup power.",
      capacityAdults: 2,
      capacityChildren: 1,
      bedrooms: 1,
      beds: "1 queen bed",
      sizeSqm: 28,
      priceCents: base,
      totalUnits: 4,
      mealPlan: "breakfast",
      refundable: true,
      minNights: 1,
    },
    {
      name: "Family suite",
      description:
        "Extra space for families with a lounge area, two bedrooms and a private veranda.",
      capacityAdults: 4,
      capacityChildren: 2,
      bedrooms: 2,
      beds: "1 queen + 2 singles",
      sizeSqm: 52,
      priceCents: Math.round(base * 1.65),
      totalUnits: 2,
      mealPlan: "breakfast",
      refundable: true,
      minNights: 2,
    },
  ];
}

const commonAmenities = [
  "Wi-Fi",
  "Air conditioning",
  "Backup power",
  "Secure parking",
  "Restaurant",
  "Breakfast",
];

const demoPropertiesData: SeedProperty[] = [
  {
    name: "Pamusha Lodge",
    slug: "pamusha-lodge-victoria-falls",
    city: "Victoria Falls",
    region: "Matabeleland North",
    address: "12 Livingstone Way, Victoria Falls",
    propertyType: "lodge",
    summary: "Thatched lodge five minutes from the Falls with a shaded pool.",
    description:
      "Pamusha is a relaxed, locally run lodge set in mature gardens just outside Victoria Falls town. Rooms open onto a central pool and braai area, and the team can arrange transfers, sunset cruises and guided walks. Breakfast is included and the bar stocks local gins and craft beer.",
    amenities: [
      ...commonAmenities,
      "Swimming pool",
      "Bar",
      "Airport transfer",
      "Family rooms",
    ],
    images: [
      IMG("photo-1566073771259-6a8506099945"),
      IMG("photo-1571896349842-33c89424de2d"),
      IMG("photo-1582719478250-c89cae4dc85b"),
    ],
    rating: 4.7,
    featured: true,
    instantBook: true,
    operatorIndex: 0,
    units: makeUnits(12000),
  },
  {
    name: "Zambezi Sands River Lodge",
    slug: "zambezi-sands-river-lodge",
    city: "Victoria Falls",
    region: "Matabeleland North",
    address: "Zambezi Riverfront, Victoria Falls",
    propertyType: "lodge",
    summary: "Riverfront suites with private decks and sunset boat cruises.",
    description:
      "Wake up to the Zambezi. Zambezi Sands pairs spacious riverfront suites with a pool overlooking the water, daily sunset cruises and a kitchen built around fresh bream and river vegetables. Ideal for couples and small groups who want a slower Falls experience.",
    amenities: [
      ...commonAmenities,
      "Swimming pool",
      "Lake views",
      "Bar",
      "Spa",
      "Airport transfer",
    ],
    images: [
      IMG("photo-1520250497591-112f2f40a3f4"),
      IMG("photo-1540541338287-41700207dee6"),
      IMG("photo-1590490360182-c33d57733427"),
    ],
    rating: 4.9,
    featured: true,
    instantBook: false,
    operatorIndex: 0,
    units: makeUnits(21000),
  },
  {
    name: "KwaTerry Guest Lodge",
    slug: "kwaterry-guest-lodge-harare",
    city: "Harare",
    region: "Harare Metropolitan",
    address: "8 Sandringham Drive, Borrowdale, Harare",
    propertyType: "guesthouse",
    summary: "Quiet Borrowdale guesthouse with a big garden and honest rates.",
    description:
      "KwaTerry is the kind of place you send a friend when they land in Harare: secure, friendly and close to Borrowdale shops and the Sam Levy strip. Rooms are simple and spotless, breakfast is cooked to order, and the garden is a good place to work when load-shedding hits.",
    amenities: [
      "Wi-Fi",
      "Backup power",
      "Secure parking",
      "Breakfast",
      "Family rooms",
      "Pet friendly",
    ],
    images: [
      IMG("photo-1571003123894-1f0594d2b5d9"),
      IMG("photo-1611892440504-42a792e24d32"),
      IMG("photo-1551882547-ff40c63fe5fa"),
    ],
    rating: 4.6,
    featured: true,
    instantBook: true,
    operatorIndex: 1,
    units: makeUnits(6500),
  },
  {
    name: "Bronte Garden Hotel",
    slug: "bronte-garden-hotel-harare",
    city: "Harare",
    region: "Harare Metropolitan",
    address: "132 Baines Avenue, Harare",
    propertyType: "hotel",
    summary: "Classic Harare hotel with a garden restaurant and conference rooms.",
    description:
      "A dependable city hotel in the Avenues with a leafy courtyard, a proper breakfast and reliable Wi-Fi. Bronte Garden suits business travellers who want to walk to the city centre and families passing through Harare on the way to the eastern highlands.",
    amenities: [
      ...commonAmenities,
      "Swimming pool",
      "Gym",
      "Airport transfer",
    ],
    images: [
      IMG("photo-1551882547-ff40c63fe5fa"),
      IMG("photo-1445019980597-93fa8acb246c"),
      IMG("photo-1571896349842-33c89424de2d"),
    ],
    rating: 4.4,
    featured: false,
    instantBook: true,
    operatorIndex: 1,
    units: makeUnits(9500),
  },
  {
    name: "N1 City Hotel",
    slug: "n1-city-hotel-harare",
    city: "Harare",
    region: "Harare Metropolitan",
    address: "Samora Machel Avenue, Harare",
    propertyType: "hotel",
    summary: "Smart, central rooms for short city stays.",
    description:
      "Built for people who need a clean bed, a hot shower and fast Wi-Fi in the middle of town. N1 City Hotel has a small café, secure parking and a 24-hour desk, with easy access to the CBD, Eastgate and the airport road.",
    amenities: [
      "Wi-Fi",
      "Air conditioning",
      "Backup power",
      "Secure parking",
      "Restaurant",
    ],
    images: [
      IMG("photo-1582719478250-c89cae4dc85b"),
      IMG("photo-1590490360182-c33d57733427"),
      IMG("photo-1564501049412-61c2a3083791"),
    ],
    rating: 4.2,
    featured: false,
    instantBook: true,
    operatorIndex: 1,
    units: makeUnits(7800),
  },
  {
    name: "Bulawayo Grand Lodge",
    slug: "bulawayo-grand-lodge",
    city: "Bulawayo",
    region: "Bulawayo Metropolitan",
    address: "9 Joshua Nkomo Street, Bulawayo",
    propertyType: "lodge",
    summary: "Wide verandas and heritage charm in the heart of Bulawayo.",
    description:
      "A restored colonial-era lodge with high ceilings, a shaded courtyard and a kitchen that does a serious Sunday lunch. Walk to the Natural History Museum, the railway museum and the city's best bookshops, then come back for a drink on the veranda.",
    amenities: [
      ...commonAmenities,
      "Bar",
      "Family rooms",
      "Airport transfer",
    ],
    images: [
      IMG("photo-1564501049412-61c2a3083791"),
      IMG("photo-1571003123894-1f0594d2b5d9"),
      IMG("photo-1566073771259-6a8506099945"),
    ],
    rating: 4.5,
    featured: true,
    instantBook: true,
    operatorIndex: 2,
    units: makeUnits(8500),
  },
  {
    name: "Matobo Hills Retreat",
    slug: "matobo-hills-retreat",
    city: "Matobo",
    region: "Matabeleland South",
    address: "Matobo National Park boundary, Matobo",
    propertyType: "lodge",
    summary: "Granite kopje views, guided walks and unmatched silence.",
    description:
      "Set on the edge of the Matobo Hills, this small retreat is built around the landscape. Rooms face the kopjes, dinners are served under the stars when the weather allows, and guides can take you to rock art, rhino tracking and the grave of Cecil Rhodes.",
    amenities: [
      "Wi-Fi",
      "Backup power",
      "Restaurant",
      "Bar",
      "Safari drives",
      "Mountain views",
      "Airport transfer",
    ],
    images: [
      IMG("photo-1584132967334-10e028bd69f7"),
      IMG("photo-1516426122078-c23e76319801"),
      IMG("photo-1547471080-7cc2caa01a7e"),
    ],
    rating: 4.8,
    featured: false,
    instantBook: false,
    operatorIndex: 2,
    units: makeUnits(14000),
  },
  {
    name: "Nyanga Trout & Mist Lodge",
    slug: "nyanga-trout-mist-lodge",
    city: "Nyanga",
    region: "Manicaland",
    address: "Juliasdale Road, Nyanga",
    propertyType: "lodge",
    summary: "Fireplaces, trout streams and mountain air in the highlands.",
    description:
      "A timber-and-stone lodge in the Nyanga highlands with log fires, a trout pond and access to some of the best walks in Zimbabwe. Bring a jumper, a book and an appetite for fresh trout and homemade bread.",
    amenities: [
      ...commonAmenities,
      "Mountain views",
      "Family rooms",
      "Pet friendly",
      "Safari drives",
    ],
    images: [
      IMG("photo-1505881502353-a1986add3762"),
      IMG("photo-1470770841072-f978cf4d019e"),
      IMG("photo-1506905925346-21bda4d32df4"),
    ],
    rating: 4.7,
    featured: true,
    instantBook: true,
    operatorIndex: 3,
    units: makeUnits(11000),
  },
  {
    name: "Vumba Forest Guesthouse",
    slug: "vumba-forest-guesthouse",
    city: "Mutare",
    region: "Manicaland",
    address: "Vumba Road, Mutare",
    propertyType: "guesthouse",
    summary: "Mist-belt guesthouse with forest walks and mountain views.",
    description:
      "Tucked into the Vumba forest, this guesthouse is a peaceful base for exploring Mutare, the botanical gardens and the Bvumba viewpoints. Expect birdsong, log fires and a generous breakfast.",
    amenities: [
      "Wi-Fi",
      "Backup power",
      "Breakfast",
      "Mountain views",
      "Secure parking",
      "Pet friendly",
    ],
    images: [
      IMG("photo-1506905925346-21bda4d32df4"),
      IMG("photo-1445019980597-93fa8acb246c"),
      IMG("photo-1505881502353-a1986add3762"),
    ],
    rating: 4.5,
    featured: false,
    instantBook: true,
    operatorIndex: 3,
    units: makeUnits(7000),
  },
  {
    name: "Kariba Lakeview Lodge",
    slug: "kariba-lakeview-lodge",
    city: "Kariba",
    region: "Mashonaland West",
    address: "Lake Drive, Kariba",
    propertyType: "lodge",
    summary: "Sunset views over Lake Kariba and boat trips from the jetty.",
    description:
      "Watch the lake change colour from your private deck. Kariba Lakeview runs sunset cruises, fishing trips and houseboat transfers, and the kitchen leans on fresh kapenta and bream. A proper lakeside escape.",
    amenities: [
      ...commonAmenities,
      "Swimming pool",
      "Lake views",
      "Bar",
      "Airport transfer",
      "Family rooms",
    ],
    images: [
      IMG("photo-1470770841072-f978cf4d019e"),
      IMG("photo-1520250497591-112f2f40a3f4"),
      IMG("photo-1540541338287-41700207dee6"),
    ],
    rating: 4.6,
    featured: false,
    instantBook: true,
    operatorIndex: 0,
    units: makeUnits(16000),
  },
  {
    name: "Hwange Elephant Camp",
    slug: "hwange-elephant-camp",
    city: "Hwange",
    region: "Matabeleland North",
    address: "Hwange National Park, Hwange",
    propertyType: "safari_camp",
    summary: "Tented safari camp with game drives and elephant hides.",
    description:
      "A small tented camp on the edge of Hwange, with solar power, bucket showers and a waterhole that keeps the elephants coming. Rates include guided game drives, park fees and all meals.",
    amenities: [
      "Backup power",
      "Restaurant",
      "Bar",
      "Safari drives",
      "Airport transfer",
    ],
    images: [
      IMG("photo-1516426122078-c23e76319801"),
      IMG("photo-1547471080-7cc2caa01a7e"),
      IMG("photo-1584132967334-10e028bd69f7"),
    ],
    rating: 4.9,
    featured: true,
    instantBook: false,
    operatorIndex: 0,
    units: makeUnits(24000),
  },
  {
    name: "Great Zimbabwe Guesthouse",
    slug: "great-zimbabwe-guesthouse",
    city: "Masvingo",
    region: "Masvingo Province",
    address: "Great Zimbabwe Road, Masvingo",
    propertyType: "guesthouse",
    summary: "Simple, friendly base for exploring Great Zimbabwe.",
    description:
      "Ten minutes from the Great Zimbabwe monument, this family-run guesthouse is a practical and welcoming stop on the Masvingo road. Breakfast is included and the owners can arrange a local guide.",
    amenities: [
      "Wi-Fi",
      "Backup power",
      "Breakfast",
      "Secure parking",
      "Family rooms",
    ],
    images: [
      IMG("photo-1445019980597-93fa8acb246c"),
      IMG("photo-1571003123894-1f0594d2b5d9"),
      IMG("photo-1551882547-ff40c63fe5fa"),
    ],
    rating: 4.3,
    featured: false,
    instantBook: true,
    operatorIndex: 2,
    units: makeUnits(6000),
  },
  {
    name: "Chinhoyi Caves Lodge",
    slug: "chinhoyi-caves-lodge",
    city: "Chinhoyi",
    region: "Mashonaland West",
    address: "Caves Road, Chinhoyi",
    propertyType: "lodge",
    summary: "Handy stopover near the Chinhoyi Caves and Harare highway.",
    description:
      "A clean, affordable lodge for travellers breaking the Harare–Kariba journey. The Chinhoyi Caves are a short drive away, and the restaurant serves a reliable early breakfast for people leaving before sunrise.",
    amenities: [
      "Wi-Fi",
      "Air conditioning",
      "Backup power",
      "Secure parking",
      "Restaurant",
      "Breakfast",
    ],
    images: [
      IMG("photo-1566073771259-6a8506099945"),
      IMG("photo-1582719478250-c89cae4dc85b"),
      IMG("photo-1590490360182-c33d57733427"),
    ],
    rating: 4.2,
    featured: false,
    instantBook: true,
    operatorIndex: 1,
    units: makeUnits(7200),
  },
  {
    name: "Victoria Falls Backpackers",
    slug: "victoria-falls-backpackers",
    city: "Victoria Falls",
    region: "Matabeleland North",
    address: "3 Mopani Road, Victoria Falls",
    propertyType: "guesthouse",
    summary: "Budget-friendly rooms, big shared kitchen and a lively bar.",
    description:
      "The classic Falls backpackers: private rooms and dorms, a shared kitchen, a pool and a bar that stays open late. Activities desk books rafting, bungee and sunset cruises at short notice.",
    amenities: [
      "Wi-Fi",
      "Swimming pool",
      "Bar",
      "Secure parking",
      "Airport transfer",
    ],
    images: [
      IMG("photo-1540541338287-41700207dee6"),
      IMG("photo-1520250497591-112f2f40a3f4"),
      IMG("photo-1582719478250-c89cae4dc85b"),
    ],
    rating: 4.1,
    featured: false,
    instantBook: true,
    operatorIndex: 0,
    units: [
      {
        name: "Private double",
        description:
          "A simple private room with a double bed, fan and shared bathroom.",
        capacityAdults: 2,
        capacityChildren: 0,
        bedrooms: 1,
        beds: "1 double bed",
        sizeSqm: 16,
        priceCents: 3800,
        totalUnits: 6,
        mealPlan: "room_only",
        refundable: true,
        minNights: 1,
      },
      {
        name: "En-suite twin",
        description:
          "A private twin room with its own bathroom and small patio.",
        capacityAdults: 2,
        capacityChildren: 1,
        bedrooms: 1,
        beds: "2 single beds",
        sizeSqm: 22,
        priceCents: 5200,
        totalUnits: 3,
        mealPlan: "room_only",
        refundable: true,
        minNights: 1,
      },
    ],
  },
  {
    name: "Harare City Apartments",
    slug: "harare-city-apartments",
    city: "Harare",
    region: "Harare Metropolitan",
    address: "Borrowdale Road, Harare",
    propertyType: "apartment",
    summary: "Self-catering apartments with backup power and secure parking.",
    description:
      "Serviced one- and two-bedroom apartments for longer stays, family visits and remote work. Each unit has a full kitchen, washer, fast Wi-Fi and inverter backup, with cleaning twice a week.",
    amenities: [
      "Wi-Fi",
      "Air conditioning",
      "Backup power",
      "Secure parking",
      "Family rooms",
      "Gym",
    ],
    images: [
      IMG("photo-1590490360182-c33d57733427"),
      IMG("photo-1611892440504-42a792e24d32"),
      IMG("photo-1564501049412-61c2a3083791"),
    ],
    rating: 4.6,
    featured: false,
    instantBook: true,
    operatorIndex: 1,
    units: makeUnits(9000),
  },
];

const propertiesData: SeedProperty[] = demoPropertiesData.map((property) => {
  const sourced = seedStayDetails[property.slug];
  if (!sourced) return property;
  const { sourceUrl, ...details } = sourced;
  return {
    ...property,
    ...details,
    description: `${details.description}\n\nProperty information source: ${sourceUrl}`,
  };
});

// Refresh only the demo-owned listings. Preserve IDs, slugs, rates, availability,
// reviews and bookings, and never overwrite a real operator's matching listing.
export const refreshStayDetails = internalMutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    missing: v.array(v.string()),
    skipped: v.array(v.string()),
  }),
  handler: async (ctx) => {
    let updated = 0;
    const missing: string[] = [];
    const skipped: string[] = [];
    for (const property of propertiesData) {
      if (!seedStayDetails[property.slug]) continue;
      const existing = await ctx.db
        .query("properties")
        .withIndex("by_slug", (q) => q.eq("slug", property.slug))
        .unique();
      if (!existing) {
        missing.push(property.slug);
        continue;
      }
      const operator = await ctx.db.get("operators", existing.operatorId);
      const owner = operator
        ? await ctx.db.get("users", operator.ownerUserId)
        : null;
      const expectedOwner = operatorSeeds[property.operatorIndex].ownerKey;
      if (owner?.tokenIdentifier !== `seed|${expectedOwner}`) {
        skipped.push(property.slug);
        continue;
      }
      await ctx.db.patch("properties", existing._id, {
        name: property.name,
        city: property.city,
        region: property.region,
        address: property.address,
        propertyType: property.propertyType,
        summary: property.summary,
        description: property.description,
        amenities: property.amenities,
        images: property.images,
        coverImage: property.images[0],
        policies: demoStayPolicies,
        searchText: propertySearchText(property),
      });
      updated += 1;
    }
    return { updated, missing, skipped };
  },
});

function propertySearchText(property: SeedProperty) {
  return [
    property.name,
    property.summary,
    property.description,
    property.city,
    property.region,
    property.propertyType,
    ...property.amenities,
  ]
    .join(" ")
    .toLowerCase();
}

const reviewPool = [
  {
    guestName: "Tariro M.",
    rating: 5,
    title: "Felt like staying with family",
    body: "The team went out of their way to help us arrange transport and early breakfast. Room was spotless and the backup power meant no interruptions.",
  },
  {
    guestName: "Daniel K.",
    rating: 4,
    title: "Great value and a lovely garden",
    body: "Exactly what we needed for a quick stop. Wi-Fi was reliable and the location made it easy to get around. Would stay again.",
  },
  {
    guestName: "Nyasha C.",
    rating: 5,
    title: "Beautiful setting",
    body: "Waking up to that view was the highlight of our trip. Staff were warm and the food was excellent. Book the suite if you can.",
  },
  {
    guestName: "Rutendo B.",
    rating: 4,
    title: "Comfortable and well run",
    body: "Check-in was quick, the bed was comfortable and the shower had proper pressure. A solid choice for a business trip.",
  },
  {
    guestName: "Michael O.",
    rating: 5,
    title: "Perfect base for the falls",
    body: "Close enough to everything but quiet at night. They organised our sunset cruise at short notice. Highly recommended.",
  },
  {
    guestName: "Chipo D.",
    rating: 4,
    title: "Friendly and convenient",
    body: "Good breakfast, safe parking and a very helpful host. The room was a little warm in the afternoon but the fan helped.",
  },
  {
    guestName: "Farai N.",
    rating: 5,
    title: "We will be back",
    body: "Booked for two nights and stayed for four. The food, the garden and the people made it hard to leave.",
  },
  {
    guestName: "Sarah P.",
    rating: 4,
    title: "Lovely local stay",
    body: "A genuinely local experience rather than a chain hotel. Communication over WhatsApp was fast and friendly.",
  },
];

const operatorSeeds = [
  {
    businessName: "Zambezi Collection",
    slug: "zambezi-collection",
    ownerKey: "owner-1",
    ownerName: "Tendai Moyo",
    ownerEmail: "tendai@zambezicollection.co.zw",
    city: "Victoria Falls",
    description:
      "A small group of independently run lodges and camps in Victoria Falls, Kariba and Hwange.",
  },
  {
    businessName: "Harare City Stays",
    slug: "harare-city-stays",
    ownerKey: "owner-2",
    ownerName: "Rudo Chikafu",
    ownerEmail: "rudo@hararecitystays.co.zw",
    city: "Harare",
    description:
      "City hotels, guesthouses and serviced apartments across Harare and Chinhoyi.",
  },
  {
    businessName: "Matabele Hospitality",
    slug: "matabele-hospitality",
    ownerKey: "owner-3",
    ownerName: "Sipho Ndlovu",
    ownerEmail: "sipho@matabelehospitality.co.zw",
    city: "Bulawayo",
    description:
      "Heritage lodges and guesthouses in Bulawayo, Matobo and Masvingo.",
  },
  {
    businessName: "Eastern Highlands Escapes",
    slug: "eastern-highlands-escapes",
    ownerKey: "owner-4",
    ownerName: "Tanaka Nyamukapa",
    ownerEmail: "tanaka@highlandsescapes.co.zw",
    city: "Nyanga",
    description:
      "Mountain lodges and forest guesthouses in Nyanga and the Vumba.",
  },
];

export const run = internalMutation({
  args: {},
  returns: v.union(
    v.object({ skipped: v.literal(true), reason: v.string() }),
    v.object({
      skipped: v.literal(false),
      properties: v.number(),
      operators: v.number(),
      reviews: v.string(),
      bookings: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const existing = await ctx.db.query("properties").take(1);
    if (existing.length > 0) {
      return { skipped: true as const, reason: "Data already exists" };
    }

    const travelerId = await ctx.db.insert("users", {
      tokenIdentifier: "seed|traveler",
      name: "Demo Traveller",
      email: "traveller@tsvaga.demo",
      phone: "+263771234567",
      role: "traveler",
    });

    const operatorIds: Array<Id<"operators">> = [];
    for (const seed of operatorSeeds) {
      const ownerId = await ctx.db.insert("users", {
        tokenIdentifier: `seed|${seed.ownerKey}`,
        name: seed.ownerName,
        email: seed.ownerEmail,
        role: "operator",
      });
      const operatorId = await ctx.db.insert("operators", {
        ownerUserId: ownerId,
        businessName: seed.businessName,
        slug: seed.slug,
        description: seed.description,
        verificationStatus: "verified",
        contactEmail: seed.ownerEmail,
        contactPhone: "+263 77 000 0000",
        whatsapp: "263770000000",
        city: seed.city,
        payoutMethod: "ecocash",
        payoutDetails: "0770000000",
        commissionRateBps: 900,
        instantBook: true,
        status: "active",
      });
      operatorIds.push(operatorId);
    }

    type Created = {
      propertyId: Id<"properties">;
      operatorId: Id<"operators">;
      unitId: Id<"units">;
      planId: Id<"ratePlans">;
      priceCents: number;
      totalUnits: number;
    };
    const created: Created[] = [];

    for (const property of propertiesData) {
      const operatorId = operatorIds[property.operatorIndex];
      const minPrice = Math.min(
        ...property.units.map((unit) => unit.priceCents),
      );
      const searchText = propertySearchText(property);

      const propertyId = await ctx.db.insert("properties", {
        operatorId,
        name: property.name,
        slug: property.slug,
        summary: property.summary,
        description: property.description,
        propertyType: property.propertyType,
        city: property.city,
        region: property.region,
        address: property.address,
        amenities: property.amenities,
        images: property.images,
        coverImage: property.images[0],
        checkInTime: "14:00",
        checkOutTime: "10:00",
        policies: demoStayPolicies,
        houseRules: [
          "No smoking indoors",
          "No parties without prior approval",
          "Quiet hours after 22:00",
        ],
        ratingAvg: property.rating,
        reviewCount: 0,
        priceFromCents: minPrice,
        instantBook: property.instantBook,
        featured: property.featured,
        status: "published",
        searchText,
      });

      let firstPlanId: Id<"ratePlans"> | null = null;
      let firstUnitId: Id<"units"> | null = null;

      for (const unit of property.units) {
        const unitId = await ctx.db.insert("units", {
          propertyId,
          name: unit.name,
          description: unit.description,
          capacityAdults: unit.capacityAdults,
          capacityChildren: unit.capacityChildren,
          bedrooms: unit.bedrooms,
          beds: unit.beds,
          sizeSqm: unit.sizeSqm,
          basePriceCents: unit.priceCents,
          totalUnits: unit.totalUnits,
          amenities: property.amenities.slice(0, 8),
          images: property.images,
          status: "active",
        });

        const planId = await ctx.db.insert("ratePlans", {
          unitId,
          name: unit.mealPlan === "room_only" ? "Room only" : "Breakfast rate",
          priceCents: unit.priceCents,
          minNights: unit.minNights,
          mealPlan: unit.mealPlan,
          refundable: unit.refundable,
          cancellationPolicy:
            "Free cancellation up to 7 days before check-in. 50% refund within 7 days. No refund within 48 hours.",
          active: true,
        });

        if (!firstPlanId || !firstUnitId) {
          firstPlanId = planId;
          firstUnitId = unitId;
        }
      }

      if (firstPlanId && firstUnitId) {
        created.push({
          propertyId,
          operatorId,
          unitId: firstUnitId,
          planId: firstPlanId,
          priceCents: minPrice,
          totalUnits: property.units[0].totalUnits,
        });
      }

      const reviewCount = 2 + (created.length % 2);
      let ratingSum = 0;
      for (let i = 0; i < reviewCount; i += 1) {
        const review = reviewPool[(created.length + i) % reviewPool.length];
        await ctx.db.insert("reviews", {
          propertyId,
          guestUserId: travelerId,
          guestName: review.guestName,
          rating: review.rating,
          title: review.title,
          body: review.body,
          status: "published",
        });
        ratingSum += review.rating;
      }
      await ctx.db.patch("properties", propertyId, {
        reviewCount,
        ratingAvg: Math.round((ratingSum / reviewCount) * 10) / 10,
      });
    }

    async function reserve(
      unitId: Id<"units">,
      checkIn: string,
      checkOut: string,
      totalUnits: number,
    ) {
      for (const date of dateRange(checkIn, checkOut)) {
        const existingDoc = await ctx.db
          .query("availability")
          .withIndex("by_unit_and_date", (q) =>
            q.eq("unitId", unitId).eq("date", date),
          )
          .unique();
        if (existingDoc) {
          await ctx.db.patch("availability", existingDoc._id, {
            bookedUnits: existingDoc.bookedUnits + 1,
          });
        } else {
          await ctx.db.insert("availability", {
            unitId,
            date,
            totalUnits,
            bookedUnits: 1,
            closed: false,
          });
        }
      }
    }

    const today = todayISO();
    const sampleBookings = [
      { propertyIndex: 0, daysFromNow: -25, nights: 2, status: "completed" as const, paid: true },
      { propertyIndex: 2, daysFromNow: -12, nights: 3, status: "completed" as const, paid: true },
      { propertyIndex: 5, daysFromNow: 8, nights: 2, status: "confirmed" as const, paid: true },
      { propertyIndex: 7, daysFromNow: 15, nights: 3, status: "confirmed" as const, paid: true },
      { propertyIndex: 10, daysFromNow: 21, nights: 2, status: "pending_payment" as const, paid: false },
      { propertyIndex: 3, daysFromNow: 30, nights: 1, status: "cancelled" as const, paid: false },
    ];

    for (let i = 0; i < sampleBookings.length; i += 1) {
      const sample = sampleBookings[i];
      const target = created[sample.propertyIndex];
      if (!target) continue;
      const checkIn = addDaysISO(today, sample.daysFromNow);
      const checkOut = addDaysISO(checkIn, sample.nights);
      const subtotal = target.priceCents * sample.nights;
      const commission = Math.round(subtotal * 0.09);
      const reference = `TSV-SEED${i + 1}`;

      const bookingId = await ctx.db.insert("bookings", {
        code: reference,
        guestUserId: travelerId,
        guestName: "Demo Traveller",
        guestEmail: "traveller@tsvaga.demo",
        guestPhone: "+263771234567",
        operatorId: target.operatorId,
        propertyId: target.propertyId,
        unitId: target.unitId,
        ratePlanId: target.planId,
        checkIn,
        checkOut,
        nights: sample.nights,
        adults: 2,
        children: 0,
        nightlyRateCents: target.priceCents,
        subtotalCents: subtotal,
        commissionRateBps: 900,
        commissionCents: commission,
        totalCents: subtotal,
        currency: "USD",
        status: sample.status,
        paymentStatus: sample.paid ? "paid" : "unpaid",
        confirmedAt: sample.paid ? Date.now() : undefined,
        source: "seed",
      });

      if (sample.paid || sample.status === "pending_payment") {
        await ctx.db.insert("payments", {
          bookingId,
          reference: `PAY-${reference}`,
          provider: "paynow",
          method: sample.paid ? "ecocash" : "demo",
          amountCents: subtotal,
          status: sample.paid ? "paid" : "pending",
          hashVerified: sample.paid,
          paidAt: sample.paid ? Date.now() : undefined,
        });
      }

      if (sample.status !== "cancelled") {
        await reserve(target.unitId, checkIn, checkOut, target.totalUnits);
      }
    }

    return {
      skipped: false as const,
      properties: created.length,
      operators: operatorIds.length,
      reviews: "seeded",
      bookings: sampleBookings.length,
    };
  },
});
