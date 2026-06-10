import { Camera } from "lucide-react";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-mist px-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-md bg-brand text-white">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Admin Login</h1>
            <p className="text-sm text-zinc-500">Photography business portal</p>
          </div>
        </div>
        <Suspense fallback={<div className="h-44 animate-pulse rounded-md bg-mist" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
