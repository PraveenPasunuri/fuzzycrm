"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    router.replace(params.get("redirectedFrom") ?? "/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-zinc-700">Email</span>
        <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" className="mt-1 h-11 w-full rounded-md border border-line px-3 outline-none focus:border-brand" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-zinc-700">Password</span>
        <input value={password} onChange={(event) => setPassword(event.target.value)} required type="password" className="mt-1 h-11 w-full rounded-md border border-line px-3 outline-none focus:border-brand" />
      </label>
      {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <button disabled={loading} className="h-11 w-full rounded-md bg-brand font-semibold text-white hover:bg-[#176274] disabled:opacity-60">
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
