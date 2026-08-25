-- Starter quotes for the homepage. Skip if organisers already added testimonials.
INSERT INTO "HomepageTestimonial" ("id", "sortOrder", "name", "role", "quote", "createdAt", "updatedAt")
SELECT v.id, v."sortOrder", v.name, v.role, v.quote, NOW(), NOW()
FROM (
  VALUES
    ('t_jane', 0, 'Jane H.', 'Member, Bury', 'I used to struggle to get out on a Sunday. These walks gave me a reason to leave the house, and I have made friends I would never have met otherwise.'),
    ('t_david', 1, 'David P.', 'Walks most Sundays', 'Nobody minds if you are slow or quiet. I come for the fresh air and the company, and I always leave feeling better than when I arrived.'),
    ('t_aisha', 2, 'Aisha K.', 'New member', 'I was nervous about joining a group I did not know. People were kind from the first walk. It is the highlight of my week now.')
) AS v(id, "sortOrder", name, role, quote)
WHERE NOT EXISTS (SELECT 1 FROM "HomepageTestimonial");
