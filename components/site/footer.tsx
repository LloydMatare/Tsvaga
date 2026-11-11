import Link from "next/link";
import { InstagramIcon, MailIcon, MessageCircleIcon } from "lucide-react";

import { Brand } from "@/components/brand";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/stays", label: "All stays" },
      { href: "/destinations", label: "Destinations" },
      { href: "/packages", label: "Holiday packages" },
      { href: "/eat", label: "Places to eat" },
    ],
  },
  {
    title: "For operators",
    links: [
      { href: "/list-your-property", label: "List your property" },
      { href: "/dashboard", label: "Operator dashboard" },
      { href: "/about", label: "How Tsvaga works" },
      { href: "/help", label: "Operator support" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/help", label: "Help centre" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-muted/40">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Brand />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Zimbabwe&apos;s local booking marketplace. Verified stays, fair
              commissions and payments that work here — EcoCash, card and
              mobile money.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="https://wa.me/263"
                className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                aria-label="WhatsApp"
              >
                <MessageCircleIcon className="size-4" />
              </a>
              <a
                href="mailto:hello@tsvaga.co.zw"
                className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Email"
              >
                <MailIcon className="size-4" />
              </a>
              <a
                href="https://instagram.com"
                className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Instagram"
              >
                <InstagramIcon className="size-4" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {column.title}
                </p>
                <ul className="mt-3 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-foreground/80 transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Tsvaga. Built in Zimbabwe, for
            Zimbabwe.
          </p>
          <p className="flex items-center gap-4">
            <span>USD pricing</span>
            <span className="size-1 rounded-full bg-border" />
            <span>EcoCash &amp; card accepted</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
