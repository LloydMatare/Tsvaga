"use client";

import { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { UserSync } from "@/components/user-sync";
import { PwaRegister } from "@/components/pwa-register";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!convexUrl) {
  throw new Error(
    "NEXT_PUBLIC_CONVEX_URL is missing. Run `npx convex dev` to configure your deployment.",
  );
}

const convex = new ConvexReactClient(convexUrl);

export const clerkEnabled = Boolean(publishableKey);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {clerkEnabled ? (
        <ClerkProvider publishableKey={publishableKey} dynamic>
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <UserSync />
            {children}
          </ConvexProviderWithClerk>
        </ClerkProvider>
      ) : (
        <ConvexProvider client={convex}>
          <UserSync />
          {children}
        </ConvexProvider>
      )}
      <Toaster />
      <PwaRegister />
    </ThemeProvider>
  );
}
