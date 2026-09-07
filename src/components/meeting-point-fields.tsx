"use client";

import { useState, type KeyboardEvent } from "react";
import { searchWalkPlaces } from "@/server/actions";
import type { GeoPoint, PlaceHit } from "@/lib/geocode";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function MeetingPointFields({
  defaultLatitude = null,
  defaultLocation = "",
  defaultLongitude = null,
  defaultPostcode = "",
  defaultWhat3words = "",
  idPrefix,
}: {
  defaultLatitude?: number | null;
  defaultLocation?: string;
  defaultLongitude?: number | null;
  defaultPostcode?: string;
  defaultWhat3words?: string;
  idPrefix: string;
}) {
  const [location, setLocation] = useState(defaultLocation);
  const [postcode, setPostcode] = useState(defaultPostcode);
  const [places, setPlaces] = useState<PlaceHit[] | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [pin, setPin] = useState<GeoPoint | null>(
    defaultLatitude != null && defaultLongitude != null
      ? { lat: defaultLatitude, lng: defaultLongitude }
      : null,
  );
  const [coordsInput, setCoordsInput] = useState(
    defaultLatitude != null && defaultLongitude != null
      ? `${defaultLatitude}, ${defaultLongitude}`
      : "",
  );
  const [coordsError, setCoordsError] = useState<string | null>(null);

  function takePin(place: PlaceHit) {
    setPickedId(place.id);
    setPin({ lat: place.lat, lng: place.lng });
    setCoordsInput(`${place.lat}, ${place.lng}`);
    setCoordsError(null);
  }

  /** What a long-press on Google Maps (or what3words' own page) copies:
   * "53.610292, -2.306141", comma or space-separated, either order of
   * sign. Kept permissive — this only ever runs on a paste someone made
   * on purpose, so the cost of being strict is a false "not recognised"
   * on a slightly odd format, not a wrong pin. */
  function applyCoordsInput(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      setCoordsError(null);
      return;
    }
    const match = trimmed.match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
    const lat = match ? Number(match[1]) : NaN;
    const lng = match ? Number(match[2]) : NaN;
    if (!match || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      setCoordsError("That doesn't look like a pair of coordinates — e.g. 53.610292, -2.306141.");
      return;
    }
    setCoordsError(null);
    setPickedId(null);
    setPin({ lat, lng });
  }

  function onFindKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void findPlace();
  }

  async function findPlace() {
    if (searching || (!location.trim() && !postcode.trim())) return;
    setSearching(true);
    setError(null);
    setPlaces(null);
    setPickedId(null);
    try {
      const result = await searchWalkPlaces(location, postcode);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPlaces(result.places);
      if (result.places.length === 1) takePin(result.places[0]);
    } catch {
      setError("Could not search right now. Try again in a moment.");
    } finally {
      setSearching(false);
    }
  }

  const locationId = `${idPrefix}-location`;
  const postcodeId = `${idPrefix}-postcode`;
  const what3wordsId = `${idPrefix}-what3words`;
  const coordsId = `${idPrefix}-coords`;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={locationId}>Meeting point</Label>
        <Input
          id={locationId}
          maxLength={200}
          name="location"
          onChange={(event) => setLocation(event.target.value)}
          onKeyDown={onFindKeyDown}
          placeholder="Visitor centre, Burrs Country Park"
          value={location}
        />
        <p className="text-xs text-muted-foreground">
          What people see on the share link. Changing this does not move the pin — Find this place
          or Exact coordinates below does.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={postcodeId}>Postcode</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            autoComplete="postal-code"
            className="sm:max-w-40"
            id={postcodeId}
            maxLength={10}
            name="postcode"
            onChange={(event) => setPostcode(event.target.value)}
            onKeyDown={onFindKeyDown}
            placeholder="BL8 1DA"
            value={postcode}
          />
          <Button
            disabled={searching || (!location.trim() && !postcode.trim())}
            onClick={() => void findPlace()}
            type="button"
            variant="outline"
          >
            {searching ? "Finding…" : "Find this place"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Optional, but a UK postcode is the most reliable pin. Tap Find this place, then pick the
          match.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={what3wordsId}>What3words (optional)</Label>
        <Input
          defaultValue={defaultWhat3words}
          id={what3wordsId}
          maxLength={120}
          name="what3words"
          placeholder="e.g. filled.count.soap"
        />
        <p className="text-xs text-muted-foreground">
          For a pinpoint-exact spot (a car park entrance, a specific bench). Members get a link
          to what3words&apos; own map with turn-by-turn directions — separate from the map above.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={coordsId}>Exact coordinates (optional)</Label>
        <Input
          id={coordsId}
          onBlur={(event) => applyCoordsInput(event.target.value)}
          onChange={(event) => setCoordsInput(event.target.value)}
          placeholder="e.g. 53.610292, -2.306141"
          value={coordsInput}
        />
        <p className="text-xs text-muted-foreground">
          For a pin that&apos;s exactly right, not just close — the search above can land tens of
          metres off for a car park or a spot with no proper address. Get exact coordinates for
          free from Google Maps (long-press the spot → copy what pops up) or from a what3words
          address&apos;s own page, then paste them here. This is what moves the pin on the map
          above; What3words below is only for the separate directions link.
        </p>
        {coordsError ? <FormError message={coordsError} /> : null}
      </div>

      <input name="latitude" type="hidden" value={pin ? String(pin.lat) : ""} />
      <input name="longitude" type="hidden" value={pin ? String(pin.lng) : ""} />

      {error ? <FormError message={error} /> : null}

      {places && places.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Pick the right place</legend>
          <RadioGroup
            className="grid gap-2"
            onValueChange={(id) => {
              const place = places.find((item) => item.id === id);
              if (place) takePin(place);
            }}
            value={pickedId ?? ""}
          >
            {places.map((place, index) => {
              const inputId = `${idPrefix}-place-${index}`;
              return (
                <Label
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
                  htmlFor={inputId}
                  key={place.id}
                >
                  <RadioGroupItem className="mt-0.5 size-5" id={inputId} value={place.id} />
                  <span>{place.label}</span>
                </Label>
              );
            })}
          </RadioGroup>
        </fieldset>
      ) : null}

      {pin ? (
        <p className="text-xs text-muted-foreground">
          Pin set. The map on the walk page uses this exact spot.
        </p>
      ) : null}
    </div>
  );
}
