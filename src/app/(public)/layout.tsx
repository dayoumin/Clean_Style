export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] sm:flex sm:items-center sm:justify-center sm:bg-[var(--color-bg-page)]">
      <main className="min-h-screen max-w-md px-6 pb-6 pt-4 sm:my-8 sm:min-h-[700px] sm:w-full sm:rounded-2xl sm:border sm:border-[var(--color-border)] sm:bg-[var(--color-bg)] sm:px-8 sm:pb-8 sm:pt-6 sm:shadow-lg">
        {children}
      </main>
    </div>
  );
}
