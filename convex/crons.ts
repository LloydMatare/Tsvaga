import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "expire unpaid bookings",
  { minutes: 10 },
  internal.bookings.expirePending,
  {},
);

export default crons;
