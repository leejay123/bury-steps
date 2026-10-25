"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MAX_EXTRA_FACT_NAME,
  MAX_EXTRA_FACT_VALUE,
  MAX_EXTRA_FACTS,
  type ExtraFact,
} from "@/lib/extra-facts";

/**
 * + Add a fact: the walk's own facts, a name and a value each ("Parking" /
 * "Bank Lane car park"). Sent as one hidden field; rows with either part
 * blank are left out when saved.
 */
export function ExtraFactsField({ defaults = [] }: { defaults?: ExtraFact[] }) {
  const [facts, setFacts] = useState<ExtraFact[]>(defaults);
  const change = (i: number, part: keyof ExtraFact, text: string) =>
    setFacts((prev) => prev.map((fact, at) => (at === i ? { ...fact, [part]: text } : fact)));

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">More facts</legend>
      <p className="text-xs text-muted-foreground">
        Anything else worth knowing, shown with the other facts — for example Parking: Bank Lane car park,
        or Terrain: rocky in places.
      </p>
      <input name="extraFacts" type="hidden" value={JSON.stringify(facts)} />
      {facts.map((fact, i) => (
        <div className="flex gap-2" key={i}>
          <Input
            aria-label={`Fact ${i + 1}: name`}
            className="w-2/5"
            maxLength={MAX_EXTRA_FACT_NAME}
            onChange={(event) => change(i, "name", event.target.value)}
            placeholder="Parking"
            value={fact.name}
          />
          <Input
            aria-label={`Fact ${i + 1}: value`}
            maxLength={MAX_EXTRA_FACT_VALUE}
            onChange={(event) => change(i, "value", event.target.value)}
            placeholder="Bank Lane car park"
            value={fact.value}
          />
          <Button
            aria-label={`Remove fact ${i + 1}`}
            onClick={() => setFacts((prev) => prev.filter((_, at) => at !== i))}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X />
          </Button>
        </div>
      ))}
      {facts.length < MAX_EXTRA_FACTS ? (
        <Button
          className="w-fit"
          onClick={() => setFacts((prev) => [...prev, { name: "", value: "" }])}
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus data-icon="inline-start" />
          Add a fact
        </Button>
      ) : null}
    </fieldset>
  );
}
