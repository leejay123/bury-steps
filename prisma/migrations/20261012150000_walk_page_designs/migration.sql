-- Walk page designer (Puck): the designs built in Settings, as JSON —
-- { "organiser": <Puck data>, "member": <Puck data>, "visitor": <Puck data> }.
-- Empty until one is saved; the walk pages then use a ready-made start.
ALTER TABLE "SiteSetting" ADD COLUMN "walkPageDesigns" TEXT NOT NULL DEFAULT '';
