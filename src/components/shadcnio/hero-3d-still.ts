/**
 * The remembered picture for the 3D hero look. Drawing the 3D scene takes a
 * moment on every visit, so once it is up the browser keeps a snapshot of its
 * opening frame. On the next visit that snapshot is on screen straight away
 * (put there by STILL_SCRIPT while the page is still being read) and the live
 * scene takes over from the very same frame, so nothing appears to change.
 *
 * A snapshot is only used when it would look exactly like what the scene is
 * about to draw: same width, same colours, same signposts. `stillSignature`
 * sums those up; STILL_SCRIPT works out the same thing in plain JavaScript,
 * so the two must be kept the same.
 */

/** Bump when the scene itself changes, so old snapshots are thrown away. */
const VERSION = 3;
const SIG_KEY = "bs-hero-3d-sig";
const IMG_KEY = "bs-hero-3d-img";
/** The biggest snapshot worth keeping, in characters of storage. */
const TOO_BIG = 1_400_000;

/** How many screen dots the scene draws per CSS pixel: every dot a phone has, up to two on bigger screens. */
export const heroRatio = (width: number) => Math.min(window.devicePixelRatio || 1, width <= 640 ? 3 : 2);

/** How much of the scene the snapshot holds, in CSS pixels up from the bottom: the band plus the fade above it (see .hero-3d-still). */
export function stillHeight(strip: number) {
  return strip + 5 * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
}

export function stillSignature(host: HTMLElement) {
  const band = host.querySelector(".hero-3d-band");
  const w = host.clientWidth;
  if (!band || !w) return "";
  const style = getComputedStyle(host);
  return [
    VERSION,
    w,
    band.clientHeight,
    parseFloat(getComputedStyle(document.documentElement).fontSize),
    heroRatio(w),
    style.getPropertyValue("--background").trim(),
    style.getPropertyValue("--foreground").trim(),
    style.getPropertyValue("--primary").trim(),
    host.getAttribute("data-signs") || "",
  ].join("~");
}

/** Runs inside the picture's box as the page is read: shows the snapshot if it still fits, checking once more when the whole page is in. */
export const STILL_SCRIPT = `(function(){try{var h=document.currentScript.parentElement,i=h.querySelector("img.hero-3d-still"),g=localStorage.getItem("${SIG_KEY}");if(!g||!i)return;function s(){try{if(!i.isConnected||h.hasAttribute("data-still"))return;var b=h.querySelector(".hero-3d-band"),w=h.clientWidth;if(!b||!w)return;var c=getComputedStyle(h),n=[${VERSION},w,b.clientHeight,parseFloat(getComputedStyle(document.documentElement).fontSize),Math.min(window.devicePixelRatio||1,w<=640?3:2),c.getPropertyValue("--background").trim(),c.getPropertyValue("--foreground").trim(),c.getPropertyValue("--primary").trim(),h.getAttribute("data-signs")||""].join("~");if(n!==g)return;var u=localStorage.getItem("${IMG_KEY}");if(!u)return;i.src=u;h.setAttribute("data-still","")}catch(e){}}s();if(!h.hasAttribute("data-still"))document.addEventListener("DOMContentLoaded",s)}catch(e){}})()`;

/** The same as STILL_SCRIPT, for when the page was changed to without a full load. */
export function showStill(host: HTMLElement) {
  try {
    const img = host.querySelector<HTMLImageElement>("img.hero-3d-still");
    if (!img || host.hasAttribute("data-still")) return;
    const sig = stillSignature(host);
    if (!sig || localStorage.getItem(SIG_KEY) !== sig) return;
    const url = localStorage.getItem(IMG_KEY);
    if (!url) return;
    img.src = url;
    host.setAttribute("data-still", "");
  } catch {
    // Storage is switched off: the grey outline holds the place instead.
  }
}

/** Keeps a snapshot for next time, unless the one already kept still fits. `take` is only called if a new one is needed. */
export function rememberStill(host: HTMLElement, take: () => HTMLCanvasElement | null) {
  try {
    const sig = stillSignature(host);
    if (!sig || (localStorage.getItem(SIG_KEY) === sig && localStorage.getItem(IMG_KEY))) return;
    const shot = take();
    if (!shot) return;
    const keepIt = (blob: Blob | null) => {
      if (!blob) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const url = typeof reader.result === "string" ? reader.result : "";
          if (!url || url.length > TOO_BIG) return;
          // The signature goes in last, so a half-saved snapshot is never used.
          localStorage.removeItem(SIG_KEY);
          localStorage.setItem(IMG_KEY, url);
          localStorage.setItem(SIG_KEY, sig);
        } catch {
          try {
            localStorage.removeItem(SIG_KEY);
            localStorage.removeItem(IMG_KEY);
          } catch {
            // Nothing more to tidy.
          }
        }
      };
      reader.readAsDataURL(blob);
    };
    shot.toBlob(
      (blob) => {
        // A browser that can't write WebP hands back a (much bigger) PNG: ask for a JPEG instead.
        if (blob && blob.type !== "image/webp") shot.toBlob(keepIt, "image/jpeg", 0.86);
        else keepIt(blob);
      },
      "image/webp",
      0.86,
    );
  } catch {
    // Storage is switched off or full: there is simply no snapshot next time.
  }
}
