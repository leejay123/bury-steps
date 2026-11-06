-- Give existing reports a number from the person who recorded them
-- (first letters of first + last name, then 001, 002… for that person).
-- Already-numbered rows stay as they are; this only fills blanks.
WITH named AS (
  SELECT
    r.id,
    r."createdAt",
    UPPER(
      COALESCE(LEFT(NULLIF(BTRIM(u."firstName"), ''), 1), '')
      || COALESCE(LEFT(NULLIF(BTRIM(u."lastName"), ''), 1), '')
    ) AS prefix
  FROM "AccidentReport" r
  JOIN "User" u ON u.id = r."createdById"
  WHERE r."reportNumber" IS NULL
),
prefixed AS (
  SELECT
    id,
    "createdAt",
    CASE WHEN prefix = '' THEN 'XX' ELSE prefix END AS prefix
  FROM named
),
existing_max AS (
  SELECT
    regexp_replace("reportNumber", '[0-9]+$', '') AS prefix,
    MAX(NULLIF(regexp_replace("reportNumber", '^[^0-9]+', ''), '')::int) AS highest
  FROM "AccidentReport"
  WHERE "reportNumber" IS NOT NULL
  GROUP BY 1
),
numbered AS (
  SELECT
    p.id,
    p.prefix || LPAD(
      (
        COALESCE(e.highest, 0)
        + ROW_NUMBER() OVER (PARTITION BY p.prefix ORDER BY p."createdAt", p.id)
      )::text,
      3,
      '0'
    ) AS num
  FROM prefixed p
  LEFT JOIN existing_max e ON e.prefix = p.prefix
)
UPDATE "AccidentReport" r
SET "reportNumber" = n.num
FROM numbered n
WHERE r.id = n.id;
