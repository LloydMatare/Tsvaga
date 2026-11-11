import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const roleValidator = v.union(
  v.literal("traveler"),
  v.literal("operator"),
  v.literal("admin"),
);

export const propertyTypeValidator = v.union(
  v.literal("hotel"),
  v.literal("lodge"),
  v.literal("guesthouse"),
  v.literal("safari_camp"),
  v.literal("apartment"),
  v.literal("villa"),
);

export const mealPlanValidator = v.union(
  v.literal("room_only"),
  v.literal("breakfast"),
  v.literal("half_board"),
  v.literal("full_board"),
);

export const propertyStatusValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("paused"),
);

export const bookingStatusValidator = v.union(
  v.literal("pending_payment"),
  v.literal("confirmed"),
  v.literal("checked_in"),
  v.literal("completed"),
  v.literal("cancelled"),
  v.literal("declined"),
  v.literal("expired"),
);

export const paymentStatusValidator = v.union(
  v.literal("unpaid"),
  v.literal("paid"),
  v.literal("refunded"),
  v.literal("partially_refunded"),
);

export const verificationStatusValidator = v.union(
  v.literal("pending"),
  v.literal("verified"),
  v.literal("rejected"),
);

export const notificationTypeValidator = v.union(
  v.literal("booking_received"),
  v.literal("booking_confirmed"),
  v.literal("booking_cancelled"),
  v.literal("booking_expired"),
  v.literal("operator_new_booking"),
  v.literal("stay_reminder"),
);

