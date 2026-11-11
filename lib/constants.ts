export const SITE_NAME = "Tsvaga";
export const SITE_TAGLINE = "Find your Zimbabwe.";
export const SITE_DESCRIPTION =
  "Book verified lodges, hotels and safari camps across Zimbabwe. Local stays, local food and travel packages — with EcoCash and card payments.";

export const PROPERTY_TYPES = [
  { value: "hotel", label: "Hotel" },
  { value: "lodge", label: "Lodge" },
  { value: "guesthouse", label: "Guesthouse" },
  { value: "safari_camp", label: "Safari camp" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number]["value"];

export const MEAL_PLANS = [
  { value: "room_only", label: "Room only" },
  { value: "breakfast", label: "Breakfast included" },
  { value: "half_board", label: "Half board" },
  { value: "full_board", label: "Full board" },
] as const;

export const AMENITIES = [
  "Wi-Fi",
  "Air conditioning",
  "Backup power",
  "Swimming pool",
  "Secure parking",
  "Restaurant",
  "Bar",
  "Breakfast",
  "Airport transfer",
  "Safari drives",
  "Lake views",
  "Mountain views",
  "Family rooms",
  "Pet friendly",
  "Gym",
  "Spa",
] as const;

export const DESTINATIONS = [
  {
    name: "Victoria Falls",
    slug: "victoria-falls",
    blurb: "The smoke that thunders",
    image:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Harare",
    slug: "harare",
    blurb: "Gardens, cafés and city energy",
    image:
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Bulawayo",
    slug: "bulawayo",
    blurb: "Heritage and wide avenues",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Nyanga",
    slug: "nyanga",
    blurb: "Highlands, trout and mist",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Kariba",
    slug: "kariba",
    blurb: "Sunset cruises and big skies",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Hwange",
    slug: "hwange",
    blurb: "Elephants and wild bush",
    image:
      "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80",
  },
];

export const CITIES = [
  "Victoria Falls",
  "Harare",
  "Bulawayo",
  "Nyanga",
  "Kariba",
  "Hwange",
  "Masvingo",
  "Mutare",
  "Chinhoyi",
  "Matobo",
] as const;

export const COMMISSION_BPS = 900;
export const DEFAULT_QUOTE_CURRENCY = "USD";

export function propertyTypeLabel(value: string) {
  return PROPERTY_TYPES.find((type) => type.value === value)?.label ?? "Stay";
}

export function mealPlanLabel(value: string) {
  return MEAL_PLANS.find((plan) => plan.value === value)?.label ?? "Room only";
}
