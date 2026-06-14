"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Aperture, BarChart3, CalendarDays, Database, LayoutDashboard, Scissors, Truck, Users, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/data-management", label: "Data Management", icon: Database },
  { href: "/deliverables", label: "Deliverables", icon: Truck },
  { href: "/editing-tasks", label: "Editing Tasks", icon: Wand2 },
  { href: "/editors", label: "Team", icon: Scissors },
  { href: "/reports", label: "Reports", icon: BarChart3 }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-full flex-col border-r border-line bg-white lg:w-72">
      <div className="flex items-center gap-3 border-b border-line px-5 py-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-soft">
          <Aperture className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Photography</p>
          <h1 className="truncate text-lg font-bold text-ink">Admin Portal</h1>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Workspace</p>
        {nav.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-mist hover:text-ink",
                active && "bg-brand text-white shadow-soft hover:bg-brand hover:text-white"
              )}
            >
              <Icon
                className={cn("h-[18px] w-[18px] text-slate-400 transition group-hover:text-ink", active && "text-white group-hover:text-white")}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl border border-line bg-canvas p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">A</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">Admin</p>
            <p className="truncate text-xs text-muted">Workspace owner</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
