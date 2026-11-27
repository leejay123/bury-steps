# Story "Viewed by" Implementation Plan

**Goal:** the poster of a story can see who viewed it.
**Spec:** docs/superpowers/specs/2026-11-27-story-viewed-by-design.md (global constraints are there).
**Execution:** inline, in this session.

**Review focus:** expired or deleted story (no record, no error); same person viewing twice (one row);
a photo that fails to load (not a view); asking for someone else's list (refused); swipes and taps
on the open list must not move or close the story.

- [ ] Task 1: `StoryView` model + migration (unique storyId+userId, cascade, RLS on).
- [ ] Task 2: `recordStoryView({ id }): Promise<ActionResult>` in src/server/actions/stories.ts. Tests first.
- [ ] Task 3: `GET /api/stories/[id]/viewers` -> `{ viewers: { id, name, imageUrl, viewedAt }[] }`;
  401 signed out, 404 unless it is your own live story. Tests first.
- [ ] Task 4: viewer UI: record once the photo has loaded; button, list, notice line.
- [ ] Task 5: privacy wording in privacy-policy/page.tsx and site-page-copy.ts; privacy date only.
- [ ] Task 6: tsc, eslint, vitest, full build, desktop and phone screenshots with fake data.
