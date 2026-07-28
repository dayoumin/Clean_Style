import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { APP_COPY } from "@/data/appVariant";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://clean-style.ecomarin.workers.dev"
  ),
  title: `${APP_COPY.title} | 공공 연구기관`,
  description: APP_COPY.description,
  openGraph: {
    title: APP_COPY.title,
    description: APP_COPY.description,
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_COPY.shortTitle,
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
