"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown, Edit, ExternalLink, LayoutGrid, MapPin, MessageCircle, Plus, Search, Table2, Trash2, X } from "lucide-react";
import { deleteRecord, saveEventBatch, saveRecord, updateStatus } from "@/lib/actions";
import { type ModuleConfig } from "@/lib/module-config";
import { cn, currency, prettyDate } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { KanbanBoard } from "@/components/kanban-board";
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

function isShooterOption(option: Record<string, any>) {
  const text = `${option.role ?? ""} ${option.designation ?? ""} ${option.specialty ?? ""}`.toLowerCase();
  if (text.includes("editor")) return false;
  return ["photo", "video", "reel maker", "shooter", "both"].some((term) => text.includes(term));
}

function relationChoices(fieldName: string, options: Record<string, any>[]) {
  if (["photo_shooter_id", "video_shooter_id"].includes(fieldName)) {
    return options.filter(isShooterOption);
  }
  return options;
}

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

function eventDateRange(rows: Record<string, any>[]) {
  const dates = rows.map((row) => String(row.event_date ?? "")).filter(Boolean).sort();
  if (!dates.length) return "No date";
  const first = prettyDate(dates[0]);
  const last = prettyDate(dates[dates.length - 1]);
  return first === last ? first : `${first} - ${last}`;
}

function eventLocationSummary(rows: Record<string, any>[]) {
  const locations = Array.from(new Set(rows.map((row) => String(row.location ?? "").trim()).filter(Boolean)));
  if (locations.length === 0) return "No location";
  if (locations.length === 1) return locations[0];
  return `${locations[0]} +${locations.length - 1}`;
}

