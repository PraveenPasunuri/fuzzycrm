"use client";

import { useMemo, useState, useTransition } from "react";
import { Edit, ExternalLink, Plus, Search, Trash2, X } from "lucide-react";
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

function getValue(row: Record<string, any>, key: string) {
  return key.split(".").reduce((value, part) => value?.[part], row);
}

function formatCell(row: Record<string, any>, column: ModuleConfig["columns"][number]) {
  const value = getValue(row, column.key);
  if (column.type === "currency") return currency(value);
  if (column.type === "date") return prettyDate(String(value ?? ""));
  if (column.type === "status" && value) return <StatusBadge value={String(value)} />;
  if (String(value ?? "").startsWith("http")) {
    return (
      <a className="inline-flex items-center gap-1 text-brand hover:underline" href={String(value)} target="_blank" rel="noreferrer">
        Open <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  return value || "-";
}

export function ModuleManager({ config, rows, relationOptions }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [open, setOpen] = useState(false);
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
      return matchesQuery && matchesFilter;
    });
  }, [config, filter, query, rows]);

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
