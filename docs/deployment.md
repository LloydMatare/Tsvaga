# Production deployment

This runbook covers the Next.js frontend, Convex backend, Clerk authentication, Paynow payments, Resend email, and the Scrape.do stay-source refresh.

Commands are operator instructions, not permission to modify production automatically. Before each production deployment, environment change, mutation or data restore, identify the exact Convex project/deployment and obtain explicit approval. Do not copy development secrets, data or `.env.local` into production.

## 1. Prerequisites and release gates

- Use Node.js 24 LTS and npm in the build environment. The installed Convex CLI requires Node 22+, and the installed Vitest requires Node 22.12+, 24+, or a compatible newer release.
- Install from the committed `package-lock.json` using `npm ci`. Build/test tools are development dependencies; do not omit them during the build.
- Provision a **cloud production Convex deployment**, a production Clerk application, a Next.js-capable hosting service, and an HTTPS frontend domain. Vercel is one option; a static-only host or `next export` is not sufficient.
- Use separate production credentials for Paynow, Resend and Scrape.do. Rotate credentials previously shared in chat, logs or source files.
- Record the release commit, production frontend origin, Convex cloud URL, Convex HTTP-actions URL and rollback release in the release ticket.
- Take a protected production snapshot before a schema/data rollout and verify that the team has a recovery procedure. A successful code deploy does not back up data.
- Review dependency audit findings and any outstanding authorization/security work before launch; passing build/tests is not a production security certification.

**Stop the launch if authentication, first-admin provisioning, or real payment configuration has not been verified.** The application intentionally has development fallbacks that must not be mistaken for production readiness.

### First-admin provisioning

`convex/users.ts` exposes `users.bootstrapAdmin`: while no admin exists, **any authenticated user can become the first admin**.

Keep production Clerk sign-up/sign-in restricted to trusted operators during initial provisioning. Sign in as the intended administrator, initialize the first admin through `/admin`, and verify the corresponding Convex `users` record has `role: "admin"` before opening registration or publishing the site. Do not assume that hiding the admin page secures the backend bootstrap function. A restored deployment with no admin records needs the same protection.

Do not run `seed:run` against a real production catalogue. It creates fictional operators, reviews, inventory, bookings and payment records. Create real operators/properties through the application and verify their rates and policies.

## 2. Environment variables

Frontend-host environment variables and Convex deployment variables are separate stores. Setting a variable in Vercel, a container or `.env.local` does not set it in Convex.

### Frontend host: build and runtime

- `NEXT_PUBLIC_CONVEX_URL` — required public **production Convex cloud URL**, normally `https://<deployment>.convex.cloud`. Used by the browser client. Never point a production build at a local or development deployment.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — required production Clerk publishable key. Without it, the frontend omits the authenticated provider.
- `CLERK_SECRET_KEY` — required server-only production Clerk key. `proxy.ts` enables protected-route middleware only when both this key and the publishable key exist.
- `NEXT_PUBLIC_SITE_URL` — canonical HTTPS frontend origin, for example `https://stays.example.com`, used for metadata. Without it, metadata defaults to localhost.

`NEXT_PUBLIC_*` values are public and embedded during `next build`. Rebuild/redeploy after changing them. Never use this prefix for a secret.

Configure Clerk's production domain, allowed frontend origins and redirect URLs to match the deployed site. This repository provides `/sign-in` and `/sign-up` routes.

### Convex production deployment

