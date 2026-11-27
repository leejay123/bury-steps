# Story "Viewed by" — design (approved 27 November 2026)

**Why:** a member who posts a story wants to see which members viewed it, like Instagram.

**Approaches:** (1) store each view in the database — chosen; (2) the existing "seen" memory in
each browser — rejected, the poster can never read it.

- A signed-in person opening someone else's story is recorded once (first view). Never your own.
  Organisers count like anyone else.
- Your own story shows "Viewed by N". Tapping pauses the story and lists name, photo and time
  since first view, newest first. None: "Viewed by 0".
- Only the poster can get the list. Not other members, not organisers.
- Under other people's stories: "They can see you viewed this."
- Views are deleted with the story. New table has Row Level Security on.
- Privacy wording: "Stories: photos you post show to signed-in members for 24 hours. If you view
  someone's story, they can see your name, photo and when you viewed it. Organisers can remove
  stories and see reports about them."
- Loading uses grey shapes. No test data in the live database. Ask the owner before publishing.
