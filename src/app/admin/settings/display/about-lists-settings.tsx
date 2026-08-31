"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateAboutLists, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_ABOUT_LIST_ITEMS, MAX_ABOUT_RULES } from "@/lib/homepage-copy";
import { SettingsSection } from "../settings-page";

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled || pending} type="submit">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function AboutListsSettings({
  aboutExpectText,
  aboutGoalsText,
  aboutPlacesText,
  aboutRulesText,
}: {
  aboutExpectText: string;
  aboutGoalsText: string;
  aboutPlacesText: string;
  aboutRulesText: string;
}) {
  const [goals, setGoals] = useState(aboutGoalsText);
  const [places, setPlaces] = useState(aboutPlacesText);
  const [expect, setExpect] = useState(aboutExpectText);
  const [rules, setRules] = useState(aboutRulesText);
  const [state, action] = useActionState<ActionResult | null, FormData>(updateAboutLists, null);
  useActionToast(state);

  useEffect(() => {
    setGoals(aboutGoalsText);
    setPlaces(aboutPlacesText);
    setExpect(aboutExpectText);
    setRules(aboutRulesText);
  }, [aboutGoalsText, aboutPlacesText, aboutExpectText, aboutRulesText]);

  const dirty =
    goals !== aboutGoalsText ||
    places !== aboutPlacesText ||
    expect !== aboutExpectText ||
    rules !== aboutRulesText;

  return (
    <SettingsSection
      description="Lists in the Read more About drawer. One item per line. Rules use Title | Body on each line."
      title="About lists"
    >
      <form action={action} className="flex max-w-2xl flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="aboutGoals">Goals (up to {MAX_ABOUT_LIST_ITEMS})</Label>
          <Textarea
            className="min-h-36 font-mono text-sm"
            id="aboutGoals"
            name="aboutGoals"
            onChange={(event) => setGoals(event.target.value)}
            required
            rows={8}
            value={goals}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="aboutPlaces">Places (up to {MAX_ABOUT_LIST_ITEMS})</Label>
          <Textarea
            className="min-h-28 font-mono text-sm"
            id="aboutPlaces"
            name="aboutPlaces"
            onChange={(event) => setPlaces(event.target.value)}
            required
            rows={6}
            value={places}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="aboutExpect">What you can expect (up to {MAX_ABOUT_LIST_ITEMS})</Label>
          <Textarea
            className="min-h-36 font-mono text-sm"
            id="aboutExpect"
            name="aboutExpect"
            onChange={(event) => setExpect(event.target.value)}
            required
            rows={8}
            value={expect}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="aboutRules">Group rules (up to {MAX_ABOUT_RULES})</Label>
          <Textarea
            className="min-h-48 font-mono text-sm"
            id="aboutRules"
            name="aboutRules"
            onChange={(event) => setRules(event.target.value)}
            required
            rows={12}
            value={rules}
          />
          <p className="text-xs text-muted-foreground">
            Each line: Title | Body — for example{" "}
            <span className="font-mono">Respect every walker | Kindness first, always.</span>
          </p>
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
        <div className="flex flex-wrap gap-2">
          <Submit disabled={!dirty} />
          {dirty ? (
            <Button
              onClick={() => {
                setGoals(aboutGoalsText);
                setPlaces(aboutPlacesText);
                setExpect(aboutExpectText);
                setRules(aboutRulesText);
              }}
              type="button"
              variant="outline"
            >
              Discard
            </Button>
          ) : null}
        </div>
      </form>
    </SettingsSection>
  );
}
