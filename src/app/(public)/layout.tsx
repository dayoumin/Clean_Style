export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[var(--color-bg)] sm:flex sm:justify-center sm:bg-[var(--color-bg-page)] sm:px-4 sm:py-8">
      <main className="flex min-h-dvh w-full flex-col px-6 pb-6 pt-4 sm:h-[min(700px,calc(100dvh-4rem))] sm:min-h-0 sm:max-w-md sm:overflow-y-auto sm:rounded-2xl sm:border sm:border-[var(--color-border)] sm:bg-[var(--color-bg)] sm:px-8 sm:pb-8 sm:pt-6 sm:shadow-lg">
        {children}
      </main>
    </div>
  );
}
