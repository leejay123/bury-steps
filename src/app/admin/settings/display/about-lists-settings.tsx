"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { updateAboutLists } from "@/server/actions";
import { useNotifyActionState } from "@/hooks/use-action-toast";
import { useControlledDrawerDismissGuard } from "@/hooks/use-controlled-drawer";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DataList,
  DataListBody,
  DataListItem,
  DataListItemMain,
} from "@/components/data-list";
import { MAX_ABOUT_LIST_ITEMS, MAX_ABOUT_RULES } from "@/lib/homepage-copy";
import { SettingsSection } from "../settings-page";

type AboutListId = "goals" | "places" | "expect" | "rules";

const ABOUT_LISTS: Array<{
  description: string;
  field: "aboutGoals" | "aboutPlaces" | "aboutExpect" | "aboutRules";
  hint?: string;
  id: AboutListId;
  label: string;
  rows: number;
}> = [
  {
    id: "goals",
    field: "aboutGoals",
    label: "Goals",
    description: `Up to ${MAX_ABOUT_LIST_ITEMS} lines, one goal per line.`,
    rows: 10,
  },
  {
    id: "places",
    field: "aboutPlaces",
    label: "Places",
    description: `Up to ${MAX_ABOUT_LIST_ITEMS} lines, one place per line.`,
    rows: 8,
  },
  {
    id: "expect",
    field: "aboutExpect",
    label: "What you can expect",
    description: `Up to ${MAX_ABOUT_LIST_ITEMS} lines, one item per line.`,
    rows: 10,
  },
  {
    id: "rules",
    field: "aboutRules",
    label: "Group rules",
    description: `Up to ${MAX_ABOUT_RULES} lines as “Title | Body”.`,
    hint: 'Each line: Title | Body — for example Respect every walker | Kindness first, always.',
    rows: 12,
  },
];

function listPreview(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return "No lines yet";
  const first = lines[0];
  const suffix = lines.length === 1 ? "" : ` · ${lines.length} lines`;
  if (first.length <= 72) return `${first}${suffix}`;
  return `${first.slice(0, 72)}…${suffix}`;
}

function AboutListDrawer({
  active,
  expect,
  goals,
  onClose,
  onPointerDownOutside,
  onSaved,
  open,
  places,
  rules,
  savedExpect,
  savedGoals,
  savedPlaces,
  savedRules,
}: {
  active: (typeof ABOUT_LISTS)[number] | null;
  expect: string;
  goals: string;
  onClose: () => void;
  onPointerDownOutside: (event: Event) => void;
  onSaved: (values: { expect: string; goals: string; places: string; rules: string }) => void;
  open: boolean;
  places: string;
  rules: string;
  savedExpect: string;
  savedGoals: string;
  savedPlaces: string;
  savedRules: string;
}) {
  const [draftGoals, setDraftGoals] = useState(goals);
  const [draftPlaces, setDraftPlaces] = useState(places);
  const [draftExpect, setDraftExpect] = useState(expect);
  const [draftRules, setDraftRules] = useState(rules);
  const [state, action, isPending] = useNotifyActionState(updateAboutLists, () => {
    onSaved({
      goals: draftGoals,
      places: draftPlaces,
      expect: draftExpect,
      rules: draftRules,
    });
    onClose();
  });

  useEffect(() => {
    if (!open) return;
    setDraftGoals(goals);
    setDraftPlaces(places);
    setDraftExpect(expect);
    setDraftRules(rules);
  }, [expect, goals, open, places, rules]);

  if (!active) return null;

  const draftValue =
    active.id === "goals"
      ? draftGoals
      : active.id === "places"
        ? draftPlaces
        : active.id === "expect"
          ? draftExpect
          : draftRules;
  const savedValue =
    active.id === "goals"
      ? savedGoals
      : active.id === "places"
        ? savedPlaces
        : active.id === "expect"
          ? savedExpect
          : savedRules;

  const setDraftValue = (value: string) => {
    if (active.id === "goals") setDraftGoals(value);
    else if (active.id === "places") setDraftPlaces(value);
    else if (active.id === "expect") setDraftExpect(value);
    else setDraftRules(value);
  };

  const dirty = draftValue !== savedValue;

  return (
    <Drawer
      closeDisabled={isPending}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      open={open}
      variant="form"
    >
      <DrawerContent
        className="sm:max-w-lg"
        onPointerDownOutside={onPointerDownOutside}
      >
        <DrawerHeader>
          <DrawerTitle>{active.label}</DrawerTitle>
          <DrawerDescription>{active.description}</DrawerDescription>
        </DrawerHeader>
        <form action={action} className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-6">
          <input name="aboutGoals" type="hidden" value={draftGoals} />
          <input name="aboutPlaces" type="hidden" value={draftPlaces} />
          <input name="aboutExpect" type="hidden" value={draftExpect} />
          <input name="aboutRules" type="hidden" value={draftRules} />
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <Label htmlFor={`about-${active.id}`}>{active.label}</Label>
            <Textarea
              className="min-h-64 flex-1 font-mono text-sm"
              id={`about-${active.id}`}
              onChange={(event) => setDraftValue(event.target.value)}
              required
              rows={active.rows}
              value={draftValue}
            />
            {active.hint ? (
              <p className="text-xs text-muted-foreground">{active.hint}</p>
            ) : null}
          </div>
          <FormError message={state && !state.ok ? state.error : null} />
          <div className="flex flex-wrap gap-2">
            <Button disabled={!dirty || isPending} type="submit">
              {isPending ? "Saving…" : "Save"}
            </Button>
            {dirty ? (
              <Button onClick={() => setDraftValue(savedValue)} type="button" variant="outline">
                Discard
              </Button>
            ) : null}
          </div>
        </form>
      </DrawerContent>
    </Drawer>
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
  const [activeId, setActiveId] = useState<AboutListId | null>(null);
  const { openSoon, onPointerDownOutside } = useControlledDrawerDismissGuard();

  useEffect(() => {
    setGoals(aboutGoalsText);
    setPlaces(aboutPlacesText);
    setExpect(aboutExpectText);
    setRules(aboutRulesText);
  }, [aboutGoalsText, aboutPlacesText, aboutExpectText, aboutRulesText]);

  const values: Record<AboutListId, string> = {
    goals,
    places,
    expect,
    rules,
  };

  const active = ABOUT_LISTS.find((item) => item.id === activeId) ?? null;

  const closeDrawer = () => {
    setActiveId(null);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  return (
    <SettingsSection
      description="Lists in the Read more About drawer. Tap a row to edit."
      title="About lists"
    >
      <DataList>
        {ABOUT_LISTS.map((item) => (
          <DataListItem key={item.id} onClick={() => openSoon(() => setActiveId(item.id))}>
            <DataListItemMain className="items-center">
              <DataListBody>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{listPreview(values[item.id])}</p>
              </DataListBody>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </DataListItemMain>
          </DataListItem>
        ))}
      </DataList>

      <AboutListDrawer
        active={active}
        expect={expect}
        goals={goals}
        onClose={closeDrawer}
        onPointerDownOutside={onPointerDownOutside}
        onSaved={(next) => {
          setGoals(next.goals);
          setPlaces(next.places);
          setExpect(next.expect);
          setRules(next.rules);
        }}
        open={activeId !== null}
        places={places}
        rules={rules}
        savedExpect={aboutExpectText}
        savedGoals={aboutGoalsText}
        savedPlaces={aboutPlacesText}
        savedRules={aboutRulesText}
      />
    </SettingsSection>
  );
}
