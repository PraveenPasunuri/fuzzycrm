import { NextResponse } from "next/server";

export const runtime = "nodejs";

const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || "v22.0";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function normalizePhone(value: FormDataEntryValue | null) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

async function metaRequest<T>(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const data = (await response.json().catch(() => ({}))) as T & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(data.error?.message || `WhatsApp API request failed with status ${response.status}`);
  }

  return data;
}

export async function POST(request: Request) {
  try {
    const accessToken = requiredEnv("WHATSAPP_ACCESS_TOKEN");
    const phoneNumberId = requiredEnv("WHATSAPP_PHONE_NUMBER_ID");
    const formData = await request.formData();
    const recipient = normalizePhone(formData.get("phone"));
    const message = String(formData.get("message") ?? "");
    const filename = String(formData.get("filename") ?? "Wedding-Photography-Quotation.doc");
    const file = formData.get("document");

    if (!recipient || recipient.length < 11) {
      return NextResponse.json({ error: "Recipient phone number must include a country code." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Quotation document is required." }, { status: 400 });
    }

    const uploadForm = new FormData();
    uploadForm.set("messaging_product", "whatsapp");
    uploadForm.set("file", file, filename);

    const media = await metaRequest<{ id: string }>(
      `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: uploadForm
      }
    );

    const sent = await metaRequest<{ messages?: { id: string }[] }>(
      `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "document",
          document: {
            id: media.id,
            filename,
            caption: message.slice(0, 1024)
          }
        })
      }
    );

    return NextResponse.json({ success: true, mediaId: media.id, messageId: sent.messages?.[0]?.id ?? null });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
