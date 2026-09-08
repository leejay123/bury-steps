import { sendEmail } from "./client";
import { getEmailBrand } from "./brand";
import { resolveEmailCopy } from "./overrides";
import { getOrCreateUserUnsubscribeToken, memberPreferencesUrl, newsletterUnsubscribeUrl } from "./unsubscribe";
import type { EmailTemplateKey } from "./registry";
import { WelcomeEmail } from "./templates/welcome";
import { AccountDeletedEmail } from "./templates/account-deleted";
import { AdminPromotedEmail } from "./templates/admin-promoted";
import { AdminDemotedEmail } from "./templates/admin-demoted";
import { ContactMessageReceivedEmail } from "./templates/contact-message-received";
import { ContactMessageAdminAlertEmail } from "./templates/contact-message-admin-alert";
import { NewsletterSubscribedEmail } from "./templates/newsletter-subscribed";
import { WalkAnnouncedEmail } from "./templates/walk-announced";
import { WalkCancelledEmail } from "./templates/walk-cancelled";
import { WalkReopenedEmail } from "./templates/walk-reopened";
import { AddedToWalkEmail } from "./templates/added-to-walk";
import { AccidentReportAlertEmail } from "./templates/accident-report-alert";
import type { ReactElement } from "react";

export type TestRecipient = {
  id: string;
  email: string;
  firstName: string | null;
  unsubscribeToken: string | null;
};

/** Made-up but plausible stand-ins for a walk, so an admin can preview every
 * walk-related template without a real walk having to exist. */
const SAMPLE_WALK = {
  title: "Riverside Amble",
  whenText: "Sun, 14 Sep · 10:00",
  durationText: "1 hour 30 minutes",
  meetingPoint: "The Rock, Bury",
  what3words: null as string | null,
};

const SAMPLE_SENDER = { name: "Sam Rivera", email: "sam.rivera@example.com", phone: "07123 456789" };
const SAMPLE_MESSAGE =
  "Hi, I'd love to join a walk this weekend — how do I sign up? Thanks!";

/**
 * Sends one real, live-rendered copy of a template to the requesting admin's
 * own address — never to a real member or another organiser — using
 * realistic placeholder data instead of a real walk/message/report. Lets an
 * admin check how a template (including their own saved edits) actually
 * renders in a real inbox without doing something to trigger it for real
 * (cancelling a real walk, deleting a real account, ...).
 *
 * Always renders the template's *saved* copy (resolveEmailCopy reads the
 * same override row the real send would) — save an edit first, then send a
 * test, to preview it.
 */
