import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy — Bury Steps Walking Group",
  description: "How Bury Steps Walking Group uses personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Bury Steps Walking Group (“Bury Steps”, “we”) runs the website{" "}
        <a href="https://burysteps-walkinggroup.co.uk">burysteps-walkinggroup.co.uk</a> so
        members can create an account, see upcoming walks, and clock in at a meeting point.
      </p>
      <p>
        We are based in the United Kingdom. This notice explains what we collect, why we
        collect it, and how long we keep it.
      </p>

      <h2>Who we are</h2>
      <p>
        Bury Steps is a local walking group, not a large company. Organisers of the group
        run this site. If you have a privacy question, contact an organiser through the
        website after you sign in, or ask the person who invited you to the group.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Account details: name and email address, used to sign in and identify you.</li>
        <li>
          Sign-in data: if you sign in with Google or email, our login provider (Clerk)
          processes that request.
        </li>
        <li>Walk records: which walks you are listed on, and when you clock in.</li>
        <li>
          Optional health notes at clock-in: only if you choose to provide them, so a walk
          leader can help if you need it. You must tick a consent box before this is saved.
        </li>
      </ul>

      <h2>Why we use it</h2>
      <p>We use this information to:</p>
      <ul>
        <li>create and manage your member account;</li>
        <li>show you walks and let organisers run the group;</li>
        <li>record attendance when you clock in;</li>
        <li>hold health notes you volunteer, for safety during that walk.</li>
      </ul>
      <p>We do not sell your information. We do not use it for advertising.</p>

      <h2>Who else sees it</h2>
      <ul>
        <li>
          <strong>Clerk</strong> provides sign-in and sign-up. Their privacy notice is on
          clerk.com.
        </li>
        <li>
          <strong>Supabase</strong> stores walk and member records in a database in the
          London region (United Kingdom).
        </li>
        <li>
          <strong>Vercel</strong> hosts the website.
        </li>
        <li>
          <strong>Google</strong> if you choose “Sign in with Google”. Google’s terms and
          privacy policy then also apply to that sign-in.
        </li>
        <li>Walk organisers can see attendance and any health notes you submit.</li>
      </ul>

      <h2>How long we keep it</h2>
      <ul>
        <li>Your account stays until you ask an organiser to delete it, or it is removed.</li>
        <li>Health notes are deleted automatically 90 days after the walk.</li>
        <li>Walk attendance may be kept for the running of the group.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        Under UK data protection law you can ask to see the information we hold about you,
        ask us to correct it, or ask us to delete your account. Contact an organiser to do
        that.
      </p>

      <h2>Children</h2>
      <p>
        This site is for adult members of the walking group. It is not aimed at children.
      </p>
    </LegalPage>
  );
}
