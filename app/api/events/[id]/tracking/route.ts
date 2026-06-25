import { NextResponse } from "next/server";
import { z } from "zod";
import { trackingFields } from "@/lib/pipeline";
import { createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();
const trackingFieldSet = new Set(trackingFields);

function derivedEventStatus(row: Record<string, unknown>) {
  if (row.pipeline_closed) return "Closed";
  if (row.delivered_to_client) return "Delivered";
  if (row.photo_editor_id || row.video_editor_id || row.photo_editing_completed || row.video_editing_completed) return "Editing";
  return "Shoot Completed";
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const eventId = uuidSchema.parse(params.id);
    const body = (await request.json().catch(() => ({}))) as { field?: string; value?: string | boolean | null };
    const field = String(body.field ?? "");
    if (!trackingFieldSet.has(field)) {
      return NextResponse.json({ error: "Unknown tracking field" }, { status: 400 });
    }

    let nextValue: string | boolean | null;
    if (field.endsWith("_editor_id")) {
      nextValue = body.value ? uuidSchema.parse(String(body.value)) : null;
    } else if (field.endsWith("_link")) {
      const trimmed = String(body.value ?? "").trim();
      nextValue = trimmed === "" ? null : trimmed;
    } else {
      nextValue = body.value === true || body.value === "true";
    }

    const supabase = createClient();
    const { data: current, error: readError } = await supabase.from("events").select("*").eq("id", eventId);
    if (readError) throw new Error(readError.message);
    const existing = ((current ?? []) as Record<string, unknown>[])[0] ?? {};
    const merged = { ...existing, [field]: nextValue };
    const payload: Record<string, unknown> = { [field]: nextValue, status: derivedEventStatus(merged) };

    const { data, error } = await supabase.from("events").update(payload).eq("id", eventId).select("*").limit(1);
    if (error) throw new Error(error.message);
    return NextResponse.json({ data: (data ?? [])[0] ?? null });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
