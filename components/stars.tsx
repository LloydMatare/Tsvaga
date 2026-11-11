import { StarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function Stars({
  rating,
  count,
  className,
  showValue = true,
}: {
  rating: number;
  count?: number;
  className?: string;
  showValue?: boolean;
}) {
  const rounded = Math.round(rating);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <StarIcon
            key={index}
            className={cn(
              "size-3.5",
              index < rounded
                ? "fill-[#d9a350] text-[#d9a350]"
                : "fill-transparent text-border",
            )}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-xs font-medium text-foreground/80">
          {rating > 0 ? rating.toFixed(1) : "New"}
          {count !== undefined && count > 0 && (
            <span className="text-muted-foreground"> ({count})</span>
          )}
        </span>
      )}
    </span>
  );
}
