import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { StaysBrowser } from "./stays-browser";

export const metadata = {
  title: "Stays in Zimbabwe",
  description:
    "Browse verified lodges, hotels, guesthouses and safari camps across Zimbabwe.",
};

export default function StaysPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page space-y-6 py-10">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <StaysBrowser />
    </Suspense>
  );
}
