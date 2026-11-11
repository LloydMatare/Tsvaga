"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  CalendarCheckIcon,
  CheckIcon,
  Loader2Icon,
  SmartphoneIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CITIES } from "@/lib/constants";

const benefits = [
  {
    icon: UsersIcon,
    title: "Reach diaspora and local guests",
    body: "Tsvaga is built for people booking Zimbabwe from abroad and at home.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Real-time availability",
    body: "Stop double bookings. Your calendar updates the moment a guest pays.",
  },
  {
    icon: SmartphoneIcon,
    title: "Payments handled",
    body: "Guests pay in USD via EcoCash, OneMoney or card. We reconcile it for you.",
  },
  {
    icon: BanknoteIcon,
    title: "Simple payouts",
    body: "Get paid to EcoCash or your bank after each stay, minus commission.",
  },
];

const steps = [
  "Create your operator profile and tell us about your place.",
  "We verify your details and help you publish your first rooms.",
  "Go live, take bookings and get paid after each stay.",
];

export default function ListYourPropertyPage() {
  const { isAuthenticated } = useConvexAuth();
  const viewer = useQuery(api.users.me);
  const operator = useQuery(api.operators.mine);
  const createOperator = useMutation(api.operators.create);
  const claimDemo = useMutation(api.operators.claimDemo);
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState<{
    email: string;
    phone: string;
  } | null>(null);
  const contactEmail = contact?.email ?? viewer?.email ?? "";
  const contactPhone = contact?.phone ?? viewer?.phone ?? "";
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("Harare");
  const [payoutMethod, setPayoutMethod] = useState<"ecocash" | "bank" | "cash">(
    "ecocash",
  );
  const [payoutDetails, setPayoutDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [claiming, setClaiming] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (businessName.trim().length < 2) {
      toast.error("Please enter your business name.");
      return;
    }
    setSubmitting(true);
    try {
      await createOperator({
        businessName,
        description,
        contactEmail,
        contactPhone,
        whatsapp,
        city,
        payoutMethod,
        payoutDetails: payoutDetails || undefined,
      });
      toast.success("Operator profile created. Add your first property next.");
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create your profile.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function claim() {
    setClaiming(true);
    try {
      await claimDemo({});
      toast.success("Demo operator claimed. Your dashboard is ready.");
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not claim the demo.",
      );
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="pb-20">
      <section className="border-b border-border/70 bg-secondary/25">
        <div className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <Badge variant="outline">For hosts and operators</Badge>
            <h1 className="mt-4 font-display text-5xl leading-[1.0] tracking-tight sm:text-6xl">
              Your place.
              <span className="block italic text-primary">Our bookings.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Join Zimbabwe&apos;s local-first travel marketplace. List lodges,
              guesthouses, hotels or safari camps, keep control of your rooms and
              pay a simple 9% commission only when you get a booking.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="success">
                <CheckIcon className="size-3" />
                No monthly fees
              </Badge>
              <Badge variant="success">
                <CheckIcon className="size-3" />
                USD payouts
              </Badge>
              <Badge variant="success">
                <CheckIcon className="size-3" />
                Verified guests
              </Badge>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-lift)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Simple, transparent pricing
            </p>
            <div className="mt-3 flex items-end gap-2">
              <span className="font-display text-6xl leading-none">9%</span>
              <span className="pb-1 text-sm text-muted-foreground">
                per booking
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Deducted from the room total when a guest pays. No listing fees, no
              subscriptions, no charge for enquiries.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {[
                "You set the nightly rate",
                "Guests pay the price they see",
                "Payouts after check-in",
                "Local support on WhatsApp",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckIcon className="size-3.5 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="surface-card p-5">
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <benefit.icon className="size-4" />
              </span>
              <p className="mt-3 text-sm font-semibold">{benefit.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {benefit.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="container-page pb-12">
        <div className="grid gap-8 rounded-3xl border border-border/70 bg-card p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
              Live in three steps.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We review every operator before their rooms go live, so guests know
              the place is real and the standard is right.
            </p>
          </div>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-3 rounded-xl bg-muted/50 p-4"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow">Apply</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">
            Tell us about your place.
          </h2>

          {!isAuthenticated ? (
            <div className="surface-card mt-6 p-6 text-center sm:p-8">
              <p className="text-sm text-muted-foreground">
                Sign in or create an account to apply. It takes a minute, and you
                can add your rooms right after.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/sign-in?redirect_url=%2Flist-your-property">
                    Sign in to apply
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/sign-up">Create account</Link>
                </Button>
              </div>
            </div>
          ) : operator ? (
            <div className="surface-card mt-6 p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <BadgeCheckIcon className="size-4 text-primary" />
                    <p className="font-semibold">{operator.businessName}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Status: {operator.verificationStatus.replace(/_/g, " ")}
                  </p>
                </div>
                <Button asChild>
                  <Link href="/dashboard">
                    Go to dashboard
                    <ArrowRightIcon className="size-4" />
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Your operator profile is live. Add properties, rooms and rates
                from the dashboard. Our team reviews new operators before
                bookings go live.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="surface-card mt-6 space-y-4 p-6 sm:p-8">
              <div className="space-y-1.5">
                <Label htmlFor="business-name">Business or property name</Label>
                <Input
                  id="business-name"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="e.g. Nyanga Trout Lodge"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">About you</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="What do you host? Where is it? What makes it special?"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="contact-email">Contact email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContact({ email: event.target.value, phone: contactPhone })}
                    placeholder="bookings@yourplace.co.zw"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-phone">Contact phone</Label>
                  <Input
                    id="contact-phone"
                    value={contactPhone}
                    onChange={(event) => setContact({ email: contactEmail, phone: event.target.value })}
                    placeholder="+263 77 123 4567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp">WhatsApp number</Label>
                  <Input
                    id="whatsapp"
                    value={whatsapp}
                    onChange={(event) => setWhatsapp(event.target.value)}
                    placeholder="263771234567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Payout method</Label>
                  <Select
                    value={payoutMethod}
                    onValueChange={(value) =>
                      setPayoutMethod(value as "ecocash" | "bank" | "cash")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ecocash">EcoCash</SelectItem>
                      <SelectItem value="bank">Bank transfer</SelectItem>
                      <SelectItem value="cash">Cash / in person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="payout-details">Payout details</Label>
                  <Input
                    id="payout-details"
                    value={payoutDetails}
                    onChange={(event) => setPayoutDetails(event.target.value)}
                    placeholder="EcoCash number or bank account"
                  />
                </div>
              </div>

              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <ArrowRightIcon className="size-4" />
                )}
                Create operator profile
              </Button>

              <div className="rounded-xl border border-dashed border-border p-4">
                <p className="text-xs font-semibold">Just exploring?</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Claim one of the seeded demo operators to preview the full host
                  dashboard with sample properties and bookings.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={claim}
                  disabled={claiming}
                >
                  {claiming && <Loader2Icon className="size-3.5 animate-spin" />}
                  Claim a demo operator
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
