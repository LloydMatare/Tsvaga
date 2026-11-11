import Link from "next/link";
import { UtensilsCrossedIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = { title: "Eat" };

export default function EatPage() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <UtensilsCrossedIcon className="size-6" />
      </span>
      <p className="eyebrow mt-5">Coming soon</p>
      <h1 className="mt-2 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">
        The best plate of food in Zimbabwe is usually someone&apos;s kitchen.
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
        We&apos;re mapping the country&apos;s best eats — from Bulawayo braais
        and Harare cafés to lakeside kapenta and highlands trout. Sign up to
        hear when the Eat guide launches.
      </p>
      <div className="mt-7 flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/stays">Browse stays</Link>
        </Button>
        <Button asChild variant="outline">
          <a href="mailto:hello@tsvaga.co.zw?subject=Eat%20guide" rel="noreferrer">
            Register interest
          </a>
        </Button>
      </div>
    </div>
  );
}
