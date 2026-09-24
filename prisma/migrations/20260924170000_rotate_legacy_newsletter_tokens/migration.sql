-- Rotate legacy cuid()-shaped newsletter unsubscribe tokens (25 chars)
-- to unguessable 24-char tokens matching makeCapabilityToken length.
-- Rows already on nanoid(24) are left alone.

UPDATE "NewsletterSubscriber"
SET "unsubscribeToken" = substr(
  replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  1,
  24
)
WHERE char_length("unsubscribeToken") <> 24;
