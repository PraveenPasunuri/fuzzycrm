"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown, Edit, ExternalLink, MapPin, MessageCircle, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import { deleteRecord, saveRecord } from "@/lib/actions";
import { type ModuleConfig } from "@/lib/module-config";
import { currency, prettyDate } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";

type Props = {
  config: ModuleConfig;
  rows: Record<string, any>[];
  relationOptions: Record<string, Record<string, any>[]>;
};

type EventGroup = {
  key: string;
  host: string;
  phone: string;
  rows: Record<string, any>[];
};

function getValue(row: Record<string, any>, key: string): unknown {
  return key.split(".").reduce<unknown>((value, part) => {
    if (value && typeof value === "object") {
      return (value as Record<string, unknown>)[part];
    }
    return undefined;
  }, row);
}

function formatCell(row: Record<string, any>, column: ModuleConfig["columns"][number]) {
  const value = getValue(row, column.key);
  if (column.type === "currency") return currency(typeof value === "number" || typeof value === "string" ? value : null);
  if (column.type === "date") return prettyDate(String(value ?? ""));
  if (column.type === "status" && value) return <StatusBadge value={String(value)} />;
  if (String(value ?? "").startsWith("http")) {
    return (
      <a className="inline-flex items-center gap-1 text-brand hover:underline" href={String(value)} target="_blank" rel="noreferrer">
        Open <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  return value ? String(value) : "-";
}

export function ModuleManager({ config, rows, relationOptions }: Props) {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") ?? "all";
  const assignmentFilter = searchParams.get("assignment");
  const groupFilter = searchParams.get("group");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const filterOptions = useMemo(() => {
    if (!config.filterField) return [];
    return Array.from(new Set(rows.map((row) => row[config.filterField!]).filter(Boolean)));
  }, [config.filterField, rows]);

  const visibleRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        !normalized ||
        config.searchFields.some((field) => String(getValue(row, field) ?? "").toLowerCase().includes(normalized));
      const matchesFilter = filter === "all" || row[config.filterField ?? ""] === filter;
      const matchesGroup =
        groupFilter !== "pending" ||
        config.slug !== "clients" ||
        ["Inquiry", "Pending", "Waiting For Event Date"].includes(String(row.status ?? ""));
      const isUnassignedEvent =
        config.slug !== "events" ||
        assignmentFilter !== "unassigned" ||
        !row.photo_shooter_assigned ||
        !row.video_shooter_assigned;
      return matchesQuery && matchesFilter && matchesGroup && isUnassignedEvent;
    });
  }, [assignmentFilter, config, filter, groupFilter, query, rows]);

  const eventGroups = useMemo(() => {
    if (config.slug !== "events") return [];
    const groups = new Map<string, EventGroup>();
    for (const row of visibleRows) {
      const client = row.clients ?? {};
      const key = row.client_id ?? client.name ?? row.id;
      const current: EventGroup = groups.get(String(key)) ?? {
        key: String(key),
        host: client.name ?? "No host",
        phone: client.phone ?? "",
        rows: []
      };
      current.rows.push(row);
      groups.set(String(key), current);
    }
    return Array.from(groups.values());
  }, [config.slug, visibleRows]);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(row: Record<string, any>) {
    setEditing(row);
    setOpen(true);
  }

  function remove(row: Record<string, any>) {
    if (!window.confirm("Delete this record? This action cannot be undone.")) return;
    startTransition(async () => {
      await deleteRecord(config.slug, row.id);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold text-ink">{config.title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{config.description}</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#176274]">
          <Plus className="h-4 w-4" />
          Add {config.title.replace(/s$/, "")}
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-line bg-white p-3 shadow-soft md:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${config.title.toLowerCase()}`}
            className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </label>
        {config.filterField ? (
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand">
            <option value="all">All statuses</option>
            {filterOptions.map((option) => (
              <option key={String(option)} value={String(option)}>
                {String(option)}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {visibleRows.length === 0 ? (
        <EmptyState title={`No ${config.title.toLowerCase()} found`} text="Add a new record or adjust the current search and filter." />
      ) : config.slug === "events" ? (
        <div className="grid gap-4">
          {eventGroups.map((group) => {
            const isExpanded = expandedGroups[group.key] ?? group.rows.length === 1;
            const primary = group.rows[0];
            return (
              <div key={group.key} className="rounded-lg border border-line bg-white p-4 shadow-soft">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <UserRound className="h-4 w-4" />
                      Host Name
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-ink">{group.host}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{group.rows.length} event{group.rows.length === 1 ? "" : "s"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.rows.length > 1 ? (
                      <button
                        onClick={() => setExpandedGroups((current) => ({ ...current, [group.key]: !isExpanded }))}
                        className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-mist"
                      >
                        <ChevronDown className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`} />
                        {isExpanded ? "Collapse" : "Expand"}
                      </button>
                    ) : null}
                    <button aria-label="Edit" title="Edit" onClick={() => openEdit(primary)} className="rounded-md border border-line p-2 text-zinc-600 hover:bg-mist">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button aria-label="Delete" title="Delete" disabled={isPending} onClick={() => remove(primary)} className="rounded-md border border-line p-2 text-rose-600 hover:bg-rose-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {isExpanded ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {group.rows.map((event) => {
                      const message = `Hi, confirming assignment for ${event.event_name ?? "event"} on ${prettyDate(event.event_date)} at ${event.location ?? "the venue"}. Photo shooter: ${event.photo_shooter_assigned ?? "TBD"}. Video shooter: ${event.video_shooter_assigned ?? "TBD"}.`;
                      const phone = String(group.phone ?? "").replace(/\D/g, "");
                      const whatsappHref = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
                      return (
                        <div key={event.id} className="rounded-lg border border-line bg-mist/50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-ink">{event.event_name}</p>
                              <p className="mt-1 flex items-center gap-1 text-sm text-zinc-500"><CalendarDays className="h-4 w-4" />{prettyDate(event.event_date)}</p>
                            </div>
                            {event.status ? <StatusBadge value={String(event.status)} /> : null}
                          </div>
                          <p className="mt-3 flex items-start gap-1 text-sm text-zinc-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{event.location ?? "No location"}</p>
                          <div className="mt-3 grid gap-2 text-sm text-zinc-600">
                            <p><span className="font-medium text-ink">Photo shooter:</span> {event.photo_shooter_assigned ?? "Unassigned"}</p>
                            <p><span className="font-medium text-ink">Video shooter:</span> {event.video_shooter_assigned ?? "Unassigned"}</p>
                            <p><span className="font-medium text-ink">Requirement:</span> {event.requirement ?? "-"}</p>
                          </div>
                          {event.photo_shooter_assigned || event.video_shooter_assigned ? (
                            <a href={whatsappHref} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                              <MessageCircle className="h-4 w-4" />
                              Send confirmation
                            </a>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-mist">
                <tr>
                  {config.columns.map((column) => (
                    <th key={column.key} className="px-4 py-3 text-left font-semibold text-zinc-600">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-semibold text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleRows.map((row) => (
                  <tr key={row.id} className="hover:bg-mist/60">
                    {config.columns.map((column) => (
                      <td key={column.key} className="max-w-64 truncate px-4 py-3 text-zinc-700">
                        {formatCell(row, column)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button aria-label="Edit" title="Edit" onClick={() => openEdit(row)} className="rounded-md border border-line p-2 text-zinc-600 hover:bg-mist">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button aria-label="Delete" title="Delete" disabled={isPending} onClick={() => remove(row)} className="rounded-md border border-line p-2 text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="text-lg font-semibold text-ink">{editing ? "Edit" : "Add"} {config.title.replace(/s$/, "")}</h3>
              <button aria-label="Close" title="Close" onClick={() => setOpen(false)} className="rounded-md p-2 text-zinc-500 hover:bg-mist">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form action={saveRecord.bind(null, config.slug)} className="grid gap-4 p-5 sm:grid-cols-2">
              <input type="hidden" name="id" value={editing?.id ?? ""} />
              {config.fields.map((field) => {
                const value = editing?.[field.name] ?? "";
                const common = "mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";
                return (
                  <label key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <span className="text-sm font-medium text-zinc-700">{field.label}{field.required ? " *" : ""}</span>
                    {field.type === "textarea" ? (
                      <textarea name={field.name} defaultValue={value} required={field.required} rows={4} className={common} placeholder={field.placeholder} />
                    ) : field.type === "select" ? (
                      <select name={field.name} defaultValue={value} required={field.required} className={common}>
                        <option value="">Select</option>
                        {field.relation
                          ? (relationOptions[field.relation] ?? []).map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name ?? option.event_name}
                              </option>
                            ))
                          : field.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                      </select>
                    ) : (
                      <input name={field.name} defaultValue={value} required={field.required} type={field.type} step={field.type === "number" ? "0.01" : undefined} className={common} placeholder={field.placeholder} />
                    )}
                  </label>
                );
              })}
              <div className="flex justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-mist">
                  Cancel
                </button>
                <button className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-[#176274]">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
