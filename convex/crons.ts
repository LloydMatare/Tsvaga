import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";
import { REFRESH_CRON } from "./lib/staySources";

const crons = cronJobs();
crons.cron(
  "refresh seeded stay sources twice monthly",
  REFRESH_CRON,
  internal.stayRefresh.queue,
  {},
);

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
