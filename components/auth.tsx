"use client";

import { ReactNode } from "react";
import Link from "next/link";
import {
  SignInButton as ClerkSignInButton,
  SignUpButton as ClerkSignUpButton,
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
  UserButton as ClerkUserButton,
} from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

export function SignedIn({ children }: { children: ReactNode }) {
  if (!clerkEnabled) return null;
  return <ClerkSignedIn>{children}</ClerkSignedIn>;
}

export function SignedOut({ children }: { children: ReactNode }) {
  if (!clerkEnabled) return <>{children}</>;
  return <ClerkSignedOut>{children}</ClerkSignedOut>;
}

export function SignInButton({
  children,
  mode = "modal",
}: {
  children: ReactNode;
  mode?: "modal" | "redirect";
}) {
  if (!clerkEnabled) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/sign-in">Sign in</Link>
      </Button>
    );
  }
  return (
    <ClerkSignInButton mode={mode} forceRedirectUrl="/">
      {children}
    </ClerkSignInButton>
  );
}

export function SignUpButton({
  children,
  mode = "modal",
}: {
  children: ReactNode;
  mode?: "modal" | "redirect";
}) {
  if (!clerkEnabled) {
    return (
      <Button asChild size="sm">
        <Link href="/sign-up">Join Tsvaga</Link>
      </Button>
    );
  }
  return (
    <ClerkSignUpButton mode={mode} forceRedirectUrl="/">
      {children}
    </ClerkSignUpButton>
  );
}

export function UserButton() {
  if (!clerkEnabled) return null;
  return <ClerkUserButton afterSignOutUrl="/" />;
}
