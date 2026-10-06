/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Only cache this site. The default list also answers every other address
 * (Clerk profile photos, maps, and so on). When that answer fails, the
 * photo is left blank.
 */
const runtimeCaching: RuntimeCaching[] = defaultCache.map((entry) => {
  const matcher = entry.matcher;
  return {
    ...entry,
    matcher(options) {
      if (!options.sameOrigin) return false;
      if (typeof matcher === "function") return matcher(options);
      if (matcher instanceof RegExp) return matcher.test(options.url.href);
      return options.url.href.includes(matcher);
    },
  };
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

function alertUrl(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return "/walks";
  return raw;
}

self.addEventListener("push", (event) => {
  const payload = event.data?.json() as { title?: string; body?: string; url?: string } | undefined;
  event.waitUntil(
    self.registration.showNotification(payload?.title || "Walk starting soon", {
      body: payload?.body || "A walk is about to start.",
      icon: "/icons/bury-steps-192.png",
      badge: "/icons/bury-steps-192.png",
      data: { url: alertUrl(payload?.url) },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = alertUrl(event.notification.data?.url);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((window) => window.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});

serwist.addEventListeners();
