import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const supabase = createClient();
  const payload: Record<string, unknown> = {
    host_name: body.host_name ?? null,
    contact_no: body.contact_no ?? null,
    email: body.email ?? null,
    event_type: body.event_type ?? null,
    quoted_hours: body.quoted_hours ? Number(body.quoted_hours) : null,
    quoted_price: body.quoted_price ? Number(body.quoted_price) : null,
    notes: body.notes ?? null,
    status: "Inquiry"
  };

  const { data, error } = await supabase.from("clients").insert([payload]).select("id,client_number").limit(1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, client: (data ?? [])[0] ?? null });
}
