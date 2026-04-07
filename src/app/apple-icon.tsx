import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #22d3ee 100%)",
        }}
      >
        <svg
          viewBox="0 0 32 32"
          width="120"
          height="120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 1 L2 6.5 L2 16 C2 24 7.5 29.5 16 31 C24.5 29.5 30 24 30 16 L30 6.5 Z"
            stroke="white"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M7 18 C9.5 13.5, 13.5 13.5, 16 18 C18.5 22.5, 22.5 22.5, 25 18"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M7.5 12.5 C10.5 8, 14.5 8, 17.5 12.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    size
  );
}
