INSERT INTO "HomepageTestimonial" ("id", "sortOrder", "name", "role", "quote", "createdAt", "updatedAt")
VALUES
  ('t_margaret', 3, 'Margaret L.', 'Member', 'The walks are the one thing I keep in the diary. Kind people, a steady pace, and I always feel better for going.', NOW(), NOW()),
  ('t_tom', 4, 'Tom R.', 'Walks when he can', 'I come when work allows. Nobody makes a fuss if I miss a week. It is the easiest group I have ever joined.', NOW(), NOW()),
  ('t_lin', 5, 'Lin W.', 'New to Bury', 'I moved here and did not know anyone. Two Sundays later I had names, faces, and a reason to get outside.', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;
