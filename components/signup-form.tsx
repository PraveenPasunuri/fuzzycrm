"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const origin = window.location.origin;
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/login`
      }
    });

    setLoading(false);

    if (signupError) {
      setError(signupError.message);
      return;
    }

    setMessage("Check your email for the confirmation code/link, then return here to sign in.");
    setEmail("");
    setPassword("");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-zinc-700">Email</span>
        <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" className="mt-1 h-11 w-full rounded-md border border-line px-3 outline-none focus:border-brand" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-zinc-700">Password</span>
        <input value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} type="password" className="mt-1 h-11 w-full rounded-md border border-line px-3 outline-none focus:border-brand" />
      </label>
      {message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <button disabled={loading} className="h-11 w-full rounded-md bg-brand font-semibold text-white hover:bg-[#176274] disabled:opacity-60">
        {loading ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        Already registered? <Link href="/login" className="font-semibold text-brand hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
