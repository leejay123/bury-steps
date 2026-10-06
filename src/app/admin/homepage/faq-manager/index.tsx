"use client";

import { useState } from "react";
import { ChevronRight, CircleHelp } from "lucide-react";
import { reorderHomepageFaqs } from "@/server/actions";
import type { FaqCategoryView, FaqView } from "@/lib/faqs";
import { ReorderButtons, useReorderableIds } from "@/components/sortable-rows";
import { EmptyState } from "@/components/empty-state";
import {
  DataList,
  DataListActions,
  DataListBody,
  DataListItem,
  DataListItemMain,
  dataListActionsStackClassName,
  dataListItemStackClassName,
} from "@/components/data-list";
import { Button } from "@/components/ui/button";
import { SettingsListHeader } from "../../settings/settings-page";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { AddFaqForm, EditFaqForm } from "./faq-form";
import { FaqCategoryManager } from "./faq-category-manager";
import { RemoveFaqButton } from "./remove-faq-button";
import { useRetainedItem } from "@/hooks/use-retained";

type DrawerMode = { type: "add" } | { type: "edit"; faq: FaqView; index: number };

export function HomepageFaqManager({
  categories,
  faqs,
  maxCategories,
  maxFaqs,
}: {
  categories: FaqCategoryView[];
  faqs: FaqView[];
  maxCategories: number;
  maxFaqs: number;
}) {
  const [mode, setMode] = useState<DrawerMode | null>(null);
  // The drawer keeps its last item while it slides shut; each opening gets
  // a fresh form (keyed on session).
  const { shown, session } = useRetainedItem(mode);
  const [isPending, setIsPending] = useState(false);
  const faqIds = faqs.map((item) => item.id);
  const { moveDown, moveUp, order } = useReorderableIds(faqIds, (ids) => {
    if (ids.join() === faqIds.join()) return;
    return reorderHomepageFaqs(ids);
  });
  const sorted = order
    .map((id) => faqs.find((item) => item.id === id))
    .filter((item): item is FaqView => Boolean(item));
  const atLimit = faqs.length >= maxFaqs;
  const noCategories = categories.length === 0;
  const editingId = shown?.type === "edit" ? shown.faq.id : null;
  const liveIndex = editingId ? faqs.findIndex((item) => item.id === editingId) : -1;
  const editing =
    shown?.type === "edit"
      ? {
          faq: faqs.find((item) => item.id === shown.faq.id) ?? shown.faq,
          index: liveIndex < 0 ? shown.index : liveIndex,
        }
      : null;

  return (
    <div className="flex flex-col gap-8">
      <FaqCategoryManager categories={categories} maxCategories={maxCategories} />

      <div className="flex flex-col gap-4">
        <SettingsListHeader
          action={
            <Button
              disabled={atLimit || noCategories}
              onClick={() => setMode({ type: "add" })}
              size="sm"
            >
              Add FAQ
            </Button>
          }
          title={`Questions (${faqs.length} of ${maxFaqs})`}
        />
        {noCategories ? (
          <p className="text-sm text-muted-foreground">Add a category before you add a question.</p>
        ) : null}
        {atLimit ? (
          <p className="text-sm text-muted-foreground">
            You already have {maxFaqs} FAQs. Remove one to add another.
          </p>
        ) : null}

        {faqs.length === 0 ? (
          <EmptyState
            description="Add one and it will show in the homepage FAQ."
            icon={CircleHelp}
            title="No FAQs yet"
          />
        ) : (
          <DataList>
            {sorted.map((faq, index) => (
              <DataListItem
                className={dataListItemStackClassName}
                key={faq.id}
                onClick={() => setMode({ type: "edit", faq, index })}
              >
                <DataListItemMain className="items-center">
                  <ReorderButtons
                    canMoveDown={index < sorted.length - 1}
                    canMoveUp={index > 0}
                    label={`FAQ ${index + 1}`}
                    onMoveDown={() => moveDown(faq.id)}
                    onMoveUp={() => moveUp(faq.id)}
                  />
                  <DataListBody>
                    <p className="font-medium">FAQ {index + 1}</p>
                    <p className="text-sm text-muted-foreground wrap-break-word">{faq.question}</p>
                    <p className="text-xs text-muted-foreground">{faq.categoryLabel}</p>
                  </DataListBody>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </DataListItemMain>
                <DataListActions className={dataListActionsStackClassName}>
                  <RemoveFaqButton
                    faqId={faq.id}
                    onRemoved={() =>
                      setMode((current) =>
                        current?.type === "edit" && current.faq.id === faq.id ? null : current,
                      )
                    }
                    question={faq.question}
                  />
                </DataListActions>
              </DataListItem>
            ))}
          </DataList>
        )}
      </div>

      <Drawer
        closeDisabled={isPending}
        onOpenChange={(open) => {
          if (!open) setMode(null);
        }}
        open={mode !== null}
        variant="form"
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editing ? `FAQ ${editing.index + 1}` : "Add an FAQ"}</DrawerTitle>
            <DrawerDescription>
              {editing
                ? "Change the category, question, or answer. Save when you are done."
                : "Question, answer, and a category for the filters on the homepage."}
            </DrawerDescription>
          </DrawerHeader>
          {shown?.type === "add" ? (
            <AddFaqForm
              key={session}
              categories={categories}
              disabled={atLimit}
              onPendingChange={setIsPending}
              onSaved={() => setMode(null)}
            />
          ) : null}
          {editing ? (
            <EditFaqForm
              categories={categories}
              faq={editing.faq}
              key={`${session}-${editing.faq.id}`}
              onPendingChange={setIsPending}
              onSaved={() => setMode(null)}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