export function ModuleManager({ config, rows, relationOptions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") ?? "all";
  const assignmentFilter = searchParams.get("assignment");
  const groupFilter = searchParams.get("group");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [eventDrafts, setEventDrafts] = useState<Record<string, FormDataEntryValue | null>[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const hasBoard = Boolean(config.boardColumns?.length);
  const [view, setView] = useState<"board" | "table">(hasBoard ? "board" : "table");
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
        !row.photo_shooter_id ||
        !row.video_shooter_id;
      return matchesQuery && matchesFilter && matchesGroup && isUnassignedEvent;
    });
  }, [assignmentFilter, config, filter, groupFilter, query, rows]);

  const eventGroups = useMemo(() => {
    if (config.slug !== "events") return [];
    const groups = new Map<string, EventGroup>();
    for (const row of visibleRows) {
      const client = row.clients ?? {};
      const key = String(row.client_id ?? client.id ?? client.host_name ?? row.id);
      const current: EventGroup = groups.get(String(key)) ?? {
        key,
        host: client.host_name ?? "No host",
        phone: client.contact_no ?? "",
        rows: []
      };
      current.rows.push(row);
      groups.set(String(key), current);
    }
    return Array.from(groups.values());
  }, [config.slug, visibleRows]);

  function openCreate() {
    setEditing(null);
    setSelectedClientId("");
    setEventDrafts([]);
    setFormKey((current) => current + 1);
    setOpen(true);
  }

  function openEdit(row: Record<string, any>) {
    setEditing(row);
    setSelectedClientId(String(row.client_id ?? ""));
    setEventDrafts([]);
    setFormKey((current) => current + 1);
    setOpen(true);
  }

  function remove(row: Record<string, any>) {
    if (!window.confirm("Delete this record? This action cannot be undone.")) return;
    startTransition(async () => {
      await deleteRecord(config.slug, row.id);
    });
  }

  function move(row: Record<string, any>, status: string) {
    startTransition(async () => {
      await updateStatus(config.slug, row.id, status);
      router.refresh();
    });
  }

  function selectedClientEventCount() {
    const client = selectedClient();
    return Math.max(Number(client?.no_of_events ?? 1), 1);
  }

  function selectedClient() {
    return (relationOptions.client_id ?? []).find((option) => option.id === selectedClientId);
  }

  function selectedCelebration() {
    return String(selectedClient()?.event_type ?? "");
  }

  function isBatchEventCreate() {
    return config.slug === "events" && !editing?.id && selectedClientEventCount() > 1;
  }

  function handleClientMath(event: React.FormEvent<HTMLFormElement>) {
    if (config.slug !== "clients") return;
    const form = event.currentTarget;
    const quotedHours = Number((form.elements.namedItem("quoted_hours") as HTMLInputElement | null)?.value || 0);
    const quotedPrice = Number((form.elements.namedItem("quoted_price") as HTMLInputElement | null)?.value || 0);
    const advancePaid = Number((form.elements.namedItem("advance_paid") as HTMLInputElement | null)?.value || 0);
    const total = quotedHours * quotedPrice;
    const balance = Math.max(total - advancePaid, 0);
    const totalInput = form.elements.namedItem("total_price") as HTMLInputElement | null;
    const balanceInput = form.elements.namedItem("balance_due") as HTMLInputElement | null;
    if (totalInput) totalInput.value = total ? String(total) : "";
    if (balanceInput) balanceInput.value = total || advancePaid ? String(balance) : "";
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isBatchEventCreate()) return;
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextDraft = Object.fromEntries(formData.entries()) as Record<string, FormDataEntryValue>;
    const drafts = [...eventDrafts, nextDraft];
    const expected = selectedClientEventCount();

    if (drafts.length < expected) {
      setEventDrafts(drafts);
      setEditing({ client_id: selectedClientId, event_name: selectedCelebration(), status: "Booked" });
      setFormKey((current) => current + 1);
      return;
    }

    startTransition(async () => {
      await saveEventBatch(drafts);
      setOpen(false);
      setEditing(null);
      setEventDrafts([]);
      setSelectedClientId("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{config.title}</h1>
          <p className="mt-1 text-sm text-muted">{config.description}</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add {config.title.replace(/s$/, "")}
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-3 shadow-card md:flex-row md:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${config.title.toLowerCase()}...`}
            className="h-10 w-full rounded-lg border border-line bg-canvas pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
          />
        </label>
        {config.filterField && (!hasBoard || view === "table") ? (
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20">
            <option value="all">All statuses</option>
            {filterOptions.map((option) => (
              <option key={String(option)} value={String(option)}>
                {String(option)}
              </option>
            ))}
          </select>
        ) : null}
        {hasBoard ? (
          <div className="flex shrink-0 items-center rounded-lg border border-line bg-canvas p-1">
            <button
              type="button"
              onClick={() => setView("board")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:text-ink",
                view === "board" && "bg-white text-ink shadow-card"
              )}
            >
              <LayoutGrid className="h-4 w-4" /> Board
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:text-ink",
                view === "table" && "bg-white text-ink shadow-card"
              )}
            >
              <Table2 className="h-4 w-4" /> {config.slug === "events" ? "Cards" : "Table"}
            </button>
          </div>
        ) : null}
      </div>

      {hasBoard && view === "board" ? (
        <KanbanBoard config={config} rows={visibleRows} onEdit={openEdit} onDelete={remove} onMove={move} disabled={isPending} />
      ) : visibleRows.length === 0 ? (
        <EmptyState title={`No ${config.title.toLowerCase()} found`} text="Add a new record or adjust the current search and filter." />
      ) : config.slug === "events" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {eventGroups.map((group) => {
            const isExpanded = expandedGroups[group.key] ?? false;
            const celebration = group.rows[0]?.event_name ?? "-";
            return (
              <div key={group.key} className="overflow-hidden rounded-xl border border-line bg-white shadow-card transition hover:shadow-soft">
                <button
                  onClick={() => setExpandedGroups(isExpanded ? {} : { [group.key]: true })}
                  className="block w-full p-4 text-left transition hover:bg-mist/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-ink">{group.host}</h3>
                      <p className="mt-1 truncate text-sm font-semibold text-brand">{celebration}</p>
                      <p className="mt-2 text-sm text-slate-600">{eventDateRange(group.rows)}</p>
                      <p className="mt-2 text-sm font-medium text-slate-700">No of events: {group.rows.length}</p>
                    </div>
                    <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-muted transition ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {isExpanded ? (
                  <div className="grid gap-3 border-t border-line p-3">
                    {group.rows.map((event) => {
                      const title = event.event_type ?? event.event_name ?? "Event";
                      const message = `Hi, confirming assignment for ${title} on ${prettyDate(event.event_date)} at ${event.location ?? "the venue"}. Celebration: ${event.event_name ?? "TBD"}.`;
                      const photoPhone = String(event.photo_shooter?.contact_no ?? "").replace(/\D/g, "");
                      const videoPhone = String(event.video_shooter?.contact_no ?? "").replace(/\D/g, "");
                      const confirmationNumbers = Array.from(new Set([photoPhone, videoPhone].filter(Boolean)));
                      const confirmationLinks = confirmationNumbers.map((phone) => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
                      return (
                        <div key={event.id} className="rounded-lg border border-line bg-mist/50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-ink">{title}</p>
                              <p className="mt-1 flex items-center gap-1 text-sm text-muted"><CalendarDays className="h-4 w-4" />{prettyDate(event.event_date)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {event.status ? <StatusBadge value={String(event.status)} /> : null}
                              <button aria-label="Edit event" title="Edit event" onClick={() => openEdit(event)} className="rounded-md border border-line bg-white p-2 text-slate-600 hover:bg-mist">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button aria-label="Delete event" title="Delete event" disabled={isPending} onClick={() => remove(event)} className="rounded-md border border-line bg-white p-2 text-rose-600 hover:bg-rose-50">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <p className="mt-3 flex items-start gap-1 text-sm text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{event.location ?? "No location"}</p>
                          <div className="mt-3 grid gap-2 text-sm text-slate-600">
                            <p><span className="font-medium text-ink">Photo shooter:</span> {event.photo_shooter?.name ?? "Unassigned"}</p>
                            <p><span className="font-medium text-ink">Video shooter:</span> {event.video_shooter?.name ?? "Unassigned"}</p>
                            <p><span className="font-medium text-ink">Initial hours:</span> {event.total_initial_hours ?? event.total_hours ?? 0}</p>
                            <p><span className="font-medium text-ink">Extra hours:</span> {event.extra_hours ?? 0}</p>
                            <p><span className="font-medium text-ink">Requirement:</span> {event.requirement ?? "-"}</p>
                          </div>
                          {confirmationLinks.length ? (
                            <button
                              type="button"
                              onClick={() => confirmationLinks.forEach((href) => window.open(href, "_blank", "noopener,noreferrer"))}
                              className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                              <MessageCircle className="h-4 w-4" />
                              Send confirmation
                            </button>
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
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-canvas">
                <tr>
                  {config.columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleRows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-mist/50">
                    {config.columns.map((column) => (
                      <td key={column.key} className="max-w-64 truncate px-4 py-3 text-slate-700">
                        {formatCell(row, column)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button aria-label="Edit" title="Edit" onClick={() => openEdit(row)} className="rounded-lg border border-line p-2 text-slate-600 transition hover:bg-mist hover:text-ink">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button aria-label="Delete" title="Delete" disabled={isPending} onClick={() => remove(row)} className="rounded-lg border border-line p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
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
        <div className="fixed inset-0 z-50 grid animate-fade-in place-items-center bg-ink/50 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="max-h-[92vh] w-full max-w-3xl animate-scale-in overflow-y-auto rounded-2xl bg-white shadow-lift"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-6 py-4 backdrop-blur">
              <div>
                <h3 className="text-lg font-semibold text-ink">{editing?.id ? "Edit" : "Add"} {config.title.replace(/s$/, "")}</h3>
                {isBatchEventCreate() ? (
                  <p className="mt-1 text-sm text-muted">
                    Event {eventDrafts.length + 1} of {selectedClientEventCount()} will be saved after all events are entered.
                  </p>
                ) : null}
              </div>
              <button aria-label="Close" title="Close" onClick={() => setOpen(false)} className="rounded-lg p-2 text-muted transition hover:bg-mist hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              key={formKey}
              action={isBatchEventCreate() ? undefined : saveRecord.bind(null, config.slug)}
              onInput={handleClientMath}
              onSubmit={handleFormSubmit}
              className="grid gap-4 p-6 sm:grid-cols-2"
            >
              <input type="hidden" name="id" value={editing?.id ?? ""} />
              {config.fields.map((field) => {
                const isEventCelebrationCreate = config.slug === "events" && field.name === "event_name" && !editing?.id;
                const value = isEventCelebrationCreate ? selectedCelebration() : editing?.[field.name] ?? "";
                const datalistId = `${config.slug}-${field.name}-suggestions`;
                const common = "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
                const isClientNumberOnCreate = config.slug === "clients" && field.name === "client_number" && !editing?.[field.name];
                return (
                  <label key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <span className="text-sm font-medium text-slate-700">{field.label}{field.required ? <span className="text-coral"> *</span> : ""}</span>
                    {isEventCelebrationCreate ? (
                      <>
                        <input type="hidden" name={field.name} value={value} />
                        <input
                          value={value}
                          readOnly
                          disabled
                          className={`${common} bg-mist text-zinc-500`}
                          placeholder="Select client first"
                        />
                      </>
                    ) : field.type === "textarea" ? (
                      <textarea name={field.name} defaultValue={value} required={field.required} rows={4} className={common} placeholder={field.placeholder} />
                    ) : field.type === "select" ? (
                      <select
                        name={field.name}
                        defaultValue={value}
                        required={field.required}
                        onChange={field.name === "client_id" ? (event) => setSelectedClientId(event.target.value) : undefined}
                        className={common}
                      >
                        <option value="">Select</option>
                        {field.relation
                          ? relationChoices(field.name, relationOptions[field.relation] ?? []).map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name ?? option.host_name ?? option.event_name}
                              </option>
                            ))
                          : field.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                      </select>
                    ) : (
                      <>
                        <input
                          name={isClientNumberOnCreate ? undefined : field.name}
                          defaultValue={value}
                          required={field.required}
                          type={field.type}
                          step={field.type === "number" ? "0.01" : undefined}
                          className={`${common} ${field.readOnly ? "bg-mist text-zinc-500" : ""}`}
                          placeholder={field.placeholder}
                          readOnly={field.readOnly}
                          disabled={isClientNumberOnCreate}
                          list={field.suggestions ? datalistId : undefined}
                        />
                        {field.suggestions ? (
                          <datalist id={datalistId}>
                            {field.suggestions.map((suggestion) => (
                              <option key={suggestion} value={suggestion} />
                            ))}
                          </datalist>
                        ) : null}
                      </>
                    )}
                  </label>
                );
              })}
              <div className="flex justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-mist">
                  Cancel
                </button>
                <button disabled={isPending} className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60">
                  {isBatchEventCreate() && eventDrafts.length + 1 < selectedClientEventCount() ? "Next event" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
