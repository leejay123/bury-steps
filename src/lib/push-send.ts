import webpush from "web-push";
import { prisma } from "@/lib/db";
import { vapidConfig } from "@/lib/vapid";
import { startingSoonPushPayload, type StartingSoonWalk } from "@/lib/walk-push";

export type PushSendResult = { sent: number; failed: number; removed: number };

/** Sends one walk alert to every stored subscription. Dead subscriptions are removed. */
export async function sendStartingSoonPush(walk: StartingSoonWalk): Promise<PushSendResult> {
  const config = vapidConfig();
  if (!config) return { sent: 0, failed: 0, removed: 0 };

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  const payload = JSON.stringify(startingSoonPushPayload(walk));
  const subscriptions = await prisma.pushSubscription.findMany({
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  let sent = 0;
  let failed = 0;
  const gone: string[] = [];
  await Promise.all(
    subscriptions.map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          payload,
        );
        sent += 1;
      } catch (err) {
        const status = typeof err === "object" && err && "statusCode" in err ? Number(err.statusCode) : 0;
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
