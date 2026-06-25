"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown, Edit, ExternalLink, FileText, LayoutGrid, Mail, MapPin, MessageCircle, Plus, Printer, Search, Table2, Trash2, X } from "lucide-react";
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
  demoMode?: boolean;
};

type EventGroup = {
  key: string;
  host: string;
  phone: string;
  rows: Record<string, any>[];
};

type QuoteEvent = {
  id: string;
  name: string;
  date: string;
  hours: string;
};

const quoteDraftStatuses = new Set(["Inquiry", "Enquiry", "Pending"]);
const quoteSuggestionKey = "fuzzycrm:quote-suggestion";

function demoStorageKey(slug: string) {
  return `fuzzycrm:demo:${slug}`;
}

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

function fullDate(value: string | null | undefined) {
  if (!value) return "-";
  const trimmed = value.trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? new Date(`${trimmed}T00:00:00`) : new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "2-digit", year: "numeric" }).format(date);
}

function quoteCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function canGenerateQuotation(row: Record<string, any>) {
  return quoteDraftStatuses.has(String(row.status ?? ""));
}

function clientStatusClass(row: Record<string, any>) {
  const status = String(row.status ?? "");
  if (status === "Inquiry" || status === "Enquiry") return "bg-yellow-300 text-yellow-950 ring-yellow-200";
  if (status === "Quotation Sent") return "bg-orange-300 text-orange-950 ring-orange-200";
  if (status === "Confirmed") return "bg-green-300 text-green-950 ring-green-200";
  if (status === "Waiting For Event Date") return "bg-white text-slate-700 ring-line";
  if (status === "Completed") return "bg-red-300 text-red-950 ring-red-200";
  if (status === "Cancelled") return "bg-gray-500 text-gray-950 ring-gray-200";
  return "bg-white text-slate-700 ring-line";
}

function minimumQuoteHours(value: string | number | null | undefined) {
  const hours = Number(value ?? 0);
  if (!hours) return "2";
  return String(Math.max(hours, 2));
}

