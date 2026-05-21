import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://clean-style.ecomarin.workers.dev"
  ),
  title: "청렴·존중 셀프 점검 | 공공 연구기관",
  description: "청렴 스타일 진단과 일터 존중 점검을 통해 업무 상황을 기준으로 필요한 조언과 도움 경로를 확인합니다.",
  openGraph: {
    title: "청렴·존중 셀프 점검",
    description: "청렴 스타일 진단과 일터 존중 점검",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "청렴·존중",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
