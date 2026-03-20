import type { Metadata, Viewport } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "나의 청렴 스타일은? | 공공 연구기관 청렴 스타일 테스트",
  description: "공공 연구기관 종사자를 위한 청렴 스타일 자기발견 테스트. 15개 상황, 3분이면 나의 업무 스타일을 알 수 있어요.",
  openGraph: {
    title: "나의 청렴 스타일은?",
    description: "공공 연구기관 종사자를 위한 청렴 스타일 자기발견 테스트",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[var(--color-bg)]">
        <main className="mx-auto max-w-md px-5 pb-12 pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}
