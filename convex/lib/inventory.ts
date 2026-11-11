import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { dateRange } from "./dates";

export async function releaseInventory(
  ctx: MutationCtx,
  booking: Doc<"bookings">,
) {
  for (const date of dateRange(booking.checkIn, booking.checkOut)) {
    const existing = await ctx.db
      .query("availability")
      .withIndex("by_unit_and_date", (q) =>
        q.eq("unitId", booking.unitId).eq("date", date),
      )
      .unique();
    if (existing && existing.bookedUnits > 0) {
      await ctx.db.patch("availability", existing._id, {
        bookedUnits: existing.bookedUnits - 1,
      });
    }
  }
}
