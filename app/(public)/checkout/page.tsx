import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { CheckoutClient } from "./checkout-client";

export const metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_24rem]">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
