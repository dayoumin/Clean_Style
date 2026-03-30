import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "../styles/globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "https";

  return {
    metadataBase: new URL(`${proto}://${host}`),
    title: "나의 청렴 스타일은? | 공공 연구기관 청렴 스타일 테스트",
    description: "재미로 알아보는 청렴 스타일 자기발견 테스트. 15개 상황, 3분이면 나의 업무 스타일을 알 수 있어요.",
    openGraph: {
      title: "나의 청렴 스타일은?",
      description: "재미로 알아보는 청렴 스타일 자기발견 테스트",
      type: "website",
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/icons/icon-192x192.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "청렴스타일",
    },
  };
}

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
