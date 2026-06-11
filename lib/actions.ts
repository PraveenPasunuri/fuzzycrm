"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { modules } from "@/lib/module-config";
import { createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();

function cleanValue(value: FormDataEntryValue | null) {
  if (value === null) return null;
  const stringValue = String(value).trim();
  return stringValue === "" ? null : stringValue;
}

function payloadFor(slug: string, formData: FormData) {
  const config = modules[slug];
  if (!config) throw new Error("Unknown module");

  const payload: Record<string, unknown> = {};
  for (const field of config.fields) {
    const value = cleanValue(formData.get(field.name));
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

async function eventPayloadFor(formData: FormData) {
  const { payload } = payloadFor("events", formData);
  if (!payload.event_name && payload.client_id) {
    const supabase = createClient();
    const { data, error } = await supabase.from("clients").select("event_type").eq("id", payload.client_id);
    if (error) throw new Error(error.message);
    payload.event_name = ((data ?? []) as Record<string, any>[])[0]?.event_type ?? "Untitled celebration";
  }
  return payload;
}

async function nextClientNumber() {
  const supabase = createClient();
  const { data, error } = await supabase.from("clients").select("client_number").order("client_number", { ascending: false });
  if (error) throw new Error(error.message);
  const max = ((data ?? []) as Record<string, any>[]).reduce((current, row) => Math.max(current, Number(row.client_number ?? 0)), 1000);
  return max + 1;
}

export async function saveRecord(slug: string, formData: FormData) {
  const id = cleanValue(formData.get("id"));
  const config = modules[slug];
  if (!config) throw new Error("Unknown module");
  const payload = slug === "events" ? await eventPayloadFor(formData) : payloadFor(slug, formData).payload;
  const supabase = createClient();

  if (slug === "clients" && !id && !payload.client_number) {
    payload.client_number = await nextClientNumber();
  }

  const result = id
    ? await supabase.from(config.table).update(payload).eq("id", uuidSchema.parse(id))
    : await supabase.from(config.table).insert(payload);

  if (result.error) throw new Error(result.error.message);
  revalidatePath(`/${slug}`);
  redirect(`/${slug}`);
}

export async function saveEventBatch(records: Record<string, FormDataEntryValue | null>[]) {
  if (records.length === 0) return;
  const supabase = createClient();
  const payloads = await Promise.all(records.map((record) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(record)) {
      if (key !== "id" && value !== null) formData.set(key, value);
    }
    return eventPayloadFor(formData);
  }));

  const { error } = await supabase.from(modules.events.table).insert(payloads);
  if (error) throw new Error(error.message);
  revalidatePath("/events");
}

export async function deleteRecord(slug: string, id: string) {
  const config = modules[slug];
  if (!config) throw new Error("Unknown module");

  const supabase = createClient();
  const { error } = await supabase.from(config.table).delete().eq("id", uuidSchema.parse(id));
  if (error) throw new Error(error.message);
  revalidatePath(`/${slug}`);
}