- `CLERK_JWT_ISSUER_DOMAIN` — required production Clerk JWT issuer URL. `convex/auth.config.ts` reads it separately from the typed application environment configuration. If absent, the backend's authentication-provider list is empty.
- `SITE_URL` — required canonical HTTPS frontend origin, without a trailing slash. Payment return URLs and email links otherwise fall back to `http://localhost:3000`.
- `PAYNOW_INTEGRATION_ID` — required for real payments and disabling the public demo-payment mutation.
- `PAYNOW_INTEGRATION_KEY` — required secret paired with the integration ID, used for initiation and webhook verification.
- `RESEND_API_KEY` — required if production booking emails/reminders must be delivered.
- `EMAIL_FROM` — verified Resend sender, for example `Tsvaga <bookings@example.com>`. Set it explicitly; the code's default sender domain is not proof that your Resend account can send from it.
- `SCRAPE_API_TOKEN` — rotated server-only Scrape.do token, required to activate source fetching. It may remain unset to deploy the feature without paid network activity.
- `NEXT_PUBLIC_CONVEX_SITE_URL` — optional legacy backend fallback for the HTTP-actions URL in payment initiation. Normally leave unset and use Convex's built-in `CONVEX_SITE_URL`. Despite its name, the current payment implementation reads this fallback on the backend.

Convex supplies `CONVEX_SITE_URL` and `CONVEX_CLOUD_URL`; do not manually redeclare or replace these platform variables.

### CI/deployment credentials

- `CONVEX_DEPLOY_KEY` — a **production-scoped Convex deploy key** stored in the CI/hosting secret manager. Never expose it to browser code or commit it. Preview builds need a separate preview key and separate application credentials.
- `CONVEX_DEPLOYMENT` — local CLI project selection, not a frontend connection URL. Do not copy the development value into a production release environment.

`npx convex deploy` normally selects the project's default production deployment when using local project configuration; a deploy key selects the deployment associated with that key. A local development configuration does **not** make `convex deploy` safe for development.

### Setting secrets safely

Prefer the Convex dashboard's production environment-variable controls and the frontend host's secret manager. Verify the selected project/deployment before saving each change. Never use `convex env list --include-values` in shared terminals or CI logs.

For an approved production change from an authenticated CLI, omit the value so it is entered interactively, rather than saved in shell history:

```bash
npx convex env set --prod SCRAPE_API_TOKEN
```

Use the same interactive pattern for other backend secrets. Do not paste secret values into commands, documentation, screenshots or tickets. For CI, inject secrets from the secret manager without printing them or enabling shell tracing.

## 3. Authentication, payments and email setup

### Clerk

1. Configure a production Clerk JWT template named `convex`, using Clerk's Convex integration settings. Its audience must match `applicationID: "convex"` in `convex/auth.config.ts`.
2. Set `CLERK_JWT_ISSUER_DOMAIN` on **production Convex** to the exact issuer of that production Clerk application.
3. Set the matching production publishable and secret keys on the frontend host.
4. Deploy the backend auth configuration and verify sign-in, user synchronization and protected routes. Frontend sessions alone do not prove Convex is receiving valid identities.

### Paynow

Set **both** integration variables and `SITE_URL` before accepting bookings/payments.

- If either integration credential is missing, `payments.initiatePaynow` enters its demo branch.
- `payments.markDemoPaid` is disabled when the integration **ID** exists. Setting only one credential is an inconsistent configuration, not a safe production setup.
- Paynow initiation supplies a result URL at `https://<production-deployment>.convex.site/paynow/webhook` and a return URL at `${SITE_URL}/booking/<code>`. The webhook belongs to Convex, not the frontend domain.
- Ensure the integration is approved for the intended currency/payment methods and that the HTTP-actions endpoint is externally reachable.
- Verify a controlled transaction and its signed webhook before opening checkout. The frontend redirect alone must not be treated as confirmation of payment.
- The current refund mutation records refund state in the app; it does not call Paynow to transfer money. Establish a separate verified financial-refund procedure.

### Resend

Verify the sender domain and required DNS records in Resend, then configure `RESEND_API_KEY` and `EMAIL_FROM` in production Convex.

Without the key, notifications are marked `skipped` and a demo log is written; messages are not sent. Setting a key later does not automatically replay skipped notifications. Monitor `notifications` records for `sent`, `failed` and `skipped` outcomes, and restrict access to logs containing guest information.

## 4. Validate and deploy

### Preflight

Run from the repository root in an environment configured for validation, not using live production API calls:

```bash
npm ci
npm test
npm run lint
npm run typecheck
npx tsc --noEmit -p convex/tsconfig.json
npm run build
```

