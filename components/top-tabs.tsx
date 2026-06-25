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

export function TopTabs() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-16 z-20 border-b border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex w-full gap-2 overflow-x-auto py-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-brand text-white shadow-soft"
                    : "text-slate-600 hover:bg-mist hover:text-ink"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-400")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
