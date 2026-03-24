import type { Metadata, Viewport } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "나의 청렴 스타일은? | 공공 연구기관 청렴 스타일 테스트",
  description: "재미로 알아보는 청렴 스타일 자기발견 테스트. 15개 상황, 3분이면 나의 업무 스타일을 알 수 있어요.",
  openGraph: {
    title: "나의 청렴 스타일은?",
    description: "재미로 알아보는 청렴 스타일 자기발견 테스트",
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
      <body className="min-h-screen bg-[var(--color-bg)] sm:flex sm:items-center sm:justify-center sm:bg-[var(--color-bg-page)]">
        <main className="min-h-screen max-w-md px-5 pb-6 pt-4 sm:my-8 sm:min-h-[700px] sm:w-full sm:rounded-2xl sm:border sm:border-[var(--color-border)] sm:bg-[var(--color-bg)] sm:px-6 sm:pb-8 sm:pt-6 sm:shadow-lg">
          {children}
        </main>
      </body>
    </html>
  );
}
