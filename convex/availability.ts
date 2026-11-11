import { v } from "convex/values";

import { query } from "./_generated/server";
import { dateRange } from "./lib/dates";
import { cheapestPlan } from "./lib/stay";

export const calendar = query({
  args: {
    unitId: v.id("units"),
    from: v.string(),
    to: v.string(),
  },
  handler: async (ctx, args) => {
    const unit = await ctx.db.get(args.unitId);
    if (!unit) return null;

    const plan = await cheapestPlan(ctx, unit._id);
    const dates = dateRange(args.from, args.to);

    const days = await Promise.all(
      dates.map(async (date) => {
        const doc = await ctx.db
          .query("availability")
          .withIndex("by_unit_and_date", (q) =>
            q.eq("unitId", unit._id).eq("date", date),
          )
          .unique();

        return {
          date,
          totalUnits: doc?.totalUnits ?? unit.totalUnits,
          bookedUnits: doc?.bookedUnits ?? 0,
          closed: doc?.closed ?? false,
          priceCents: doc?.priceOverrideCents ?? plan?.priceCents ?? unit.basePriceCents,
        };
      }),
    );

    return {
      unit: {
        _id: unit._id,
        name: unit.name,
        totalUnits: unit.totalUnits,
        basePriceCents: unit.basePriceCents,
      },
      days,
    };
  },
});
