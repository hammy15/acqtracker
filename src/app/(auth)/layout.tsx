export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-100 dark:bg-surface-950 flex items-center justify-center px-4">
      {children}
    </div>
  );
}
