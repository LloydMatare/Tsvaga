"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";

import { api } from "@/convex/_generated/api";

export function UserSync() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const sync = useMutation(api.users.sync);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void sync().catch(() => {
        /* user record will be retried on next navigation */
      });
    }
  }, [isAuthenticated, isLoading, sync]);

  return null;
}
