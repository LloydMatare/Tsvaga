"use client";

import Link from "next/link";
import { KeyRoundIcon, ShieldCheckIcon } from "lucide-react";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export function AuthFallback({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-secondary/25 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <Brand />
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-lift)] sm:p-8">
          <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <KeyRoundIcon className="size-5" />
          </span>
          <h1 className="mt-4 font-display text-3xl leading-tight">
            Accounts aren&apos;t switched on yet.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This Tsvaga demo is running in browse-only mode. Add your Clerk keys
            to enable {mode === "sign-in" ? "sign in" : "sign up"}, saved stays,
            checkout and operator dashboards.
          </p>

          <div className="mt-5 rounded-xl bg-muted/60 p-4 text-xs">
            <p className="font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Add to .env.local
            </p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed">
{`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...`}
            </pre>
            <p className="mt-3 font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Then set in Convex
            </p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed">
{`npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app.clerk.accounts.dev`}
            </pre>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/stays">Browse stays</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/list-your-property">For operators</Link>
            </Button>
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheckIcon className="size-3" />
            Clerk handles passwords and sessions. Tsvaga never sees them.
          </p>
        </div>
      </div>
    </div>
  );
}
