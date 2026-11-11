import Link from "next/link";
import { CompassIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = { title: "Packages" };

export default function PackagesPage() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <CompassIcon className="size-6" />
      </span>
      <p className="eyebrow mt-5">Coming soon</p>
      <h1 className="mt-2 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">
        Curated Zimbabwe trips, put together by people who live here.
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
        We&apos;re building ready-made packages for long weekends, family
        holidays and safari circuits — with stays, transfers and activities in
        one price. In the meantime, book a stay and we&apos;ll help with the
        rest.
      </p>
      <div className="mt-7 flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/stays">Browse stays</Link>
        </Button>
        <Button asChild variant="outline">
          <a
            href="mailto:hello@tsvaga.co.zw?subject=Trip%20packages"
            rel="noreferrer"
          >
            Register interest
          </a>
        </Button>
      </div>
    </div>
  );
}
