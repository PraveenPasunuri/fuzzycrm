import { NextResponse } from "next/server";
import { modules } from "@/lib/module-config";
import { payloadFor } from "@/lib/record-payload";
import { createClient } from "@/lib/supabase/server";

async function nextClientNumber() {
  const supabase = createClient();
  const { data, error } = await supabase.from("clients").select("client_number").order("client_number", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).reduce((max, row) => Math.max(max, Number(row.client_number ?? 0)), 1000) + 1;
}

async function eventPayload(payload: Record<string, unknown>) {
  if (!payload.event_name && payload.client_id) {
    const supabase = createClient();
    const { data, error } = await supabase.from("clients").select("event_type").eq("id", payload.client_id);
    if (error) throw new Error(error.message);
    payload.event_name = ((data ?? []) as Record<string, unknown>[])[0]?.event_type ?? "Untitled celebration";
  }
  return payload;
}

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const config = modules[params.slug];
    if (!config) return NextResponse.json({ error: "Unknown module" }, { status: 404 });

    const relationSelect = config.relations
      ? Object.entries(config.relations).map(([field, relation]) => `${relation.alias ?? relation.table}:${field}(${relation.select})`)
      : [];
    const supabase = createClient();
    const { data, error } = await supabase
      .from(config.table)
      .select(["*", ...relationSelect].join(","))
      .order(config.orderBy, { ascending: config.orderBy.includes("date") });

    if (error) throw new Error(error.message);
    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  try {
    const config = modules[params.slug];
    if (!config) return NextResponse.json({ error: "Unknown module" }, { status: 404 });

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const { payload } = payloadFor(params.slug, body);
    if (params.slug === "clients" && !payload.client_number) payload.client_number = await nextClientNumber();
    const insertPayload = params.slug === "events" ? await eventPayload(payload) : payload;

    const supabase = createClient();
    const { data, error } = await supabase.from(config.table).insert(insertPayload).select("*").limit(1);
    if (error) throw new Error(error.message);
    return NextResponse.json({ data: (data ?? [])[0] ?? null }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
