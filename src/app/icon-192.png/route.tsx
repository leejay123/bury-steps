import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#111111",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#ffffff",
            fontSize: 112,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          B
        </div>
      </div>
    ),
    { width: 192, height: 192 },
  );
}
