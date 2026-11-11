import Link from "next/link";
import { WifiOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        <WifiOffIcon className="size-6" />
      </div>
      <h1 className="font-display text-3xl font-semibold">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Tsvaga will reconnect automatically. Your saved trips are still available
        once you&apos;re back online.
      </p>
      <Button asChild>
        <Link href="/">Try again</Link>
      </Button>
    </div>
  );
}
