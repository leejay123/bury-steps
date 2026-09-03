import type { Metadata } from "next";
import { Facebook, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PAGE_X } from "@/lib/page-x";
import { getSiteTheme } from "@/lib/site-theme";
import { ContactForm } from "./contact-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact us",
};

export default async function ContactPage() {
  const theme = await getSiteTheme();
  const facebookUrl = theme.facebookGroupUrl.trim();

  return (
    <div className={`mx-auto flex max-w-4xl flex-col gap-6 py-8 md:py-10 ${PAGE_X}`}>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Contact us</h1>
        <p className="text-muted-foreground">
          {"Questions about joining, a walk, or anything else — send us a message and we'll get back to you."}
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <CardContent className="grid gap-8 p-6 md:grid-cols-2 md:gap-10 md:p-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border">
                <Mail aria-hidden className="size-4" />
              </div>
              <div>
                <p className="font-medium">Message us here</p>
                <p className="text-sm text-muted-foreground">
                  We usually reply within a few days.
                </p>
              </div>
            </div>
            {facebookUrl ? (
              <a
                className="flex items-start gap-3 rounded-md hover:bg-accent"
                href={facebookUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border">
                  <Facebook aria-hidden className="size-4" />
                </div>
                <div>
                  <p className="font-medium">Facebook group</p>
                  <p className="text-sm text-muted-foreground">
                    Chat with the group directly and see the latest updates.
                  </p>
                </div>
              </a>
            ) : null}
          </div>

          <ContactForm />
        </CardContent>
      </Card>
    </div>
  );
}