`npm run build` runs the application typecheck before `next build`. This is important because `next.config.ts` sets `typescript.ignoreBuildErrors: true`. Do not replace the release build with bare `next build`.

The frontend build needs its public configuration before it runs and network access for the Google fonts imported by `app/layout.tsx`. Unit tests use synthetic credentials and mocked network responses; they do not validate live production integrations.

### Backend release

After confirming the production target and obtaining approval:

```bash
npx convex deploy --typecheck enable
```

This deploys functions, auth/HTTP configuration, schema/index changes and cron definitions. Optional `sourceInfo` metadata is additive; no source-data backfill is required. Inspect the deployment output before publishing the matching frontend.

Do not use `convex dev`, `convex run --push`, or `seed:run` as the production deployment procedure.

### Frontend release

For a self-hosted Next.js service:

```bash
npm run build
npm run start
```

Run it under your platform's process supervisor behind HTTPS; configure its port/health checks and persistent service lifecycle there. Convex remains a separate cloud service, not a process to start alongside the production frontend.

For a Next.js-aware CI/hosting platform, use `npm ci` for installation and `npm run build` for building after a successful backend deployment.

Alternatively, a coordinated Convex/hosting build can inject the selected backend URL:

```bash
npx convex deploy --typecheck enable --cmd 'npm run build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
```

This command builds the frontend first with the selected deployment URL, then validates/pushes the backend. Configure the host to publish frontend artifacts only if the entire command succeeds. Set the production-scoped deploy key and Clerk/site variables before the build. This is an alternative to the separate backend release, not an extra deploy step to run blindly.

Keep preview environments isolated: preview Clerk credentials, backend deployment, deploy key, payment settings and email recipients must not silently reuse production.

## 5. Stay-source refresh activation and limits

Relevant files: `convex/lib/staySources.ts`, `convex/lib/seedStayDetails.ts`, `convex/lib/extractStay.ts`, `convex/lib/scrapeDo.ts`, and `convex/stayRefresh.ts`.

**Current eligibility is deliberately demo-only.** A listing must have a configured seed slug, an active operator, and an owner token identifier matching that source's `seed|owner-*` mapping. Real operator-owned listings are skipped. Setting the API token does not enroll them.

For a real production catalogue, leave source fetching disabled until an explicitly approved production enrollment/ownership model is implemented. Do not seed fictional users into production or forge seed ownership to bypass the guard. Deploying this code alone does not promise automatic refreshes for real operators.

For an explicitly approved environment containing eligible mapped listings:

- Set the rotated `SCRAPE_API_TOKEN` in that **Convex deployment**, not just on the frontend host.
- Only the 13 explicitly configured pages are requested. Hwange Elephant Camp remains excluded pending identity confirmation.
- Schedule: `0 5 1,15 * *` — **05:00 UTC / 07:00 Zimbabwe time on the 1st and 15th** of each month. No frontend-host cron is required.
- At most 13 page requests per cycle, staggered 45 seconds apart. With the current registry, this is at most 26 scheduled page requests per full calendar month, not a guaranteed provider credit cost.
- Rendering, premium proxies, automatic retries and target redirects are disabled. Requests have a 20-second provider timeout, a 25-second client timeout and a 2,000,000-byte HTML limit.
- Each property is queued/attempted at most once per calendar half-month. Manual queueing shares that cycle budget. Failed attempts are not automatically retried in the same cycle.
- Missing credentials return `missing_token` with zero scheduled requests. Failed/partial extractions preserve prior values; per-field provenance indicates when each value was actually checked.
- External ratings/reviews and advertised prices remain separate from Tsvaga ratings, reviews and bookable rates. Source snapshots do not alter operator fields, bookings, inventory or payment amounts.
- Coverage depends on actual source markup. Dynamic/unpublished fields remain unknown; do not promise complete ratings, GPS, hours, prices or photos for every site.

After backend deployment, these diagnostics are read-only and do not expose the token:

