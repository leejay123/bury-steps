export type VapidConfig = { publicKey: string; privateKey: string; subject: string };

/** Keys for sending phone alerts. Missing keys means the feature stays off. */
export function vapidConfig(): VapidConfig | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "https://burysteps-walkinggroup.co.uk";
  if (!publicKey || !privateKey) return null;
  if (!subject.startsWith("mailto:") && !subject.startsWith("https:")) return null;
  return { publicKey, privateKey, subject };
}
