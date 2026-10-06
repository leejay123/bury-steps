import { NextResponse } from "next/server";
import { z } from "zod";
import { getOptionalUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pushEndpointAllowed } from "@/lib/walk-push";

const subscriptionSchema = z.object({
  endpoint: z.string().min(1).max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(200),
  }),
});

export async function POST(req: Request) {
  const user = await getOptionalUser();
  if (!user) return new NextResponse("Unauthorised", { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Check the form and try again." }, { status: 400 });
  }
  const parsed = subscriptionSchema.safeParse(json);
  if (!parsed.success || !pushEndpointAllowed(parsed.data.endpoint)) {
    return NextResponse.json({ ok: false, error: "That notification address isn't valid." }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: {
      userId: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
    update: {
      userId: user.id,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getOptionalUser();
  if (!user) return new NextResponse("Unauthorised", { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    json = {};
  }
  const endpoint = z.object({ endpoint: z.string().min(1).max(2000) }).safeParse(json);
  if (endpoint.success) {
    await prisma.pushSubscription.deleteMany({
      where: { userId: user.id, endpoint: endpoint.data.endpoint },
    });
  } else {
    await prisma.pushSubscription.deleteMany({ where: { userId: user.id } });
  }
  return NextResponse.json({ ok: true });
}
