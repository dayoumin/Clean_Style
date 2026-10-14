import Link from "next/link";
import PublicLayout from "./(public)/layout";

// 루트 not-found는 (public) 레이아웃 밖에서 렌더링되므로, 같은 틀로 감싸 제품 테마를 따르게 한다.
export default function NotFound() {
  return (
    <PublicLayout>
      <div className="flex flex-1 flex-col items-center justify-center px-2 py-16 text-center">
        <p className="mb-2 text-[44px] font-extrabold leading-none tracking-tight text-[var(--color-primary)]">
          404
        </p>
        <h1 className="mb-2 text-[20px] font-bold text-[var(--color-text)]">
          페이지를 찾을 수 없어요
        </h1>
        <p className="mb-8 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          요청하신 페이지가 존재하지 않거나 이동되었어요.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 text-[15px] font-bold text-white hover:bg-[var(--color-primary-hover)]"
        >
          처음으로
        </Link>
      </div>
    </PublicLayout>
  );
}
