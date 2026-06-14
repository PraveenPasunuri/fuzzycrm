"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/clients": "Clients",
  "/events": "Events",
  "/data-management": "Data Management",
  "/deliverables": "Deliverables",
  "/editing-tasks": "Editing Tasks",
  "/editors": "Team",
  "/reports": "Reports"
};

function currentTitle(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  const match = Object.keys(titles).find((href) => href !== "/" && pathname.startsWith(href));
  return match ? titles[match] : "Admin Portal";
}

export function Topbar() {
  const pathname = usePathname();
  const title = currentTitle(pathname);
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-white/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-baseline gap-3">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <span className="hidden text-sm text-muted sm:inline">·</span>
        <span className="hidden text-sm text-muted sm:inline">{today}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-muted md:flex">
          <Search className="h-4 w-4" />
          <span className="text-xs">Use the search on each board</span>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-bold text-white">A</div>
      </div>
    </header>
  );
}
