import { v, type Infer } from "convex/values";

export const sourceRatingValidator = v.object({
  value: v.number(),
  best: v.number(),
  worst: v.number(),
  count: v.optional(v.number()),
});

export const sourceDataValidator = v.object({
  name: v.optional(v.string()),
  address: v.optional(v.string()),
  geo: v.optional(v.object({ lat: v.number(), lng: v.number() })),
  hours: v.optional(v.array(v.string())),
  phone: v.optional(v.string()),
  website: v.optional(v.string()),
  rating: v.optional(sourceRatingValidator),
  reviews: v.optional(
    v.array(
      v.object({
        key: v.string(),
        author: v.string(),
        text: v.string(),
        date: v.optional(v.string()),
        rating: v.optional(sourceRatingValidator),
        url: v.string(),
      }),
    ),
  ),
  pricing: v.optional(
    v.array(
      v.object({
        text: v.string(),
        currency: v.optional(v.string()),
        amount: v.optional(v.number()),
        basis: v.optional(v.string()),
        validFrom: v.optional(v.string()),
        validThrough: v.optional(v.string()),
      }),
    ),
  ),
  photos: v.optional(v.array(v.string())),
});

export const sourceInfoValidator = v.object({
  url: v.string(),
  provider: v.string(),
  cycle: v.string(),
  attemptedCycle: v.optional(v.string()),
  status: v.union(
    v.literal("queued"),
    v.literal("running"),
    v.literal("success"),
    v.literal("partial"),
    v.literal("error"),
  ),
  lastAttemptAt: v.optional(v.number()),
  lastSuccessAt: v.optional(v.number()),
  error: v.optional(v.string()),
  data: sourceDataValidator,
  provenance: v.record(
    v.string(),
    v.object({
      url: v.string(),
      checkedAt: v.number(),
    }),
  ),
});

export type SourceData = Infer<typeof sourceDataValidator>;
export type SourceInfo = Infer<typeof sourceInfoValidator>;
