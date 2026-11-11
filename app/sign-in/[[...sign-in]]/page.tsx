"use client";

import { SignIn } from "@clerk/nextjs";

import { AuthFallback } from "@/components/auth-fallback";
import { Brand } from "@/components/brand";
import { clerkEnabled } from "@/components/auth";

export default function SignInPage() {
  if (!clerkEnabled) return <AuthFallback mode="sign-in" />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-secondary/25 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Brand />
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
}
