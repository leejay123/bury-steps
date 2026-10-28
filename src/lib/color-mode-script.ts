/**
 * Light and dark mode for the shadcn.io site design (see
 * components/color-mode.tsx). Kept outside the "use client" file so the
 * layout can put the script in the page as plain text.
 */
export type ColorMode = "light" | "dark" | "system";
export const COLOR_MODE_KEY = "bs-color-mode";

/** Runs before the page paints: dark only in the shadcn.io design, by the visitor's choice or their device. */
export const COLOR_MODE_SCRIPT = `try{var d=document.documentElement,m=localStorage.getItem("${COLOR_MODE_KEY}")||"system",k=d.getAttribute("data-design")==="shadcnio"&&(m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches));d.classList.toggle("dark",k);d.style.colorScheme=k?"dark":"light"}catch(e){}`;
