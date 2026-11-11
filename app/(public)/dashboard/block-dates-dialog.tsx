"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { CalendarOffIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addDaysISO, todayISO } from "@/lib/format";

export function BlockDatesDialog({
  units,
}: {
  units: Array<{ _id: Id<"units">; name: string }>;
}) {
  const update = useMutation(api.properties.setAvailabilityRange);
  const [open, setOpen] = useState(false);
  const [unitId, setUnitId] = useState<string>(units[0]?._id ?? "");
  const [from, setFrom] = useState(addDaysISO(todayISO(), 1));
  const [to, setTo] = useState(addDaysISO(todayISO(), 3));
  const [closed, setClosed] = useState(true);
  const [price, setPrice] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!unitId) {
      toast.error("Choose a room type.");
      return;
    }
    if (to < from) {
      toast.error("The end date must be after the start date.");
      return;
    }
    setPending(true);
    try {
      const result = await update({
        unitId: unitId as Id<"units">,
        from,
        to: addDaysISO(to, 1),
        closed,
        priceOverrideCents: price ? Math.round(Number(price) * 100) : undefined,
      });
      toast.success(
        `${result.updated} day${result.updated === 1 ? "" : "s"} updated.`,
      );
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update availability.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarOffIcon className="size-3.5" />
          Block dates
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block dates or set a rate</DialogTitle>
          <DialogDescription>
            Closed dates cannot be booked. A price override applies per night in
            USD for the selected range.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Room type</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a room" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit._id} value={unit._id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="block-from">From</Label>
              <Input
                id="block-from"
                type="date"
                value={from}
                min={todayISO()}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-to">To (inclusive)</Label>
              <Input
                id="block-to"
                type="date"
                value={to}
                min={from}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="block-price">
              Nightly price override (USD){" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="block-price"
              type="number"
              min={0}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="Leave blank to keep the standard rate"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={closed}
              onChange={(event) => setClosed(event.target.checked)}
              className="size-4 rounded border-border"
            />
            Close these dates (no bookings)
          </label>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              Save dates
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
