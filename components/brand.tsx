import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none">
        <path
          d="M5 6.5h14M12 6.5V19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 13c2.8 0 5-2.2 5-5-2.8 0-5 2.2-5 5Zm0 0c-2.8 0-5-2.2-5-5 2.8 0 5 2.2 5 5Z"
          fill="currentColor"
          opacity="0.9"
        />
      </svg>
    </span>
  );
}

export function Brand({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="Tsvaga home"
    >
      <BrandMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl font-semibold tracking-tight">
            Tsvaga
          </span>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:block">
            Zimbabwe stays
          </span>
        </span>
      )}
    </Link>
  );
}
