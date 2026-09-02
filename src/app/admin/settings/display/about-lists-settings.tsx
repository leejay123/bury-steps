"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { updateAboutLists } from "@/server/actions";
import { useNotifyActionState } from "@/hooks/use-action-toast";
import { useControlledDrawerDismissGuard } from "@/hooks/use-controlled-drawer";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DataList,
  DataListBody,
  DataListItem,
  DataListItemMain,
} from "@/components/data-list";
import {
  MAX_ABOUT_LIST_ITEMS,
  MAX_ABOUT_RULES,
  MAX_ABOUT_SECTION_HEADING,
} from "@/lib/homepage-copy";
import { SettingsSection } from "../settings-page";

type AboutListId = "goals" | "places" | "expect" | "rules";

const ABOUT_LISTS: Array<{
  description: string;
  field: "aboutGoals" | "aboutPlaces" | "aboutExpect" | "aboutRules";
  headingField: "aboutGoalsHeading" | "aboutPlacesHeading" | "aboutExpectHeading" | "aboutRulesHeading";
  hint?: string;
  id: AboutListId;
  /** Internal name only — organises this settings list. Not shown on the site; see the heading field for that. */
  label: string;
  rows: number;
}> = [
  {
    id: "goals",
    field: "aboutGoals",
    headingField: "aboutGoalsHeading",
    label: "Goals",
    description: `Up to ${MAX_ABOUT_LIST_ITEMS} lines, one goal per line.`,
    rows: 10,
  },
  {
    id: "places",
    field: "aboutPlaces",
    headingField: "aboutPlacesHeading",
    label: "Places",
    description: `Up to ${MAX_ABOUT_LIST_ITEMS} lines, one place per line.`,
    rows: 8,
  },
  {
    id: "expect",
    field: "aboutExpect",
    headingField: "aboutExpectHeading",
    label: "What you can expect",
    description: `Up to ${MAX_ABOUT_LIST_ITEMS} lines, one item per line.`,
    rows: 10,
  },
  {
    id: "rules",
    field: "aboutRules",
    headingField: "aboutRulesHeading",
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
  expectHeading,
  goals,
  goalsHeading,
  onClose,
  onPointerDownOutside,
  onSaved,
  open,
  places,
  placesHeading,
  rules,
  rulesHeading,
  savedExpect,
  savedExpectHeading,
  savedGoals,
  savedGoalsHeading,
  savedPlaces,
  savedPlacesHeading,
  savedRules,
  savedRulesHeading,
}: {
  active: (typeof ABOUT_LISTS)[number] | null;
  expect: string;
  expectHeading: string;
  goals: string;
  goalsHeading: string;
  onClose: () => void;
  onPointerDownOutside: (event: Event) => void;
  onSaved: (values: {
    expect: string;
    expectHeading: string;
    goals: string;
    goalsHeading: string;
    places: string;
    placesHeading: string;
    rules: string;
    rulesHeading: string;
  }) => void;
  open: boolean;
  places: string;
  placesHeading: string;
  rules: string;
  rulesHeading: string;
  savedExpect: string;
  savedExpectHeading: string;
  savedGoals: string;
  savedGoalsHeading: string;
  savedPlaces: string;
  savedPlacesHeading: string;
  savedRules: string;
  savedRulesHeading: string;
}) {
  const [draftGoals, setDraftGoals] = useState(goals);
  const [draftGoalsHeading, setDraftGoalsHeading] = useState(goalsHeading);
  const [draftPlaces, setDraftPlaces] = useState(places);
  const [draftPlacesHeading, setDraftPlacesHeading] = useState(placesHeading);
  const [draftExpect, setDraftExpect] = useState(expect);
  const [draftExpectHeading, setDraftExpectHeading] = useState(expectHeading);
  const [draftRules, setDraftRules] = useState(rules);
  const [draftRulesHeading, setDraftRulesHeading] = useState(rulesHeading);
  const [state, action, isPending] = useNotifyActionState(updateAboutLists, () => {
    onSaved({
      goals: draftGoals,
      goalsHeading: draftGoalsHeading,
      places: draftPlaces,
      placesHeading: draftPlacesHeading,
      expect: draftExpect,
      expectHeading: draftExpectHeading,
      rules: draftRules,
      rulesHeading: draftRulesHeading,
    });
    onClose();
  });

  useResetOnChange(
    [
      expect,
      expectHeading,
      goals,
      goalsHeading,
      open,
      places,
      placesHeading,
      rules,
      rulesHeading,
    ],
    () => {
      if (!open) return;
      setDraftGoals(goals);
      setDraftGoalsHeading(goalsHeading);
      setDraftPlaces(places);
      setDraftPlacesHeading(placesHeading);
      setDraftExpect(expect);
      setDraftExpectHeading(expectHeading);
      setDraftRules(rules);
      setDraftRulesHeading(rulesHeading);
    },
  );

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
  const draftHeading =
    active.id === "goals"
      ? draftGoalsHeading
      : active.id === "places"
        ? draftPlacesHeading
        : active.id === "expect"
          ? draftExpectHeading
          : draftRulesHeading;
  const savedHeading =
    active.id === "goals"
      ? savedGoalsHeading
      : active.id === "places"
        ? savedPlacesHeading
        : active.id === "expect"
          ? savedExpectHeading
          : savedRulesHeading;

  const setDraftValue = (value: string) => {
    if (active.id === "goals") setDraftGoals(value);
    else if (active.id === "places") setDraftPlaces(value);
    else if (active.id === "expect") setDraftExpect(value);
    else setDraftRules(value);
  };
  const setDraftHeading = (value: string) => {
    if (active.id === "goals") setDraftGoalsHeading(value);
    else if (active.id === "places") setDraftPlacesHeading(value);
    else if (active.id === "expect") setDraftExpectHeading(value);
    else setDraftRulesHeading(value);
  };

  const dirty = draftValue !== savedValue || draftHeading !== savedHeading;

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
          <input name="aboutGoalsHeading" type="hidden" value={draftGoalsHeading} />
          <input name="aboutPlaces" type="hidden" value={draftPlaces} />
          <input name="aboutPlacesHeading" type="hidden" value={draftPlacesHeading} />
          <input name="aboutExpect" type="hidden" value={draftExpect} />
          <input name="aboutExpectHeading" type="hidden" value={draftExpectHeading} />
          <input name="aboutRules" type="hidden" value={draftRules} />
          <input name="aboutRulesHeading" type="hidden" value={draftRulesHeading} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`about-${active.id}-heading`}>Heading shown on the site</Label>
            <Input
              id={`about-${active.id}-heading`}
              maxLength={MAX_ABOUT_SECTION_HEADING}
              onChange={(event) => setDraftHeading(event.target.value)}
              required
              value={draftHeading}
            />
          </div>
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
              <Button
                onClick={() => {
                  setDraftValue(savedValue);
                  setDraftHeading(savedHeading);
                }}
                type="button"
                variant="outline"
              >
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
  aboutExpectHeading,
  aboutExpectText,
  aboutGoalsHeading,
  aboutGoalsText,
  aboutPlacesHeading,
  aboutPlacesText,
  aboutRulesHeading,
  aboutRulesText,
}: {
  aboutExpectHeading: string;
  aboutExpectText: string;
  aboutGoalsHeading: string;
  aboutGoalsText: string;
  aboutPlacesHeading: string;
  aboutPlacesText: string;
  aboutRulesHeading: string;
  aboutRulesText: string;
}) {
  const [goals, setGoals] = useState(aboutGoalsText);
  const [goalsHeading, setGoalsHeading] = useState(aboutGoalsHeading);
  const [places, setPlaces] = useState(aboutPlacesText);
  const [placesHeading, setPlacesHeading] = useState(aboutPlacesHeading);
  const [expect, setExpect] = useState(aboutExpectText);
  const [expectHeading, setExpectHeading] = useState(aboutExpectHeading);
  const [rules, setRules] = useState(aboutRulesText);
  const [rulesHeading, setRulesHeading] = useState(aboutRulesHeading);
  const [activeId, setActiveId] = useState<AboutListId | null>(null);
  const { openSoon, onPointerDownOutside } = useControlledDrawerDismissGuard();

  useResetOnChange(
    [
      aboutGoalsText,
      aboutGoalsHeading,
      aboutPlacesText,
      aboutPlacesHeading,
      aboutExpectText,
      aboutExpectHeading,
      aboutRulesText,
      aboutRulesHeading,
    ],
    () => {
      setGoals(aboutGoalsText);
      setGoalsHeading(aboutGoalsHeading);
      setPlaces(aboutPlacesText);
      setPlacesHeading(aboutPlacesHeading);
      setExpect(aboutExpectText);
      setExpectHeading(aboutExpectHeading);
      setRules(aboutRulesText);
      setRulesHeading(aboutRulesHeading);
    },
  );

  const values: Record<AboutListId, string> = { goals, places, expect, rules };
  const headings: Record<AboutListId, string> = {
    goals: goalsHeading,
    places: placesHeading,
    expect: expectHeading,
    rules: rulesHeading,
  };

  const active = ABOUT_LISTS.find((item) => item.id === activeId) ?? null;

  const closeDrawer = () => {
    setActiveId(null);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  return (
    <SettingsSection
      description="Headings and lists in the Read more About drawer. Tap a row to edit."
      title="About lists"
    >
      <DataList>
        {ABOUT_LISTS.map((item) => (
          <DataListItem key={item.id} onClick={() => openSoon(() => setActiveId(item.id))}>
            <DataListItemMain className="items-center">
              <DataListBody>
                <p className="font-medium">{headings[item.id]}</p>
                <p className="text-xs text-muted-foreground">
                  {item.label} · {listPreview(values[item.id])}
                </p>
              </DataListBody>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </DataListItemMain>
          </DataListItem>
        ))}
      </DataList>

      <AboutListDrawer
        active={active}
        expect={expect}
        expectHeading={expectHeading}
        goals={goals}
        goalsHeading={goalsHeading}
        onClose={closeDrawer}
        onPointerDownOutside={onPointerDownOutside}
        onSaved={(next) => {
          setGoals(next.goals);
          setGoalsHeading(next.goalsHeading);
          setPlaces(next.places);
          setPlacesHeading(next.placesHeading);
          setExpect(next.expect);
          setExpectHeading(next.expectHeading);
          setRules(next.rules);
          setRulesHeading(next.rulesHeading);
        }}
        open={activeId !== null}
        places={places}
        placesHeading={placesHeading}
        rules={rules}
        rulesHeading={rulesHeading}
        savedExpect={aboutExpectText}
        savedExpectHeading={aboutExpectHeading}
        savedGoals={aboutGoalsText}
        savedGoalsHeading={aboutGoalsHeading}
        savedPlaces={aboutPlacesText}
        savedPlacesHeading={aboutPlacesHeading}
        savedRules={aboutRulesText}
        savedRulesHeading={aboutRulesHeading}
      />
    </SettingsSection>
  );
}
