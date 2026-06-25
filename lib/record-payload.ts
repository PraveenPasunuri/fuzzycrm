import { modules } from "@/lib/module-config";

export function cleanValue(value: FormDataEntryValue | unknown) {
  if (value === null || value === undefined) return null;
  const stringValue = String(value).trim();
  return stringValue === "" ? null : stringValue;
}

export function payloadFor(slug: string, source: FormData | Record<string, unknown>) {
  const config = modules[slug];
  if (!config) throw new Error("Unknown module");

  const payload: Record<string, unknown> = {};
  for (const field of config.fields) {
    const raw = source instanceof FormData ? source.get(field.name) : source[field.name];
    const value = cleanValue(raw);
    if (field.required && !value) {
      if (slug === "events" && field.name === "event_name") {
        payload[field.name] = null;
        continue;
      }
      throw new Error(`${field.label} is required`);
    }
    payload[field.name] = field.type === "number" && value !== null ? Number(value) : value;
  }

  if (slug === "clients") {
    const quotedHours = Number(payload.quoted_hours ?? 0);
    const quotedPrice = Number(payload.quoted_price ?? 0);
    const total = payload.total_price === null ? quotedHours * quotedPrice : Number(payload.total_price ?? 0);
    const advance = Number(payload.advance_paid ?? 0);
    payload.total_price = total;
    payload.balance_due = payload.balance_due === null ? Math.max(total - advance, 0) : payload.balance_due;
  }

  if (slug === "events") {
    const initial = Number(payload.total_initial_hours ?? 0);
    const extra = Number(payload.extra_hours ?? 0);
    payload.total_hours = initial + extra;
  }

  return { config, payload };
}
