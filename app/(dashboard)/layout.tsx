import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <div className="lg:fixed lg:inset-y-0 lg:left-0 lg:w-72">
        <Sidebar />
      </div>
      <div className="flex min-h-screen flex-1 flex-col lg:ml-72">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
