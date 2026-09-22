-- The customizable Organiser role grid (Settings -> Roles) has been
-- removed — an organiser now always has full access (everything except
-- inviting/promoting/demoting another organiser, which stays owner-only).
-- Nothing to migrate back to User: FULL_ORGANISER_PERMISSIONS is now just
-- a constant in code, not stored data.
DROP TABLE "RolePermissions";
