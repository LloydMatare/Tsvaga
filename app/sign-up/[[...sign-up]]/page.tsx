"use client";

import { SignUp } from "@clerk/nextjs";

import { AuthFallback } from "@/components/auth-fallback";
import { Brand } from "@/components/brand";
import { clerkEnabled } from "@/components/auth";

export default function SignUpPage() {
  if (!clerkEnabled) return <AuthFallback mode="sign-up" />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-secondary/25 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Brand />
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
}
