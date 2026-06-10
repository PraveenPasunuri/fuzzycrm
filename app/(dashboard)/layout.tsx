import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:flex">
      <div className="lg:fixed lg:inset-y-0 lg:left-0 lg:w-72">
        <Sidebar />
      </div>
      <main className="flex-1 p-4 sm:p-6 lg:ml-72 lg:p-8">{children}</main>
    </div>
  );
}
