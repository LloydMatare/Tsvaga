import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-background/70 text-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        success:
          "border-transparent bg-[#e3f2e4] text-[#2f5b37] dark:bg-[#233a25] dark:text-[#b7ddb9]",
        warning:
          "border-transparent bg-[#fdf1dc] text-[#8a5a12] dark:bg-[#3a2c17] dark:text-[#e7c283]",
        destructive:
          "border-transparent bg-[#fbe7e5] text-[#8f2f29] dark:bg-[#3a1f1d] dark:text-[#e7a29c]",
        heritage:
          "border-transparent bg-[#f7ead6] text-[#7a5317] dark:bg-[#382b17] dark:text-[#e6c48c]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
