import { httpRouter } from "convex/server";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { verifyPaynowHash } from "./lib/paynow";

const http = httpRouter();

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return Response.json({ ok: true, service: "tsvaga" });
  }),
});

http.route({
  path: "/paynow/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const key = process.env.PAYNOW_INTEGRATION_KEY;
    if (!key) {
      return new Response("Paynow is not configured", { status: 503 });
    }

    const body = await req.text();
    const { valid, fields } = await verifyPaynowHash(body, key);
    if (!valid) {
      return new Response("Invalid hash", { status: 400 });
    }

    const reference = fields.reference;
    if (!reference) {
      return new Response("Missing reference", { status: 400 });
    }

    const status = (fields.status ?? "").toLowerCase();
    const amountCents = fields.amount
      ? Math.round(Number.parseFloat(fields.amount) * 100)
      : undefined;

    if (status === "paid" || status === "awaiting delivery" || status === "delivered") {
      await ctx.runMutation(internal.payments.confirmFromPaynow, {
        reference,
        paynowReference: fields.paynowreference,
        amountCents,
      });
    } else if (status === "cancelled" || status === "failed" || status === "disputed") {
      await ctx.runMutation(internal.payments.recordFailure, {
        reference,
        reason: status,
      });
    }

    return new Response("ok", { status: 200 });
  }),
});

export default http;
