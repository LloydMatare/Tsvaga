"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDaysIcon,
  MapPinIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CITIES } from "@/lib/constants";
import { addDaysISO, nightsBetween, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SearchForm({
  variant = "hero",
  initialCity,
  initialCheckIn,
  initialCheckOut,
  initialGuests = 2,
  className,
}: {
  variant?: "hero" | "compact";
  initialCity?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  className?: string;
}) {
  const router = useRouter();
  const today = todayISO();
  const [city, setCity] = useState(initialCity || "all");
  const [checkIn, setCheckIn] = useState(initialCheckIn || addDaysISO(today, 1));
  const [checkOut, setCheckOut] = useState(
    initialCheckOut || addDaysISO(today, 3),
  );
  const [guests, setGuests] = useState(String(initialGuests));

  const minCheckOut = useMemo(() => addDaysISO(checkIn, 1), [checkIn]);
  const nights = nightsBetween(checkIn, checkOut);

  function updateCheckIn(value: string) {
    setCheckIn(value);
    if (value && checkOut <= value) {
      setCheckOut(addDaysISO(value, Math.max(nights, 1)));
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (city !== "all") params.set("city", city);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", guests);
    router.push(`/stays?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "grid gap-2 rounded-2xl border border-border/70 bg-card p-3 shadow-[var(--shadow-lift)] md:grid-cols-[1.3fr_1fr_1fr_0.9fr_auto] md:items-end",
        variant === "compact" && "shadow-none",
        className,
      )}
    >
      <Field label="Where" icon={<MapPinIcon className="size-3.5" />}>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="h-9 w-full border-0 bg-transparent px-1 shadow-none focus-visible:ring-0">
            <SelectValue placeholder="Anywhere in Zimbabwe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Anywhere in Zimbabwe</SelectItem>
            {CITIES.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Check in" icon={<CalendarDaysIcon className="size-3.5" />}>
        <input
          type="date"
          value={checkIn}
          min={today}
          onChange={(event) => updateCheckIn(event.target.value)}
          className="h-9 w-full bg-transparent text-sm outline-none"
        />
      </Field>

      <Field label="Check out" icon={<CalendarDaysIcon className="size-3.5" />}>
        <input
          type="date"
          value={checkOut}
          min={minCheckOut}
          onChange={(event) => setCheckOut(event.target.value)}
          className="h-9 w-full bg-transparent text-sm outline-none"
        />
      </Field>

      <Field label="Guests" icon={<UsersIcon className="size-3.5" />}>
        <select
          value={guests}
          onChange={(event) => setGuests(event.target.value)}
          className="h-9 w-full appearance-none bg-transparent text-sm outline-none"
        >
          {Array.from({ length: 8 }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>
              {value} guest{value === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </Field>

      <Button type="submit" size={variant === "hero" ? "default" : "sm"}>
        <SearchIcon className="size-4" />
        <span className="md:hidden lg:inline">Search stays</span>
      </Button>

      {nights > 0 && (
        <p className="text-[11px] text-muted-foreground md:col-span-5 md:-mt-1">
          {nights} night{nights === 1 ? "" : "s"} · prices in USD
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 rounded-xl px-3 py-2 transition-colors focus-within:bg-muted/60">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
