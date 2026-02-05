import { TopNavbar } from "@/components/layout/TopNavbar";
import { SplashScreen } from "@/components/layout/SplashScreen";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SplashScreen />
      <TopNavbar />
      <main className="mx-auto max-w-[1800px] px-4 py-6 lg:px-6">
        {children}
      </main>
    </div>
  );
}
