import { EmailButton, EmailFact, EmailLayout, EmailParagraphs, type EmailBrand } from "../shared";

export type ProgressSummaryEmailProps = EmailBrand & {
  monthLabel: string;
  monthCount: number;
  streakWeeks: number;
  yearCount: number;
  together: { goal: number; count: number } | null;
  preferencesUrl: string;
  bodyParagraphs: string[];
};

export function ProgressSummaryEmail({
  monthLabel,
  monthCount,
  streakWeeks,
  yearCount,
  together,
  preferencesUrl,
  bodyParagraphs,
  ...brand
}: ProgressSummaryEmailProps) {
  return (
    <EmailLayout
      heading={`Your ${monthLabel} in walks`}
      preferencesUrl={preferencesUrl}
      previewText={`${monthCount} walk${monthCount === 1 ? "" : "s"} this month.`}
      {...brand}
    >
      <EmailParagraphs paragraphs={bodyParagraphs} />
      <EmailFact label="Walks this month" value={String(monthCount)} />
      <EmailFact
        label={streakWeeks === 1 ? "Week in a row" : "Weeks in a row"}
        value={String(streakWeeks)}
      />
      <EmailFact label="Walks this year" value={String(yearCount)} />
      {together ? (
        <EmailFact label="Group goal" value={`${together.count} of ${together.goal}`} />
      ) : null}
      <EmailButton href={`${brand.siteUrl}/progress`}>See your full progress</EmailButton>
    </EmailLayout>
  );
}
