import { Prisma } from "@prisma/client";
import webpush from "web-push";
import { prisma } from "@/lib/db";
import { vapidConfig } from "@/lib/vapid";
import { startingSoonPushPayload, type StartingSoonWalk } from "@/lib/walk-push";

export type PushSendResult = { sent: number; failed: number; removed: number };

/**
 * Sends one walk alert to every phone that has not already received it.
 * A phone that fails is left unmarked, so the next look tries again.
 * Dead subscriptions are removed.
 */
export async function sendStartingSoonPush(walk: StartingSoonWalk): Promise<PushSendResult> {
  const config = vapidConfig();
  if (!config) return { sent: 0, failed: 0, removed: 0 };

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  const payload = JSON.stringify(startingSoonPushPayload(walk));
  const [already, subscriptions] = await Promise.all([
    prisma.walkAlertDelivery.findMany({
      where: { walkId: walk.id },
      select: { subscriptionId: true },
    }),
    prisma.pushSubscription.findMany({
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    }),
  ]);
  const done = new Set(already.map((row) => row.subscriptionId));

  let sent = 0;
  let failed = 0;
  const gone: string[] = [];
  await Promise.all(
    subscriptions.map(async (row) => {
      if (done.has(row.id)) return;
      try {
        await prisma.walkAlertDelivery.create({
          data: { walkId: walk.id, subscriptionId: row.id },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return;
        failed += 1;
        console.error("sendStartingSoonPush claim", row.id, err);
        return;
      }
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          payload,
        );
        sent += 1;
      } catch (err) {
        const status = typeof err === "object" && err && "statusCode" in err ? Number(err.statusCode) : 0;
        await prisma.walkAlertDelivery.deleteMany({
          where: { walkId: walk.id, subscriptionId: row.id },
        });
        if (status === 404 || status === 410) gone.push(row.id);
        else {
          failed += 1;
          console.error("sendStartingSoonPush", row.id, err);
        }
      }
    }),
  );

  if (gone.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });
  }
  return { sent, failed, removed: gone.length };
}
