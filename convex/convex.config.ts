import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    SCRAPE_API_TOKEN: v.optional(v.string()),
    PAYNOW_INTEGRATION_ID: v.optional(v.string()),
    PAYNOW_INTEGRATION_KEY: v.optional(v.string()),
    SITE_URL: v.optional(v.string()),
    NEXT_PUBLIC_CONVEX_SITE_URL: v.optional(v.string()),
    RESEND_API_KEY: v.optional(v.string()),
    EMAIL_FROM: v.optional(v.string()),
  },
});

export default app;
