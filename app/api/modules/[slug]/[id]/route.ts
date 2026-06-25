import { NextResponse } from "next/server";
import { z } from "zod";
import { modules } from "@/lib/module-config";
import { payloadFor } from "@/lib/record-payload";
import { createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();

export async function PATCH(request: Request, { params }: { params: { slug: string; id: string } }) {
  try {
    const config = modules[params.slug];
    if (!config) return NextResponse.json({ error: "Unknown module" }, { status: 404 });

    const id = uuidSchema.parse(params.id);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { payload } = payloadFor(params.slug, body);

    const supabase = createClient();
    const { data, error } = await supabase.from(config.table).update(payload).eq("id", id).select("*").limit(1);
    if (error) throw new Error(error.message);
    return NextResponse.json({ data: (data ?? [])[0] ?? null });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { slug: string; id: string } }) {
  try {
    const config = modules[params.slug];
    if (!config) return NextResponse.json({ error: "Unknown module" }, { status: 404 });

    const id = uuidSchema.parse(params.id);
    const supabase = createClient();
    const { error } = await supabase.from(config.table).delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
