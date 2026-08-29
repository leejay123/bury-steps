"use client";

import { useState, type KeyboardEvent } from "react";
import { searchWalkPlaces } from "@/server/actions";
import type { GeoPoint, PlaceHit } from "@/lib/geocode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function MeetingPointFields({
  defaultLatitude = null,
  defaultLocation = "",
  defaultLongitude = null,
  defaultPostcode = "",
  idPrefix,
}: {
  defaultLatitude?: number | null;
  defaultLocation?: string;
  defaultLongitude?: number | null;
  defaultPostcode?: string;
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

  function takePin(place: PlaceHit) {
    setPickedId(place.id);
    setPin({ lat: place.lat, lng: place.lng });
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
          does.
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

      <input name="latitude" type="hidden" value={pin ? String(pin.lat) : ""} />
      <input name="longitude" type="hidden" value={pin ? String(pin.lng) : ""} />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

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
          Pin set. The map on the walk page uses this match. Find this place again if you need a
          different pin.
        </p>
      ) : null}
    </div>
  );
}
