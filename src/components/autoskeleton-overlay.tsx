"use client";

import {
  ArticleSkeleton,
  CardSkeleton,
  DashboardSkeleton,
  FormSkeleton,
  ListSkeleton,
  ProfileSkeleton,
  SkeletonProvider,
  TableSkeleton,
} from "@gyojiro/autoskeleton-react";
import "@gyojiro/autoskeleton-react/style.css";

/** Where one loading placeholder sits on the page (autoskeleton-test.tsx). */
export type AutoSkeletonBox = { x: number; y: number; width: number; height: number; home: boolean };

/**
 * AutoSkeleton's ready-made shape for the kind of page this is. The library
 * doesn't measure the page: each shape is generic (a list, a form, an
 * article…), which is exactly what this test shows.
 */
function ShapeFor({ path, box }: { path: string; box: AutoSkeletonBox }) {
  const rows = Math.max(3, Math.floor(box.height / 72));
  if (box.home) return <CardSkeleton showImage={false} />;
  if (/^\/(admin\/walks\/[^/]+|w\/[^/]+)$/.test(path)) return <ArticleSkeleton heroHeight={200} />;
  if (/^\/admin\/members\/[^/]+$/.test(path)) return <ProfileSkeleton />;
  if (path === "/progress") return <DashboardSkeleton tableRows={4} />;
  if (path === "/admin/settings") return <TableSkeleton columns={3} rows={rows} />;
  if (path.startsWith("/admin/settings/")) return <FormSkeleton fields={Math.max(3, Math.floor(box.height / 90))} />;
  return <ListSkeleton items={rows} lines={2} />;
}

/** The AutoSkeleton shapes, each over the placeholder it stands in for. Loaded only when picked. */
export function AutoSkeletonOverlay({ boxes, path }: { boxes: AutoSkeletonBox[]; path: string }) {
  return (
    <SkeletonProvider color="var(--accent)" highlight="var(--background)">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[1]" data-autoskeleton-overlay="">
        {boxes.map((box, index) => (
          <div
            className="absolute overflow-hidden bg-background"
            key={index}
            style={{ height: box.height, left: box.x, top: box.y, width: box.width }}
          >
            <ShapeFor box={box} path={path} />
          </div>
        ))}
      </div>
    </SkeletonProvider>
  );
}
