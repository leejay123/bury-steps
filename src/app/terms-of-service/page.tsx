import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — Bury Steps Walking Group",
  description: "Terms for using the Bury Steps Walking Group website and taking part in walks.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms cover use of the Bury Steps Walking Group website at{" "}
        <a href="https://burysteps-walkinggroup.co.uk">burysteps-walkinggroup.co.uk</a>{" "}
        and taking part in group walks organised through it.
      </p>

      <h2>The group and the website</h2>
      <p>
        Bury Steps is a local walking group. The website helps members see upcoming walks
        and clock in when they arrive. Organisers create walks and manage membership.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must give accurate details when you sign up.</li>
        <li>You are responsible for keeping your sign-in details safe.</li>
        <li>
          You can sign in with email or with Google, where that option is offered.
        </li>
        <li>Organisers may remove an account if it is misused.</li>
      </ul>

      <h2>Walks and your safety</h2>
      <p>
        Walks are outdoor activities. Weather, paths and fitness vary. You take part at
        your own risk.
      </p>
      <ul>
        <li>
          You must decide whether you are fit to walk on the day. Clock-in includes a
          confirmation that you are fit to take part and responsible for your own safety.
        </li>
        <li>Walks are self-led in the sense that you look after yourself on the route.</li>
        <li>Follow any instructions from the walk leader on the day.</li>
        <li>
          If you share health information at clock-in, it is so a leader can help if you
          need it. It is not a medical service.
        </li>
      </ul>

      <h2>Acceptable use</h2>
      <p>Do not use the site to harass others, share others’ private details, or break the law.</p>

      <h2>Privacy</h2>
      <p>
        How we use personal information is explained in our{" "}
        <a href="/privacy-policy">Privacy Policy</a>.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The date at the top of this page will change when we
        do. Continued use of the site after a change means you accept the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: contact a group organiser through the website once
        you are signed in, or via the person who invited you.
      </p>
    </LegalPage>
  );
}
