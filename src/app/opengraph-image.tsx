import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: -1,
            textAlign: "center",
          }}
        >
          Bury Steps Walking Group
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#c9c9c9",
            textAlign: "center",
          }}
        >
          Weekly walks around Bury
        </div>
      </div>
    ),
    { ...size },
  );
}
