"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, Scissors, Truck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/deliverables", label: "Deliverables", icon: Truck },
  { href: "/editors", label: "Team", icon: Scissors }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-full flex-col border-r border-line bg-white lg:w-72">
      <div className="border-b border-line px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Photography</p>
        <h1 className="mt-1 text-xl font-bold text-ink">Admin Portal</h1>
      </div>
      <nav className="grid gap-1 p-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-mist hover:text-ink",
                active && "bg-brand text-white hover:bg-brand hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-line p-5 text-xs leading-5 text-zinc-500">
        Public admin workspace
      </div>
    </aside>
  );
}