export const notificationStatusValidator = v.union(
  v.literal("queued"),
  v.literal("sending"),
  v.literal("sent"),
  v.literal("skipped"),
  v.literal("failed"),
);

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: roleValidator,
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  operators: defineTable({
    ownerUserId: v.id("users"),
    businessName: v.string(),
    slug: v.string(),
    description: v.string(),
    logoUrl: v.optional(v.string()),
    verificationStatus: verificationStatusValidator,
    contactEmail: v.string(),
    contactPhone: v.string(),
    whatsapp: v.string(),
    city: v.string(),
    payoutMethod: v.union(
      v.literal("ecocash"),
      v.literal("bank"),
      v.literal("cash"),
    ),
    payoutDetails: v.optional(v.string()),
    commissionRateBps: v.number(),
    instantBook: v.boolean(),
    status: v.union(v.literal("active"), v.literal("suspended")),
  })
    .index("by_owner", ["ownerUserId"])
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_verification", ["verificationStatus"]),

  properties: defineTable({
    operatorId: v.id("operators"),
    name: v.string(),
    slug: v.string(),
    summary: v.string(),
    description: v.string(),
    propertyType: propertyTypeValidator,
    city: v.string(),
    region: v.string(),
    address: v.string(),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    amenities: v.array(v.string()),
    images: v.array(v.string()),
    coverImage: v.string(),
    checkInTime: v.string(),
    checkOutTime: v.string(),
    policies: v.string(),
    houseRules: v.array(v.string()),
    ratingAvg: v.number(),
    reviewCount: v.number(),
    priceFromCents: v.number(),
    instantBook: v.boolean(),
    featured: v.boolean(),
    status: propertyStatusValidator,
    searchText: v.string(),
  })
    .index("by_operator", ["operatorId"])
    .index("by_slug", ["slug"])
    .index("by_city_and_status", ["city", "status"])
    .index("by_status_and_featured", ["status", "featured"])
    .searchIndex("search_text", {
      searchField: "searchText",
      filterFields: ["status"],
    }),

  units: defineTable({
    propertyId: v.id("properties"),
    name: v.string(),
    description: v.string(),
    capacityAdults: v.number(),
    capacityChildren: v.number(),
    bedrooms: v.number(),
    beds: v.string(),
    sizeSqm: v.optional(v.number()),
    basePriceCents: v.number(),
    totalUnits: v.number(),
    amenities: v.array(v.string()),
    images: v.array(v.string()),
    status: v.union(v.literal("active"), v.literal("hidden")),
  }).index("by_property", ["propertyId"]),

  ratePlans: defineTable({
    unitId: v.id("units"),
    name: v.string(),
    priceCents: v.number(),
    minNights: v.number(),
    mealPlan: mealPlanValidator,
    refundable: v.boolean(),
    cancellationPolicy: v.string(),
    active: v.boolean(),
  }).index("by_unit_and_active", ["unitId", "active"]),

  availability: defineTable({
    unitId: v.id("units"),
    date: v.string(),
    totalUnits: v.number(),
    bookedUnits: v.number(),
    priceOverrideCents: v.optional(v.number()),
    closed: v.boolean(),
  })
    .index("by_unit_and_date", ["unitId", "date"])
    .index("by_date", ["date"]),

  bookings: defineTable({
    code: v.string(),
    guestUserId: v.optional(v.id("users")),
    guestName: v.string(),
    guestEmail: v.string(),
    guestPhone: v.string(),
    operatorId: v.id("operators"),
    propertyId: v.id("properties"),
    unitId: v.id("units"),
    ratePlanId: v.id("ratePlans"),
    checkIn: v.string(),
    checkOut: v.string(),
    nights: v.number(),
    adults: v.number(),
    children: v.number(),
    nightlyRateCents: v.number(),
    subtotalCents: v.number(),
    commissionRateBps: v.number(),
    commissionCents: v.number(),
    totalCents: v.number(),
    currency: v.literal("USD"),
    status: bookingStatusValidator,
    paymentStatus: paymentStatusValidator,
    specialRequests: v.optional(v.string()),
    cancelledReason: v.optional(v.string()),
    confirmedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    source: v.optional(v.string()),
  })
    .index("by_code", ["code"])
    .index("by_guest", ["guestUserId"])
    .index("by_operator_and_status", ["operatorId", "status"])
    .index("by_property", ["propertyId"])
    .index("by_unit_and_checkIn", ["unitId", "checkIn"])
    .index("by_status", ["status"]),

  payments: defineTable({
    bookingId: v.id("bookings"),
    reference: v.string(),
    provider: v.literal("paynow"),
    method: v.optional(v.string()),
    amountCents: v.number(),
    status: v.union(
      v.literal("initiated"),
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    paynowReference: v.optional(v.string()),
    pollUrl: v.optional(v.string()),
    browserUrl: v.optional(v.string()),
    hashVerified: v.optional(v.boolean()),
    failureReason: v.optional(v.string()),
    paidAt: v.optional(v.number()),
  })
    .index("by_booking", ["bookingId"])
    .index("by_reference", ["reference"])
    .index("by_status", ["status"]),

  payouts: defineTable({
    operatorId: v.id("operators"),
    periodStart: v.string(),
    periodEnd: v.string(),
    grossCents: v.number(),
    commissionCents: v.number(),
    adjustmentsCents: v.number(),
    netCents: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("paid"),
    ),
    reference: v.optional(v.string()),
    paidAt: v.optional(v.number()),
  })
    .index("by_operator", ["operatorId"])
    .index("by_status", ["status"]),

  reviews: defineTable({
    propertyId: v.id("properties"),
    bookingId: v.optional(v.id("bookings")),
    guestUserId: v.optional(v.id("users")),
    guestName: v.string(),
    rating: v.number(),
    title: v.string(),
    body: v.string(),
    ownerResponse: v.optional(v.string()),
    status: v.union(v.literal("published"), v.literal("hidden")),
  })
    .index("by_property_and_status", ["propertyId", "status"])
    .index("by_booking", ["bookingId"])
    .index("by_status", ["status"]),

  favorites: defineTable({
    userId: v.id("users"),
    propertyId: v.id("properties"),
  })
    .index("by_user_and_property", ["userId", "propertyId"]),

  notifications: defineTable({
    userId: v.optional(v.id("users")),
    bookingId: v.optional(v.id("bookings")),
    type: notificationTypeValidator,
    channel: v.literal("email"),
    recipient: v.string(),
    subject: v.string(),
    body: v.string(),
    status: notificationStatusValidator,
    provider: v.optional(v.string()),
    providerId: v.optional(v.string()),
    error: v.optional(v.string()),
    sentAt: v.optional(v.number()),
  })
    .index("by_booking_and_type", ["bookingId", "type"])
    .index("by_status", ["status"])
    .index("by_recipient", ["recipient"])
    .index("by_user", ["userId"]),

  auditLogs: defineTable({
    actorUserId: v.optional(v.id("users")),
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    metadata: v.optional(v.string()),
  })
    .index("by_actor", ["actorUserId"])
    .index("by_target", ["targetType", "targetId"]),
});