```bash
npx convex run --prod stayRefresh:configuration '{}'
npx convex run --prod stayRefresh:coverage '{}'
```

Only after reviewing eligibility, credit budget and approving a production mutation, start an initial cycle:

```bash
npx convex run --prod stayRefresh:queue '{}'
```

Wait approximately ten minutes for the staggered batch, then run `coverage` again. `scheduled: 0` may mean missing credentials, no eligible listings, or an already queued cycle; inspect the returned reason. `not_refreshed` does not distinguish an absent/ineligible listing from one that has never run.

Inspect `properties.sourceInfo` and Convex function/scheduler logs for details. Statuses are `queued`, `running`, `success`, `partial`, and `error`; `lastAttemptAt`, `lastSuccessAt`, sanitized `error` codes and `provenance` provide context. There is no automatic same-cycle retry/reset command.

Source-photo hosts/paths are restricted by `sourcePhotoUrl`. The main Next.js gallery has its own `next.config.ts` allowlist; source-panel images are unoptimized and have a local unavailable-photo fallback. Review both paths when adding new sources.

## 6. Post-deployment verification

1. Check the Convex HTTP-actions health endpoint:

   ```bash
   curl --fail --show-error --silent "https://<production-deployment>.convex.site/health"
   ```

   Expected JSON: `{"ok":true,"service":"tsvaga"}`. This is a liveness check, not verification of Clerk, Paynow, Resend or Scrape.do.

2. Open the production site, sign in with a controlled account, and confirm user synchronization, admin provisioning, protected-route enforcement and operator ownership boundaries.
3. Confirm the frontend points to the intended production `.convex.cloud` URL and the Clerk issuer matches production Convex.
4. Exercise one controlled real payment, inspect the signed webhook/payment result and verify inventory/booking behavior. Never use demo payment confirmation as a live-payment test.
5. Verify one real email delivery from the approved sender and inspect failed/skipped notification records.
6. Inspect Convex cron definitions: unpaid-booking expiry every 10 minutes; stay reminders daily at 07:07 UTC; stay-source refresh on the 1st/15th at 05:00 UTC.
7. For eligible source listings, inspect coverage and the UI's attribution, check dates, missing-field labels and separation between external data and Tsvaga rates/reviews.
8. Confirm no seeded reviews, fictional bookings, demo prices or fabricated operator verification are presented as real production offers.

## 7. Monitoring, suspension and rollback

- Monitor Convex function failures, scheduled jobs, source-field freshness, payment/webhook failures and notification-delivery statuses. `coverage` returns field names/statuses, not a complete freshness audit; inspect per-field timestamps for stale retained data.
- Record Scrape.do usage separately; request caps are not a billing guarantee. Never log authenticated Scrape.do URLs, which contain the API token.
- To suspend source network requests, approve and remove the token from the production deployment:

  ```bash
  npx convex env remove --prod SCRAPE_API_TOKEN
  ```

  Subsequent queues no-op, and queued actions check for the token before fetching. In-flight requests may finish. For incident containment, also revoke/rotate the provider token and review already scheduled actions; removing an environment variable is not a cancellation API.

- Correct credentials or parser/source mappings through a reviewed release. Repeatedly invoking `queue` does not retry a failed property within the same cycle. Do not delete cycle metadata or reset ownership casually to force a retry.
- Roll back frontend artifacts to the recorded release through the host. If backend rollback is needed, inspect schema compatibility and redeploy the known-good backend commit with production approval. Removing optional schema fields while stored documents still contain them may require an explicit migration; a blind old-code deploy can fail validation.
- A code rollback does not revert data. Restore snapshots only under a separate approved recovery procedure with expected data loss and reconciliation of payments/bookings clearly identified.
- Keep Paynow configuration in place during incidents unless an approved payment shutdown is in effect: removing it can re-enable demo-payment behavior. Close checkout using the hosting/access controls if safe payment processing cannot be assured.

No production environment or credentials are provisioned by this document. Production activation and live integration verification remain separate operator actions.