export async function sendTestEmail(key: EmailTemplateKey, admin: TestRecipient): Promise<void> {
  const [brand, preferencesUrl] = await Promise.all([
    getEmailBrand(),
    getOrCreateUserUnsubscribeToken(admin.id, admin.unsubscribeToken).then(memberPreferencesUrl),
  ]);
  const firstName = admin.firstName?.trim() || "there";

  async function send(subject: string, react: ReactElement): Promise<void> {
    // "[Test]" is not cosmetic — accidentReportAlert and contactAdminAlert
    // land in the same inbox as the real thing, so an unmarked test send
    // could read as a genuine accident report or contact message.
    await sendEmail({ to: admin.email, subject: `[Test] ${subject}`, react });
  }

  switch (key) {
    case "welcome": {
      const copy = await resolveEmailCopy("welcome", {
        firstName,
        siteName: brand.siteName,
        siteUrl: brand.siteUrl,
      });
      await send(
        copy.subject,
        WelcomeEmail({ ...brand, firstName: admin.firstName, preferencesUrl, bodyParagraphs: copy.bodyParagraphs }),
      );
      return;
    }
    case "accountDeleted": {
      const copy = await resolveEmailCopy("accountDeleted", { firstName, siteName: brand.siteName });
      await send(copy.subject, AccountDeletedEmail({ ...brand, bodyParagraphs: copy.bodyParagraphs }));
      return;
    }
    case "adminPromoted": {
      const copy = await resolveEmailCopy("adminPromoted", {
        firstName,
        siteName: brand.siteName,
        siteUrl: brand.siteUrl,
      });
      await send(
        copy.subject,
        AdminPromotedEmail({ ...brand, preferencesUrl, bodyParagraphs: copy.bodyParagraphs }),
      );
      return;
    }
    case "adminDemoted": {
      const copy = await resolveEmailCopy("adminDemoted", {
        firstName,
        siteName: brand.siteName,
        siteUrl: brand.siteUrl,
      });
      await send(
        copy.subject,
        AdminDemotedEmail({ ...brand, preferencesUrl, bodyParagraphs: copy.bodyParagraphs }),
      );
      return;
    }
    case "contactReceived": {
      const copy = await resolveEmailCopy("contactReceived", {
        name: firstName,
        email: admin.email,
        message: SAMPLE_MESSAGE,
        siteName: brand.siteName,
      });
      await send(
        copy.subject,
        ContactMessageReceivedEmail({ ...brand, message: SAMPLE_MESSAGE, bodyParagraphs: copy.bodyParagraphs }),
      );
      return;
    }
    case "contactAdminAlert": {
      const copy = await resolveEmailCopy("contactAdminAlert", {
        name: SAMPLE_SENDER.name,
        email: SAMPLE_SENDER.email,
        message: SAMPLE_MESSAGE,
        siteName: brand.siteName,
      });
      await send(
        copy.subject,
        ContactMessageAdminAlertEmail({
          ...brand,
          ...SAMPLE_SENDER,
          message: SAMPLE_MESSAGE,
          bodyParagraphs: copy.bodyParagraphs,
        }),
      );
      return;
    }
    case "newsletterSubscribed": {
      const copy = await resolveEmailCopy("newsletterSubscribed", { siteName: brand.siteName });
      await send(
        copy.subject,
        NewsletterSubscribedEmail({
          ...brand,
          unsubscribeUrl: newsletterUnsubscribeUrl("sample"),
          bodyParagraphs: copy.bodyParagraphs,
        }),
      );
      return;
    }
    case "walkAnnounced": {
      const copy = await resolveEmailCopy("walkAnnounced", {
        firstName,
        siteName: brand.siteName,
        walkTitle: SAMPLE_WALK.title,
        whenText: SAMPLE_WALK.whenText,
        durationText: SAMPLE_WALK.durationText,
        meetingPoint: SAMPLE_WALK.meetingPoint,
      });
      await send(
        copy.subject,
        WalkAnnouncedEmail({
          ...brand,
          title: SAMPLE_WALK.title,
          whenText: SAMPLE_WALK.whenText,
          durationText: SAMPLE_WALK.durationText,
          meetingPoint: SAMPLE_WALK.meetingPoint,
          what3words: SAMPLE_WALK.what3words,
          shareUrl: `${brand.siteUrl}/w/sample`,
          preferencesUrl,
          bodyParagraphs: copy.bodyParagraphs,
        }),
      );
      return;
    }
    case "walkCancelled": {
      const reason = "Heavy rain forecast";
      const copy = await resolveEmailCopy("walkCancelled", {
        firstName,
        siteName: brand.siteName,
        walkTitle: SAMPLE_WALK.title,
        whenText: SAMPLE_WALK.whenText,
        reason,
      });
      await send(
        copy.subject,
        WalkCancelledEmail({
          ...brand,
          title: SAMPLE_WALK.title,
          whenText: SAMPLE_WALK.whenText,
          reason,
          shareUrl: `${brand.siteUrl}/w/sample`,
          preferencesUrl,
          bodyParagraphs: copy.bodyParagraphs,
        }),
      );
      return;
    }
    case "walkReopened": {
      const copy = await resolveEmailCopy("walkReopened", {
        firstName,
        siteName: brand.siteName,
        walkTitle: SAMPLE_WALK.title,
        whenText: SAMPLE_WALK.whenText,
        durationText: SAMPLE_WALK.durationText,
        meetingPoint: SAMPLE_WALK.meetingPoint,
      });
      await send(
        copy.subject,
        WalkReopenedEmail({
          ...brand,
          title: SAMPLE_WALK.title,
          whenText: SAMPLE_WALK.whenText,
          durationText: SAMPLE_WALK.durationText,
          meetingPoint: SAMPLE_WALK.meetingPoint,
          what3words: SAMPLE_WALK.what3words,
          shareUrl: `${brand.siteUrl}/w/sample`,
          preferencesUrl,
          bodyParagraphs: copy.bodyParagraphs,
        }),
      );
      return;
    }
    case "addedToWalk": {
      const copy = await resolveEmailCopy("addedToWalk", {
        firstName,
        siteName: brand.siteName,
        walkTitle: SAMPLE_WALK.title,
        whenText: SAMPLE_WALK.whenText,
        meetingPoint: SAMPLE_WALK.meetingPoint,
      });
      await send(
        copy.subject,
        AddedToWalkEmail({
          ...brand,
          title: SAMPLE_WALK.title,
          whenText: SAMPLE_WALK.whenText,
          meetingPoint: SAMPLE_WALK.meetingPoint,
          shareUrl: `${brand.siteUrl}/w/sample`,
          preferencesUrl,
          bodyParagraphs: copy.bodyParagraphs,
        }),
      );
      return;
    }
    case "accidentReportAlert": {
      const createdByName = "Sample Organiser";
      const whoInvolved = "A member on the walk";
      const copy = await resolveEmailCopy("accidentReportAlert", {
        createdByName,
        whenText: SAMPLE_WALK.whenText,
        walkTitle: SAMPLE_WALK.title,
        whoInvolved,
        siteName: brand.siteName,
      });
      await send(
        copy.subject,
        AccidentReportAlertEmail({
          ...brand,
          whenText: SAMPLE_WALK.whenText,
          walkTitle: SAMPLE_WALK.title,
          whoInvolved,
          createdByName,
          bodyParagraphs: copy.bodyParagraphs,
        }),
      );
      return;
    }
    default: {
      const exhaustive: never = key;
      throw new Error(`No test sender wired up for template "${exhaustive}".`);
    }
  }
}
