import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          background: "transparent",
        }}
      >
        <svg
          viewBox="0 0 32 32"
          width="32"
          height="32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="g"
              x1="16"
              y1="0"
              x2="16"
              y2="32"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <path
            d="M16 0 L1 5.5 L1 16 C1 24.5 7 30.5 16 32 C25 30.5 31 24.5 31 16 L31 5.5 Z"
            stroke="url(#g)"
            strokeWidth="3"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M6.5 18.5 C9 14, 13 14, 16 18.5 C19 23, 23 23, 25.5 18.5"
            stroke="url(#g)"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M7 12.5 C10 7.5, 14.5 7.5, 17.5 12.5"
            stroke="url(#g)"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
