"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { HeartIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  propertyId,
  initialFavorite = false,
  className,
}: {
  propertyId: Id<"properties">;
  initialFavorite?: boolean;
  className?: string;
}) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, setPending] = useState(false);
  const toggle = useMutation(api.favorites.toggle);
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  async function onClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      toast("Sign in to save stays", {
        description: "Your saved stays sync across web and mobile.",
        action: { label: "Sign in", onClick: () => router.push("/sign-in") },
      });
      return;
    }
    setPending(true);
    const next = !favorite;
    setFavorite(next);
    try {
      await toggle({ propertyId });
      toast(next ? "Saved to your trips" : "Removed from saved");
    } catch {
      setFavorite(!next);
      toast.error("Could not update your saved stays.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={favorite ? "Remove from saved" : "Save this stay"}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur transition-all hover:scale-105 hover:bg-background",
        className,
      )}
    >
      <HeartIcon
        className={cn(
          "size-4 transition-colors",
          favorite ? "fill-destructive text-destructive" : "text-foreground/70",
        )}
      />
    </button>
  );
}
