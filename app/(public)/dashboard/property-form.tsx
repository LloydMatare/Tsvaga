"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import {
  AMENITIES,
  CITIES,
  MEAL_PLANS,
  PROPERTY_TYPES,
  type PropertyType,
} from "@/lib/constants";

type MealPlan = "room_only" | "breakfast" | "half_board" | "full_board";

export function PropertyForm() {
  const create = useMutation(api.properties.create);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>("lodge");
  const [city, setCity] = useState("Harare");
  const [region, setRegion] = useState("Harare Metropolitan");
  const [address, setAddress] = useState("");
  const [amenities, setAmenities] = useState<string[]>([
    "Wi-Fi",
    "Secure parking",
    "Breakfast",
  ]);
  const [images, setImages] = useState("");
  const [instantBook, setInstantBook] = useState(true);
  const [houseRules, setHouseRules] = useState(
    "No smoking indoors\nQuiet hours after 22:00",
  );

  const [unitName, setUnitName] = useState("Garden room");
  const [unitDescription, setUnitDescription] = useState("");
  const [capacityAdults, setCapacityAdults] = useState("2");
  const [capacityChildren, setCapacityChildren] = useState("0");
  const [bedrooms, setBedrooms] = useState("1");
  const [beds, setBeds] = useState("1 queen bed");
  const [price, setPrice] = useState("80");
  const [totalUnits, setTotalUnits] = useState("3");
  const [mealPlan, setMealPlan] = useState<MealPlan>("breakfast");
  const [minNights, setMinNights] = useState("1");
  const [refundable, setRefundable] = useState(true);

  function toggleAmenity(amenity: string) {
    setAmenities((current) =>
      current.includes(amenity)
        ? current.filter((item) => item !== amenity)
        : [...current, amenity],
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const priceCents = Math.round(Number(price) * 100);
    if (name.trim().length < 2) {
      toast.error("Add a property name.");
      return;
    }
    if (!Number.isFinite(priceCents) || priceCents < 100) {
      toast.error("Add a nightly rate of at least US$1.");
      return;
    }
    if (!address.trim()) {
      toast.error("Add the property address.");
      return;
    }

    setPending(true);
    try {
      await create({
        name,
        summary: summary || description.slice(0, 120),
        description,
        propertyType,
        city,
        region,
        address,
        amenities,
        images: images
          .split(/[\n,]/)
          .map((image) => image.trim())
          .filter(Boolean),
        checkInTime: "14:00",
        checkOutTime: "10:00",
        policies:
          "Rates are in USD. Valid ID required at check-in. Children under 2 stay free in a cot.",
        houseRules: houseRules
          .split("\n")
          .map((rule) => rule.trim())
          .filter(Boolean),
        instantBook,
        unitName,
        unitDescription: unitDescription || "A comfortable room for your stay.",
        capacityAdults: Number(capacityAdults) || 2,
        capacityChildren: Number(capacityChildren) || 0,
        bedrooms: Number(bedrooms) || 1,
        beds,
        basePriceCents: priceCents,
        totalUnits: Number(totalUnits) || 1,
        mealPlan,
        minNights: Number(minNights) || 1,
        refundable,
        cancellationPolicy: refundable
          ? "Free cancellation up to 7 days before check-in. 50% refund within 7 days. No refund within 48 hours."
          : "Non-refundable. Date changes at the operator's discretion.",
      });
      toast.success("Property created and published.");
      setOpen(false);
      setName("");
      setSummary("");
      setDescription("");
      setAddress("");
      setImages("");
      setUnitDescription("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create the property.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="size-3.5" />
          Add property
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a property</DialogTitle>
          <DialogDescription>
            Start with one room type. You can add more rooms, rates and blocked
            dates after publishing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              The place
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="prop-name">Name</Label>
              <Input
                id="prop-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Pamusha Lodge"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Property type</Label>
                <Select
                  value={propertyType}
                  onValueChange={(value) => setPropertyType(value as PropertyType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prop-region">Region / province</Label>
                <Input
                  id="prop-region"
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prop-address">Address</Label>
                <Input
                  id="prop-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="8 Sandringham Drive, Borrowdale"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prop-summary">One-line summary</Label>
              <Input
                id="prop-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Quiet guesthouse with a big garden"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prop-description">Description</Label>
              <Textarea
                id="prop-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="What should guests know about the place, the area and the team?"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prop-images">
                Photos <span className="text-muted-foreground">(one URL per line)</span>
              </Label>
              <Textarea
                id="prop-images"
                value={images}
                onChange={(event) => setImages(event.target.value)}
                rows={2}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Amenities
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {AMENITIES.map((amenity) => (
                  <label
                    key={amenity}
                    className="flex cursor-pointer items-center gap-2 text-xs"
                  >
                    <Checkbox
                      checked={amenities.includes(amenity)}
                      onCheckedChange={() => toggleAmenity(amenity)}
                    />
                    {amenity}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={instantBook}
                onCheckedChange={(checked) => setInstantBook(Boolean(checked))}
              />
              Allow instant booking
            </label>
            <div className="space-y-1.5">
              <Label htmlFor="prop-rules">
                House rules <span className="text-muted-foreground">(one per line)</span>
              </Label>
              <Textarea
                id="prop-rules"
                value={houseRules}
                onChange={(event) => setHouseRules(event.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              First room type
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="unit-name">Room name</Label>
                <Input
                  id="unit-name"
                  value={unitName}
                  onChange={(event) => setUnitName(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit-beds">Beds</Label>
                <Input
                  id="unit-beds"
                  value={beds}
                  onChange={(event) => setBeds(event.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="unit-description">Room description</Label>
                <Textarea
                  id="unit-description"
                  value={unitDescription}
                  onChange={(event) => setUnitDescription(event.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="unit-adults">Adults</Label>
                  <Input
                    id="unit-adults"
                    type="number"
                    min={1}
                    value={capacityAdults}
                    onChange={(event) => setCapacityAdults(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unit-children">Children</Label>
                  <Input
                    id="unit-children"
                    type="number"
                    min={0}
                    value={capacityChildren}
                    onChange={(event) => setCapacityChildren(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unit-bedrooms">Bedrooms</Label>
                  <Input
                    id="unit-bedrooms"
                    type="number"
                    min={1}
                    value={bedrooms}
                    onChange={(event) => setBedrooms(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unit-total">Rooms of this type</Label>
                  <Input
                    id="unit-total"
                    type="number"
                    min={1}
                    value={totalUnits}
                    onChange={(event) => setTotalUnits(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit-price">Rate per night (USD)</Label>
                <Input
                  id="unit-price"
                  type="number"
                  min={1}
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit-min">Minimum nights</Label>
                <Input
                  id="unit-min"
                  type="number"
                  min={1}
                  value={minNights}
                  onChange={(event) => setMinNights(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Meal plan</Label>
                <Select
                  value={mealPlan}
                  onValueChange={(value) => setMealPlan(value as MealPlan)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_PLANS.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>
                        {plan.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <Checkbox
                  checked={refundable}
                  onCheckedChange={(checked) => setRefundable(Boolean(checked))}
                />
                Refundable rate
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              Publish property
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
