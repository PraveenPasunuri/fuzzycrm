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

  return { config, payload };
}

export async function saveRecord(slug: string, formData: FormData) {
  const id = cleanValue(formData.get("id"));
  const { config, payload } = payloadFor(slug, formData);
  const supabase = createClient();

  const result = id
    ? await supabase.from(config.table).update(payload).eq("id", uuidSchema.parse(id))
    : await supabase.from(config.table).insert(payload);

  if (result.error) throw new Error(result.error.message);
  revalidatePath(`/${slug}`);
  redirect(`/${slug}`);
}

export async function deleteRecord(slug: string, id: string) {
  const config = modules[slug];
  if (!config) throw new Error("Unknown module");

  const supabase = createClient();
  const { error } = await supabase.from(config.table).delete().eq("id", uuidSchema.parse(id));
  if (error) throw new Error(error.message);
  revalidatePath(`/${slug}`);
}