export function ModuleManager({ config, rows, relationOptions, demoMode = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") ?? "all";
  const assignmentFilter = searchParams.get("assignment");
  const groupFilter = searchParams.get("group");
  const [query, setQuery] = useState("");
  const [localRows, setLocalRows] = useState<Record<string, any>[]>(rows);
  const [filter, setFilter] = useState(initialFilter);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteContact, setInviteContact] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [eventDrafts, setEventDrafts] = useState<Record<string, FormDataEntryValue | null>[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteRow, setQuoteRow] = useState<Record<string, any> | null>(null);
  const [quoteClientName, setQuoteClientName] = useState("");
  const [quoteEvents, setQuoteEvents] = useState<QuoteEvent[]>([]);
  const [quoteRate, setQuoteRate] = useState("");
  const [quoteAdvance, setQuoteAdvance] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const hasBoard = Boolean(config.boardColumns?.length);
  const [view, setView] = useState<"board" | "table">(hasBoard ? "board" : "table");
  const [isPending, startTransition] = useTransition();
  const statusOptions = useMemo(
    () => config.fields.find((field) => field.name === config.statusField)?.options ?? [],
    [config.fields, config.statusField]
  );

  useEffect(() => {
    if (!demoMode || typeof window === "undefined") {
      setLocalRows(rows);
      return;
    }

    const stored = window.localStorage.getItem(demoStorageKey(config.slug));
    if (stored) {
      try {
        setLocalRows(JSON.parse(stored) as Record<string, any>[]);
        return;
      } catch {
        window.localStorage.removeItem(demoStorageKey(config.slug));
      }
    }

    setLocalRows(rows);
    window.localStorage.setItem(demoStorageKey(config.slug), JSON.stringify(rows));
  }, [config.slug, demoMode, rows]);

  function persistLocalRows(nextRows: Record<string, any>[]) {
    setLocalRows(nextRows);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(demoStorageKey(config.slug), JSON.stringify(nextRows));
    }
  }

  function hydrateRelations(row: Record<string, any>) {
    if (!config.relations) return row;
    const hydrated = { ...row };
    for (const [field, relation] of Object.entries(config.relations)) {
      const alias = relation.alias ?? relation.table;
      hydrated[alias] = (relationOptions[field] ?? []).find((option) => option.id === row[field]) ?? row[alias] ?? null;
    }
    return hydrated;
  }

  const storedRows = demoMode ? localRows.map(hydrateRelations) : rows;

  const filterOptions = useMemo(() => {
    if (!config.filterField) return [];
    return Array.from(new Set(storedRows.map((row) => row[config.filterField!]).filter(Boolean)));
  }, [config.filterField, storedRows]);

  const visibleRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return storedRows.filter((row) => {
      const matchesQuery =
        !normalized ||
        config.searchFields.some((field) => String(getValue(row, field) ?? "").toLowerCase().includes(normalized));
      const matchesFilter = filter === "all" || row[config.filterField ?? ""] === filter;
      const matchesGroup =
        groupFilter !== "pending" ||
        config.slug !== "clients" ||
        ["Inquiry", "Waiting For Event Date"].includes(String(row.status ?? ""));
      const isUnassignedEvent =
        config.slug !== "events" ||
        assignmentFilter !== "unassigned" ||
        !row.photo_shooter_id ||
        !row.video_shooter_id;
      return matchesQuery && matchesFilter && matchesGroup && isUnassignedEvent;
    });
  }, [assignmentFilter, config, filter, groupFilter, query, storedRows]);

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

  function resetDemoData() {
    if (!window.confirm(`Reset ${config.title.toLowerCase()} demo data in this browser?`)) return;
    window.localStorage.removeItem(demoStorageKey(config.slug));
    setLocalRows(rows);
  }

  function openEdit(row: Record<string, any>) {
    setEditing(row);
    setSelectedClientId(String(row.client_id ?? ""));
    setEventDrafts([]);
    setFormKey((current) => current + 1);
    setOpen(true);
  }

  const openQuote = useCallback((row: Record<string, any>) => {
    const hours = minimumQuoteHours(row.quoted_hours);
    setQuoteRow(row);
    setQuoteClientName(String(row.host_name ?? ""));
    setQuoteEvents([
      {
        id: crypto.randomUUID(),
        name: String(row.event_type ?? "Wedding"),
        date: String(row.event_date ?? ""),
        hours
      }
    ]);
    setQuoteRate(row.quoted_price ? String(row.quoted_price) : "");
    setQuoteAdvance(row.advance_paid ? String(row.advance_paid) : "");
    setQuoteNotes(String(row.notes ?? ""));
    setQuoteOpen(true);
  }, []);

  useEffect(() => {
    if (config.slug !== "clients" || typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(quoteSuggestionKey);
    if (!raw) return;

    try {
      const suggestion = JSON.parse(raw) as { createdAt?: number; id?: string; host?: string; contact?: string; eventDate?: string };
      if (!suggestion.createdAt || Date.now() - suggestion.createdAt > 60000) {
        window.sessionStorage.removeItem(quoteSuggestionKey);
        return;
      }

      const row = storedRows.find((client) => {
        if (suggestion.id && client.id === suggestion.id) return true;
        const hostMatches = suggestion.host && String(client.host_name ?? "") === suggestion.host;
        const contactMatches = suggestion.contact && String(client.contact_no ?? "") === suggestion.contact;
        const dateMatches = !suggestion.eventDate || String(client.event_date ?? "") === suggestion.eventDate;
        return Boolean(hostMatches && dateMatches && (!suggestion.contact || contactMatches));
      });

      if (row && canGenerateQuotation(row)) {
        window.sessionStorage.removeItem(quoteSuggestionKey);
        openQuote(row);
      }
    } catch {
      window.sessionStorage.removeItem(quoteSuggestionKey);
    }
  }, [config.slug, openQuote, storedRows]);

  function updateQuoteEvent(id: string, patch: Partial<QuoteEvent>) {
    setQuoteEvents((current) => current.map((event) => (event.id === id ? { ...event, ...patch } : event)));
  }

  function addQuoteEvent() {
    setQuoteEvents((current) => [...current, { id: crypto.randomUUID(), name: "", date: "", hours: "2" }]);
  }

  function removeQuoteEvent(id: string) {
    setQuoteEvents((current) => (current.length > 1 ? current.filter((event) => event.id !== id) : current));
  }

  function payloadFromForm(formData: FormData) {
    const payload: Record<string, any> = {};
    for (const field of config.fields) {
      const raw = formData.get(field.name);
      const value = raw === null || String(raw).trim() === "" ? null : String(raw).trim();
      payload[field.name] = field.type === "number" && value !== null ? Number(value) : value;
    }

    if (config.slug === "clients") {
      const quotedHours = Number(payload.quoted_hours ?? 0);
      const quotedPrice = Number(payload.quoted_price ?? 0);
      const total = Number(payload.total_price ?? quotedHours * quotedPrice);
      const advance = Number(payload.advance_paid ?? 0);
      payload.total_price = total;
      payload.balance_due = Math.max(total - advance, 0);
    }

    if (config.slug === "events") {
      const initial = Number(payload.total_initial_hours ?? 0);
      const extra = Number(payload.extra_hours ?? 0);
      payload.total_hours = initial + extra;
      if (!payload.event_name && payload.client_id) {
        payload.event_name = relationOptions.client_id?.find((client) => client.id === payload.client_id)?.event_type ?? "Untitled celebration";
      }
    }

    return payload;
  }

  function saveLocalRecord(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    const now = new Date().toISOString();
    const payload = payloadFromForm(formData);
    let nextRows: Record<string, any>[];

    if (id) {
      nextRows = localRows.map((row) => (row.id === id ? { ...row, ...payload, updated_at: now } : row));
    } else {
      if (config.slug === "clients" && !payload.client_number) {
        const maxClientNumber = localRows.reduce((max, row) => Math.max(max, Number(row.client_number ?? 0)), 1000);
        payload.client_number = maxClientNumber + 1;
      }
      nextRows = [{ id: crypto.randomUUID(), ...payload, created_at: now, updated_at: now }, ...localRows];
    }

    persistLocalRows(nextRows);
  }

  function saveLocalBatch(records: Record<string, FormDataEntryValue | null>[]) {
    const now = new Date().toISOString();
    const nextRows = records.map((record) => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(record)) {
        if (value !== null) formData.set(key, value);
      }
      return { id: crypto.randomUUID(), ...payloadFromForm(formData), created_at: now, updated_at: now };
    });
    persistLocalRows([...nextRows, ...localRows]);
  }

  function remove(row: Record<string, any>) {
    if (!window.confirm("Delete this record? This action cannot be undone.")) return;
    if (demoMode) {
      persistLocalRows(localRows.filter((current) => current.id !== row.id));
      return;
    }
    startTransition(async () => {
      await deleteRecord(config.slug, row.id);
    });
  }

  function move(row: Record<string, any>, status: string) {
    if (demoMode && config.statusField) {
      const now = new Date().toISOString();
      persistLocalRows(localRows.map((current) => (current.id === row.id ? { ...current, [config.statusField!]: status, updated_at: now } : current)));
      return;
    }
    startTransition(async () => {
      await updateStatus(config.slug, row.id, status);
      router.refresh();
    });
  }

  function changeRowStatus(row: Record<string, any>, status: string) {
    if (!status || !config.statusField) return;
    if (demoMode) {
      const now = new Date().toISOString();
      persistLocalRows(localRows.map((current) => (current.id === row.id ? { ...current, [config.statusField!]: status, updated_at: now } : current)));
      return;
    }
    startTransition(async () => {
      await updateStatus(config.slug, row.id, status);
      router.refresh();
    });
  }

  function renderTableCell(row: Record<string, any>, column: ModuleConfig["columns"][number]) {
    if (config.slug === "clients" && column.key === "status" && statusOptions.length) {
      return (
        <select
          aria-label={`Change status for ${row.host_name ?? row.client_number ?? "client"}`}
          defaultValue={String(row.status ?? "")}
          disabled={isPending}
          onChange={(event) => changeRowStatus(row, event.target.value)}
          className={cn(
            "w-full min-w-36 rounded-lg border border-transparent px-2.5 py-1.5 text-sm font-semibold outline-none ring-1 transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60",
            clientStatusClass(row)
          )}
        >
          <option value="">Select status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      );
    }
    return formatCell(row, column);
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
    if (demoMode && !isBatchEventCreate()) {
      event.preventDefault();
      saveLocalRecord(new FormData(event.currentTarget));
      setOpen(false);
      setEditing(null);
      setSelectedClientId("");
      setEventDrafts([]);
      return;
    }

    if (!isBatchEventCreate()) {
      if (config.slug === "clients" && typeof window !== "undefined") {
        const form = event.currentTarget;
        const status = String((form.elements.namedItem("status") as HTMLSelectElement | null)?.value || "");
        if (status === "Inquiry") {
          window.sessionStorage.setItem(
            quoteSuggestionKey,
            JSON.stringify({
              createdAt: Date.now(),
              id: String((form.elements.namedItem("id") as HTMLInputElement | null)?.value || ""),
              host: String((form.elements.namedItem("host_name") as HTMLInputElement | null)?.value || ""),
              contact: String((form.elements.namedItem("contact_no") as HTMLInputElement | null)?.value || ""),
              eventDate: String((form.elements.namedItem("event_date") as HTMLInputElement | null)?.value || "")
            })
          );
        } else {
          window.sessionStorage.removeItem(quoteSuggestionKey);
        }
      }
      return;
    }
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
      if (demoMode) {
        saveLocalBatch(drafts);
        setOpen(false);
        setEditing(null);
        setEventDrafts([]);
        setSelectedClientId("");
        return;
      }
      await saveEventBatch(drafts);
      setOpen(false);
      setEditing(null);
      setEventDrafts([]);
      setSelectedClientId("");
      router.refresh();
    });
  }

  const quoteHours = useMemo(
    () => quoteEvents.reduce((sum, event) => sum + Math.max(Number(event.hours || 0), 2), 0),
    [quoteEvents]
  );
  const quoteTotal = quoteHours * Number(quoteRate || 0);
  const quoteBalance = Math.max(quoteTotal - Number(quoteAdvance || 0), 0);
  const quoteEventSummary = quoteEvents
    .filter((event) => event.name || event.date || event.hours)
    .map((event) => `${event.name || "Event"} - ${event.date ? fullDate(event.date) : "Date TBD"} - ${event.hours || 0} hours`)
    .join("\n");
  const quoteMessage = quoteRow
    ? `Quotation for ${quoteClientName || quoteRow.host_name || "Client"}\n\n${quoteEventSummary}\n\nFor all your events, our charges are: ${quoteCurrency(quoteTotal)}\nAdvance: ${quoteCurrency(Number(quoteAdvance || 0))}\nBalance: ${quoteCurrency(quoteBalance)}${quoteNotes ? `\n\nNotes: ${quoteNotes}` : ""}`
    : "";
  const isQuoteViewMode = Boolean(quoteRow && !canGenerateQuotation(quoteRow));
  const quoteActionLabel = isQuoteViewMode ? "View Quotation" : "Generate Quotation";

  function quoteDocumentFilename() {
    const client = String(quoteClientName || quoteRow?.host_name || "Client")
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "");
    return `${client || "Client"}-Wedding-Photography-Quotation.doc`;
  }

  function quoteDocumentHtml() {
    const quoteDocument = document.querySelector(".quote-print-area");
    if (!quoteDocument) throw new Error("Quotation preview is not available");
    const css = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((rule) => rule.cssText).join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Wedding Photography Quotation</title>
    <style>
      body { margin: 0; background: #ffffff; }
      ${css}
      .quote-print-area { position: static !important; width: 794px; margin: 0 auto; box-shadow: none !important; }
    </style>
  </head>
  <body>${quoteDocument.outerHTML}</body>
</html>`;
  }

  function quoteDocumentFile() {
    return new File([quoteDocumentHtml()], quoteDocumentFilename(), { type: "application/msword" });
  }

  function downloadQuoteDocument(file = quoteDocumentFile()) {
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function shareQuoteDocument() {
    const file = quoteDocumentFile();
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
      share?: (data: ShareData) => Promise<void>;
    };
    const shareData: ShareData = {
      title: "Wedding Photography Quotation",
      text: quoteMessage,
      files: [file]
    };

    if (nav.share && (!nav.canShare || nav.canShare(shareData))) {
      await nav.share(shareData);
      return true;
    }

    downloadQuoteDocument(file);
    return false;
  }

  async function sendQuoteDocumentViaWhatsApp() {
    if (!quoteRow) throw new Error("No quotation is selected");
    const file = quoteDocumentFile();
    const payload = new FormData();
    payload.set("phone", String(quoteRow.contact_no ?? ""));
    payload.set("message", quoteMessage);
    payload.set("filename", file.name);
    payload.set("document", file, file.name);

    const response = await fetch("/api/whatsapp/send-quotation", {
      method: "POST",
      body: payload
    });
    const result = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      throw new Error(result.error || "Unable to send quotation through WhatsApp API");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{config.title}</h1>
          <p className="mt-1 text-sm text-muted">{config.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {config.slug === "clients" ? (
            <button
              onClick={() => setInviteOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-mist"
            >
              Invite
            </button>
          ) : null}
          <button
            onClick={openCreate}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add {config.title.replace(/s$/, "")}
          </button>
        </div>
      </div>

      {demoMode ? (
        <div className="flex flex-col justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center">
          <span>Demo mode: changes are saved in this browser only.</span>
          <button type="button" onClick={resetDemoData} className="self-start rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 sm:self-auto">
            Reset demo data
          </button>
        </div>
      ) : null}

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
                        {renderTableCell(row, column)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button aria-label="Edit" title="Edit" onClick={() => openEdit(row)} className="rounded-lg border border-line p-2 text-slate-600 transition hover:bg-mist hover:text-ink">
                          <Edit className="h-4 w-4" />
                        </button>
                        {config.slug === "clients" ? (
                          canGenerateQuotation(row) ? (
                            <button
                              aria-label="Build Quote"
                              title="Build Quote"
                              onClick={() => openQuote(row)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-mist hover:text-ink"
                            >
                              <FileText className="h-4 w-4" />
                              Build Quote
                            </button>
                          ) : (
                            <button
                              aria-label="Peek Quote"
                              title="Peek quote"
                              onClick={() => openQuote(row)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-mist hover:text-ink"
                            >
                              <FileText className="h-4 w-4" />
                              Peek Quote
                            </button>
                          )
                        ) : null}
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
              action={demoMode || isBatchEventCreate() ? undefined : saveRecord.bind(null, config.slug)}
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

      {quoteOpen && quoteRow ? (
        <div className="fixed inset-0 z-50 grid animate-fade-in place-items-center bg-ink/50 p-4 backdrop-blur-sm" onClick={() => setQuoteOpen(false)}>
          <div
            className={cn(
              "max-h-[94vh] w-full animate-scale-in overflow-hidden rounded-2xl bg-white shadow-lift",
              isQuoteViewMode ? "max-w-4xl" : "max-w-6xl"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="quote-modal-header flex items-center justify-between border-b border-line px-6 py-4">
              <h3 className="text-lg font-semibold text-ink">{quoteActionLabel} — {quoteClientName || quoteRow.host_name || quoteRow.client_number}</h3>
              <button aria-label="Close" title="Close" onClick={() => setQuoteOpen(false)} className="rounded-lg p-2 text-muted transition hover:bg-mist hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div
              className={cn(
                "grid max-h-[calc(94vh-73px)] gap-6 overflow-y-auto p-6",
                isQuoteViewMode ? "justify-items-center" : "lg:grid-cols-[380px_1fr]"
              )}
            >
              {!isQuoteViewMode ? (
                <div className="quote-controls grid content-start gap-4">
                  <label>
                    <span className="text-sm font-medium text-slate-700">Client name</span>
                    <input value={quoteClientName} onChange={(event) => setQuoteClientName(event.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                  </label>
                  <div className="grid gap-3 rounded-lg border border-line p-3">
                    <span className="text-sm font-semibold text-ink">Event details</span>
                    {quoteEvents.map((event, index) => (
                      <div key={event.id} className="grid gap-2 rounded-md bg-canvas p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase text-muted">Event {index + 1}</span>
                          <button type="button" aria-label="Remove event" title="Remove event" onClick={() => removeQuoteEvent(event.id)} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <input value={event.name} onChange={(change) => updateQuoteEvent(event.id, { name: change.target.value })} placeholder="Haldi, Wedding, Reception..." className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand" />
                        <div className="grid grid-cols-[1fr_88px] gap-2">
                          <input type="date" value={event.date} onChange={(change) => updateQuoteEvent(event.id, { date: change.target.value })} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand" />
                          <input
                            type="number"
                            min="2"
                            step="0.5"
                            value={event.hours}
                            onChange={(change) => {
                              const value = change.target.value;
                              updateQuoteEvent(event.id, { hours: value && Number(value) < 2 ? "2" : value });
                            }}
                            onBlur={(change) => updateQuoteEvent(event.id, { hours: minimumQuoteHours(change.target.value) })}
                            placeholder="Hours"
                            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                          />
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addQuoteEvent} className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-mist">
                      <Plus className="h-4 w-4" /> Add Event
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label>
                      <span className="text-sm font-medium text-slate-700">Rate per hour</span>
                      <input type="number" min="0" step="0.01" value={quoteRate} onChange={(event) => setQuoteRate(event.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                    </label>
                    <label>
                      <span className="text-sm font-medium text-slate-700">Advance</span>
                      <input type="number" min="0" step="0.01" value={quoteAdvance} onChange={(event) => setQuoteAdvance(event.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                    </label>
                  </div>
                  <div className="rounded-lg border border-line bg-mist/40 p-3 text-sm text-slate-700">
                    <p className="flex justify-between"><span>Total hours</span><strong>{quoteHours}</strong></p>
                    <p className="mt-1 flex justify-between"><span>Total quote</span><strong>{quoteCurrency(quoteTotal)}</strong></p>
                    <p className="mt-1 flex justify-between"><span>Balance after advance</span><strong>{quoteCurrency(quoteBalance)}</strong></p>
                  </div>
                  <label>
                    <span className="text-sm font-medium text-slate-700">Internal notes / message note</span>
                    <textarea value={quoteNotes} onChange={(event) => setQuoteNotes(event.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" rows={3} />
                  </label>
                </div>
              ) : null}
              <div className={cn("quote-preview-shell", isQuoteViewMode && "w-full")}>
                <div className="quote-page quote-print-area bg-white text-[#3d493f]">
                  <div className="quote-logo">
                    <div className="quote-logo-small">THE</div>
                    <div className="quote-logo-word">HITCHED</div>
                    <div className="quote-logo-mark">♡</div>
                    <div className="quote-logo-word">STORIES</div>
                  </div>
                  <p className="quote-prepared">Prepared for {quoteClientName || quoteRow.host_name || "Client"}</p>
                  <section>
                    <h2>Vision</h2>
                    <p>
                      We are a team of wedding photographers who capture memories that will transcend generations and become a cherished part of a family heirloom. Our experience gives us an intimate understanding of rituals, a keen eye for capturing precious moments between loved ones and a strong sense of lighting & composition to create iconic portraits at your events.
                    </p>
                  </section>
                  <section>
                    <h2>Details of your Events</h2>
                    <table className="quote-table">
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Date</th>
                          <th>Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quoteEvents.map((event) => (
                          <tr key={event.id}>
                            <td>{event.name || "-"}</td>
                            <td>{fullDate(event.date)}</td>
                            <td>{event.hours || "0"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                  <section>
                    <h2>Pricing</h2>
                    <p>
                      Congratulations on your big day! We are delighted to be a part of your celebration! <strong>For all your events, our charges are: {quoteCurrency(quoteTotal)}</strong>
                    </p>
                    {Number(quoteAdvance || 0) > 0 ? <p><strong>Advance received:</strong> {quoteCurrency(Number(quoteAdvance || 0))}. <strong>Balance due:</strong> {quoteCurrency(quoteBalance)}.</p> : null}
                  </section>
                  <section>
                    <h2>Deliverables</h2>
                    <ul>
                      <li>Edited Photos Online Gallery access of all wedding events.</li>
                      <li>Edited 4K Candid Cinematic Highlights video (8 to 12 mins) encompassing all events.</li>
                      <li>Full-length documentary video (45mins to 1hr duration) delivered in stunning 4K for the Wedding events.</li>
                      <li>Live streaming service for the Wedding and Cocktail events (Note: Client to provide high-speed Internet).</li>
                      <li>A curated collection of the best 50-100 edited photos from all events will be shared once the outstanding invoice balance is settled in full.</li>
                      <li><strong>Final Delivery:</strong> Complete deliverables will be securely delivered digitally within 60 days from the date the final payment is cleared.</li>
                    </ul>
                  </section>
                  <section className="quote-break">
                    <h2>Terms and Conditions</h2>
                    <ul>
                      <li><strong>Deposit:</strong> A 20% non-refundable deposit is required to secure the date.</li>
                      <li><strong>Cancellation:</strong> Written notice is required for cancellations. The deposit is non-refundable.</li>
                      <li><strong>Re-Edits:</strong> Re-edits can be taken into consideration for pictures and wedding films. Please communicate the required changes with notice.</li>
                      <li>Any extra events not mentioned in quote will not be covered by Hitched Stories.</li>
                    </ul>
                  </section>
                  <section>
                    <h2>Contact Information</h2>
                    <ul>
                      <li><strong>Email:</strong> thehitchedstories@gmail.com</li>
                      <li><strong>Phone:</strong> (214) 836-6275</li>
                    </ul>
                    <p>We look forward to the opportunity of being a part of your wedding and capturing memories that will last a lifetime!</p>
                  </section>
                </div>
              </div>
              <div className={cn("quote-actions flex w-full justify-end gap-2", !isQuoteViewMode && "lg:col-span-2")}>
                <button onClick={() => setQuoteOpen(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-mist">Close</button>
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-mist">
                  <Printer className="h-4 w-4" /> Print / Save PDF
                </button>
                <button onClick={() => downloadQuoteDocument()} className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-mist">
                  <FileText className="h-4 w-4" /> Download Document
                </button>
                <button
                  onClick={async () => {
                    try {
                      const shared = await shareQuoteDocument();
                      if (!shared) {
                        window.open(`mailto:${quoteRow.email ?? ""}?subject=Wedding Photography Quotation&body=${encodeURIComponent(`${quoteMessage}\n\nThe quotation document has been downloaded. Please attach it to this email.`)}`);
                      }
                    } catch (error) {
                      if ((error as Error).name !== "AbortError") {
                        downloadQuoteDocument();
                        window.open(`mailto:${quoteRow.email ?? ""}?subject=Wedding Photography Quotation&body=${encodeURIComponent(`${quoteMessage}\n\nThe quotation document has been downloaded. Please attach it to this email.`)}`);
                      }
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-mist"
                >
                  <Mail className="h-4 w-4" /> Email Document
                </button>
                <button
                  onClick={async () => {
                    try {
                      await sendQuoteDocumentViaWhatsApp();
                      startTransition(async () => {
                        if (quoteRow?.id && canGenerateQuotation(quoteRow)) {
                          if (demoMode) {
                            const now = new Date().toISOString();
                            persistLocalRows(localRows.map((row) => (row.id === quoteRow.id ? { ...row, status: "Quotation Sent", updated_at: now } : row)));
                          } else {
                            await updateStatus("clients", quoteRow.id, "Quotation Sent");
                          }
                        }
                        setQuoteOpen(false);
                        router.refresh();
                      });
                    } catch (error) {
                      downloadQuoteDocument();
                      window.alert(`${(error as Error).message}\n\nThe quotation document was downloaded instead. Once WhatsApp API credentials are configured, this button will send the document directly.`);
                    }
                  }}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  {canGenerateQuotation(quoteRow) ? "Send Document via WhatsApp API & Mark Sent" : "Send Document via WhatsApp API"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {inviteOpen ? (
        <div className="fixed inset-0 z-50 grid animate-fade-in place-items-center bg-ink/50 p-4 backdrop-blur-sm" onClick={() => setInviteOpen(false)}>
          <div
            className="w-full max-w-md animate-scale-in overflow-hidden rounded-2xl bg-white shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h3 className="text-lg font-semibold text-ink">Invite client to fill details</h3>
              <button aria-label="Close" title="Close" onClick={() => setInviteOpen(false)} className="rounded-lg p-2 text-muted transition hover:bg-mist hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted">Enter the client&apos;s phone number (international format) or email. We&apos;ll open WhatsApp with a link to the intake form.</p>
              <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-700">Phone or email</span>
                <input
                  value={inviteContact}
                  onChange={(e) => setInviteContact(e.target.value)}
                  placeholder="e.g. +911234567890 or name@example.com"
                  className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
                />
              </label>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setInviteOpen(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-mist">Cancel</button>
                <button
                  onClick={() => {
                    const contact = inviteContact.trim();
                    if (!contact) return;
                    const base = `${location.origin}/client-intake`;
                    const url = contact.includes("@") ? `${base}?email=${encodeURIComponent(contact)}` : `${base}?phone=${encodeURIComponent(contact)}`;
                    const message = `Hi! Please fill your client details here: ${url}`;
                    const phoneOnly = contact.replace(/\D/g, "");
                    if (contact.includes("@") || phoneOnly.length < 4) {
                      // fallback to mailto for emails or invalid phone
                      if (contact.includes("@")) window.open(`mailto:${contact}?subject=Please fill client details&body=${encodeURIComponent(message)}`);
                      else window.open(url, "_blank", "noopener,noreferrer");
                    } else {
                      window.open(`https://wa.me/${phoneOnly}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
                    }
                    setInviteOpen(false);
                    setInviteContact("");
                  }}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
