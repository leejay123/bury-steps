import type { CSSProperties, ReactNode } from "react";
import { Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components";

// Email clients don't reliably load web fonts, so this matches the system
// stack the site itself falls back to, rather than trying to ship a font.
const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// Same fixed black-and-white palette as the public site (globals.css'
// --foreground/--primary/--muted-foreground/--border) — every template
// reuses these instead of picking its own colours.
const INK = "#0d0d0d";
const BODY_TEXT = "#262626";
const MUTED_TEXT = "#737373";
const BORDER = "#e5e5e5";

export type EmailLayoutProps = {
  /** Shown as the inbox preview line, before the email is opened. Keep it to one short sentence. */
  previewText: string;
  /** The one heading every email has, right under the logo. */
  heading: string;
  siteName: string;
  /** Absolute URL — email clients can't resolve relative paths. */
  logoUrl: string;
  /** Absolute URL, used for the footer's site link. */
  siteUrl: string;
  /** Footer "Manage email preferences" link. Omit only for emails with no preference to manage (e.g. account-deletion confirmation). */
  preferencesUrl?: string;
  children: ReactNode;
};

/**
 * The one template every email in the app renders through — see
 * src/lib/email/templates/*.tsx for the callers. Keeping every email's
 * chrome (logo, heading, footer, colours) in this single component is what
 * keeps them all looking like the same product instead of drifting apart
 * one template at a time.
 */
export function EmailLayout({
  previewText,
  heading,
  siteName,
  logoUrl,
  siteUrl,
  preferencesUrl,
  children,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: "#ffffff", margin: 0, padding: "24px 0", fontFamily: FONT_STACK }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto" }}>
          <Section style={{ padding: "0 32px 24px", borderBottom: `1px solid ${BORDER}` }}>
            <Img alt={siteName} height="32" src={logoUrl} style={{ height: "32px", width: "auto" }} />
          </Section>

          <Section style={{ padding: "32px" }}>
            <Heading style={{ margin: "0 0 16px", fontSize: "20px", fontWeight: 400, color: INK }}>
              {heading}
            </Heading>
            <div style={{ fontSize: "15px", lineHeight: "24px", color: BODY_TEXT }}>{children}</div>
          </Section>

          <Hr style={{ borderColor: BORDER, margin: 0 }} />

          <Section style={{ padding: "20px 32px" }}>
            <Text
              style={{
                margin: 0,
                fontSize: "12px",
                fontWeight: 400,
                lineHeight: "18px",
                color: MUTED_TEXT,
              }}
            >
              {siteName} ·{" "}
              <Link href={siteUrl} style={{ color: MUTED_TEXT, textDecoration: "underline" }}>
                {siteUrl.replace(/^https?:\/\//, "")}
              </Link>
              {preferencesUrl ? (
                <>
                  {" "}
                  ·{" "}
                  <Link href={preferencesUrl} style={{ color: MUTED_TEXT, textDecoration: "underline" }}>
                    Manage email preferences
                  </Link>
                </>
              ) : null}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/**
 * The one body-text style every template uses instead of reaching for
 * @react-email/components' Text directly — explicit normal weight, so this
 * never renders bold regardless of what a given email client would
 * otherwise default a bare <p> to.
 */
export function EmailText({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <Text
      style={{
        margin: "0 0 16px",
        fontSize: "15px",
        fontWeight: 400,
        lineHeight: "24px",
        color: BODY_TEXT,
        ...style,
      }}
    >
      {children}
    </Text>
  );
}

/**
 * Renders admin-editable body copy (src/lib/email/overrides.ts) as one
 * <EmailText> per paragraph. Renders nothing for an empty list — the two
 * organiser-alert templates default to no intro prose at all.
 */
export function EmailParagraphs({ paragraphs }: { paragraphs: string[] }) {
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <EmailText key={index}>{paragraph}</EmailText>
      ))}
    </>
  );
}

/** A labelled fact row, e.g. "Meeting point — Burrs Country Park". Used by
 * walk-related emails to lay out details without each template reinventing it. */
export function EmailFact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 8px",
        fontSize: "15px",
        fontWeight: 400,
        lineHeight: "22px",
        color: BODY_TEXT,
      }}
    >
      <span style={{ color: MUTED_TEXT }}>{label}</span> — {value}
    </Text>
  );
}

/** The one button style every email uses for its call to action. Normal
 * weight, same as everything else in these emails. */
export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ margin: "24px 0 8px" }}>
      <Link
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: INK,
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: 400,
          padding: "12px 22px",
          borderRadius: "6px",
          textDecoration: "none",
        }}
      >
        {children}
      </Link>
    </Section>
  );
}
