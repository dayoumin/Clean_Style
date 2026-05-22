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
  const shouldResetLocalServiceWorker = process.env.NODE_ENV !== "production";

  return (
    <html lang="ko">
      <body className="min-h-screen">
        {shouldResetLocalServiceWorker && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
(() => {
  const localHosts = ["localhost", "127.0.0.1", "::1"];
  if (!localHosts.includes(location.hostname)) return;
  if (!("serviceWorker" in navigator)) return;
  const resetKey = "clean-style-local-sw-reset-v2";
  if (sessionStorage.getItem(resetKey) === "done") return;

  Promise.all([
    navigator.serviceWorker.getRegistrations().then((registrations) =>
      Promise.all(registrations.map((registration) => registration.unregister()))
    ),
    "caches" in window
      ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      : Promise.resolve([])
  ]).then(() => {
    sessionStorage.setItem(resetKey, "done");
    location.reload();
  }).catch(() => undefined);
})();
              `.trim(),
            }}
          />
        )}
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
