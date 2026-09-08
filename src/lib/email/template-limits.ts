// Deliberately dependency-free: both the "use server" action
// (src/server/actions/email-templates.ts) and the client-side edit form
// (src/app/admin/settings/emails/email-template-editor.tsx) need these, and
// a client component can't safely import a plain value from a module that
// also pulls in server-only APIs (next/cache, prisma) — Next can swap a
// real Server Action export for a lightweight client stub, but it can't do
// that for an ordinary constant, so the whole module — server imports
// included — would end up in the client bundle.
export const MAX_EMAIL_TEMPLATE_SUBJECT = 200;
export const MAX_EMAIL_TEMPLATE_BODY = 4000;
