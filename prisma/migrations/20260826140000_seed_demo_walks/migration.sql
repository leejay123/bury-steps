-- Sample walks for the group diary. Attached to the first organiser (or first member).
-- Skip a row if that id or share token is already in use.
INSERT INTO "Walk" (
  "id",
  "token",
  "title",
  "description",
  "location",
  "startsAt",
  "durationMins",
  "cancelledAt",
  "cancelledReason",
  "createdById",
  "createdAt"
)
SELECT
  v.id,
  v.token,
  v.title,
  v.description,
  v.location,
  v.starts_at,
  v.duration_mins,
  v.cancelled_at,
  v.cancelled_reason,
  u.id,
  NOW()
FROM (
  VALUES
    (
      'walk_seed_nuttall',
      'seednuttallpk',
      'Nuttall Park and the Irwell',
      'A gentle loop through Nuttall Park and along the river. Easy underfoot and a good first Sunday with the group.',
      'Nuttall Park, Ramsbottom',
      TIMESTAMPTZ '2026-08-16 12:00:00+00',
      90,
      NULL::timestamptz,
      NULL::text
    ),
    (
      'walk_seed_elton',
      'seedeltonresv',
      'Elton Reservoir circuit',
      'Around the reservoir on the paths. Steady pace, time to chat, and a sit-down if anyone needs it.',
      'Elton Reservoir, Bury',
      TIMESTAMPTZ '2026-08-23 12:00:00+00',
      90,
      NULL::timestamptz,
      NULL::text
    ),
    (
      'walk_seed_burrs',
      'seedburrspark',
      'Burrs Country Park loop',
      'Meet by the visitor centre. Through the park and back along the Irwell. Bring a bottle of water.',
      'Burrs Country Park, Bury',
      TIMESTAMPTZ '2026-08-30 12:00:00+00',
      90,
      NULL::timestamptz,
      NULL::text
    ),
    (
      'walk_seed_philips',
      'seedphilipspk',
      'Philips Park woodland',
      'Shaded paths through Philips Park. A little longer than usual, with a pause at the café if it is open.',
      'Philips Park, Whitefield',
      TIMESTAMPTZ '2026-09-06 13:00:00+00',
      120,
      NULL::timestamptz,
      NULL::text
    ),
    (
      'walk_seed_heaton',
      'seedheatonpkx',
      'Heaton Park Sunday',
      'Called off because of standing water on the paths. We will put another date in when it dries out.',
      'Heaton Park, Prestwich',
      TIMESTAMPTZ '2026-09-13 12:00:00+00',
      90,
      TIMESTAMPTZ '2026-08-26 10:00:00+00',
      'Heavy rain and wet paths. Stay home this week — we will go again soon.'
    )
) AS v(
  id,
  token,
  title,
  description,
  location,
  starts_at,
  duration_mins,
  cancelled_at,
  cancelled_reason
)
JOIN LATERAL (
  SELECT id
  FROM "User"
  ORDER BY CASE WHEN role = 'ADMIN' THEN 0 ELSE 1 END, "createdAt" ASC
  LIMIT 1
) u ON true
WHERE NOT EXISTS (
  SELECT 1 FROM "Walk" w WHERE w.id = v.id OR w.token = v.token
);
