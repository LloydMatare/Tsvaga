import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "expire unpaid bookings",
  { minutes: 10 },
  internal.bookings.expirePending,
  {},
);

crons.daily(
  "stay reminders",
  { hourUTC: 7, minuteUTC: 7 },
  internal.notifications.sendStayReminders,
  {},
);

export default crons;
