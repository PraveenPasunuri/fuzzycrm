"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ClientIntakePage() {
  const search = useSearchParams();
  const prePhone = search.get("phone") ?? "";
  const preEmail = search.get("email") ?? "";
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ host_name: "", contact_no: prePhone, email: preEmail, event_type: "", quoted_hours: "", quoted_price: "", notes: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/client-intake", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Failed");
      setSuccess(true);
    } catch (err) {
      alert("Submission failed");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <h1 className="text-2xl font-bold">Thanks — your details are submitted</h1>
        <p className="mt-4 text-sm text-muted">We&apos;ll get back to you shortly.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">Client details</h1>
      <p className="mt-2 text-sm text-muted">Fill in the details and submit to register as a client.</p>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <label>
          <span className="text-sm font-medium">Name</span>
          <input value={form.host_name} onChange={(e) => setForm({ ...form, host_name: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" required />
        </label>
        <label>
          <span className="text-sm font-medium">Phone</span>
          <input value={form.contact_no} onChange={(e) => setForm({ ...form, contact_no: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label>
          <span className="text-sm font-medium">Email</span>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label>
          <span className="text-sm font-medium">Event type</span>
          <input value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium">Quoted hours</span>
            <input value={form.quoted_hours} onChange={(e) => setForm({ ...form, quoted_hours: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <span className="text-sm font-medium">Quoted price</span>
            <input value={form.quoted_price} onChange={(e) => setForm({ ...form, quoted_price: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
        </label>
        <label>
          <span className="text-sm font-medium">Notes</span>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" rows={4} />
        </label>
        <div className="flex justify-end">
          <button disabled={loading} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">{loading ? "Submitting..." : "Submit"}</button>
        </div>
      </form>
    </div>
  );
}
