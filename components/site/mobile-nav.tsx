"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CompassIcon,
  HeartIcon,
  SearchIcon,
  TicketIcon,
  UserIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Explore", icon: CompassIcon },
  { href: "/stays", label: "Search", icon: SearchIcon },
  { href: "/trips", label: "Trips", icon: TicketIcon },
  { href: "/saved", label: "Saved", icon: HeartIcon },
  { href: "/list-your-property", label: "Host", icon: UserIcon },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 py-1.5">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
