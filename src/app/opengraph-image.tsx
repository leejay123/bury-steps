import { ImageResponse } from "next/og";
import { getSiteTheme } from "@/lib/site-theme";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const theme = await getSiteTheme();
  const subtitle =
    theme.siteTagline.length > 80
      ? `${theme.siteTagline.slice(0, 77).trimEnd()}…`
      : theme.siteTagline;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          backgroundColor: "#111111",
          color: "#ffffff",
          fontFamily: "sans-serif",
          padding: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 96,
          }}
        >
          🥾
        </div>
        <div
          style={{
            display: "flex",
            fontSize: theme.siteName.length > 28 ? 52 : 72,
            fontWeight: 700,
            letterSpacing: -1,
            textAlign: "center",
          }}
        >
          {theme.siteName}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#c9c9c9",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    { ...size },
  );
}
