import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { dateRange, isValidISODate, nightsBetween } from "./dates";

type DbCtx = QueryCtx | MutationCtx;

export type StayQuote =
  | {
      available: true;
      nights: number;
      nightlyCents: number[];
      nightlyTotalCents: number;
      subtotalCents: number;
      totalCents: number;
      minNights: number;
    }
  | {
      available: false;
      reason: string;
      nights: number;
      minNights: number;
    };

export async function getStayQuote(
  ctx: DbCtx,
  unit: Doc<"units">,
  plan: Doc<"ratePlans">,
  checkIn: string,
  checkOut: string,
): Promise<StayQuote> {
  const minNights = Math.max(1, plan.minNights);
  const nights = nightsBetween(checkIn, checkOut);

  if (!isValidISODate(checkIn) || !isValidISODate(checkOut)) {
    return { available: false, reason: "Choose valid check-in and check-out dates.", nights, minNights };
  }
  if (nights < 1) {
    return { available: false, reason: "Check-out must be after check-in.", nights, minNights };
  }
  if (nights > 30) {
    return { available: false, reason: "Stays longer than 30 nights need a custom quote.", nights, minNights };
  }
  if (nights < minNights) {
    return { available: false, reason: `Minimum stay is ${minNights} nights.`, nights, minNights };
  }

  const dates = dateRange(checkIn, checkOut);
  const nightly: number[] = [];

  for (const date of dates) {
    const override = await ctx.db
      .query("availability")
      .withIndex("by_unit_and_date", (q) =>
        q.eq("unitId", unit._id).eq("date", date),
      )
      .unique();

    if (override) {
      if (override.closed) {
        return { available: false, reason: `${date} is unavailable.`, nights, minNights };
      }
      const total = override.totalUnits ?? unit.totalUnits;
      if (override.bookedUnits >= total) {
        return { available: false, reason: `${date} is fully booked.`, nights, minNights };
      }
      nightly.push(override.priceOverrideCents ?? plan.priceCents);
    } else {
      if (unit.totalUnits < 1) {
        return { available: false, reason: "This room is not bookable yet.", nights, minNights };
      }
      nightly.push(plan.priceCents);
    }
  }

  const subtotalCents = nightly.reduce((sum, value) => sum + value, 0);
  return {
    available: true,
    nights,
    nightlyCents: nightly,
    nightlyTotalCents: Math.round(subtotalCents / Math.max(nights, 1)),
    subtotalCents,
    totalCents: subtotalCents,
    minNights,
  };
}

export async function firstActivePlan(
  ctx: DbCtx,
  unitId: Doc<"units">["_id"],
) {
  return await ctx.db
    .query("ratePlans")
    .withIndex("by_unit_and_active", (q) =>
      q.eq("unitId", unitId).eq("active", true),
    )
    .first();
}

export async function cheapestPlan(
  ctx: DbCtx,
  unitId: Doc<"units">["_id"],
) {
  const plans = await ctx.db
    .query("ratePlans")
    .withIndex("by_unit_and_active", (q) =>
      q.eq("unitId", unitId).eq("active", true),
    )
    .take(10);
  if (plans.length === 0) return null;
  return plans.reduce((best, plan) =>
    plan.priceCents < best.priceCents ? plan : best,
  );
}
