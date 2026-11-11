"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { MenuIcon, PlusIcon } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@/components/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/stays", label: "Stays" },
  { href: "/destinations", label: "Destinations" },
  { href: "/packages", label: "Packages", soon: true },
  { href: "/eat", label: "Eat", soon: true },
];

export function SiteHeader() {
  const pathname = usePathname();
  const viewer = useQuery(api.users.me);
  const isOperator = viewer?.role === "operator" || viewer?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Brand />

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                pathname === item.href && "bg-muted text-foreground",
              )}
            >
              {item.label}
              {item.soon && (
                <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-secondary-foreground">
                  Soon
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
          >
            <Link href="/list-your-property">
              <PlusIcon className="size-3.5" />
              List your property
            </Link>
          </Button>

          <SignedIn>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/trips">My trips</Link>
            </Button>
            {isOperator && (
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            )}
            <div className="ml-1">
              <UserButton />
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button size="sm" className="hidden sm:inline-flex">
                Join Tsvaga
              </Button>
            </SignUpButton>
          </SignedOut>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                aria-label="Open menu"
              >
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88%] sm:max-w-sm">
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">Tsvaga</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-base font-medium hover:bg-muted"
                  >
                    {item.label}
                    {item.soon && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                        Soon
                      </span>
                    )}
                  </Link>
                ))}
                <Link
                  href="/trips"
                  className="rounded-xl px-3 py-3 text-base font-medium hover:bg-muted"
                >
                  My trips
                </Link>
                <Link
                  href="/saved"
                  className="rounded-xl px-3 py-3 text-base font-medium hover:bg-muted"
                >
                  Saved stays
                </Link>
                {isOperator && (
                  <Link
                    href="/dashboard"
                    className="rounded-xl px-3 py-3 text-base font-medium hover:bg-muted"
                  >
                    Operator dashboard
                  </Link>
                )}
                <Link
                  href="/list-your-property"
                  className="rounded-xl px-3 py-3 text-base font-medium hover:bg-muted"
                >
                  List your property
                </Link>
              </nav>
              <div className="mt-auto flex flex-col gap-2 p-5">
                <SignedOut>
                  <SignInButton mode="redirect">
                    <Button variant="outline" className="w-full">
                      Sign in
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="redirect">
                    <Button className="w-full">Join Tsvaga</Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
                    <span className="text-sm font-medium">Your account</span>
                    <UserButton />
                  </div>
                </SignedIn>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
