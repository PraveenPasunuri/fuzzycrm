import { Camera } from "lucide-react";
import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-mist px-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-md bg-brand text-white">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Create Account</h1>
            <p className="text-sm text-zinc-500">Use email confirmation to register</p>
          </div>
        </div>
        <SignupForm />
      </div>
    </main>
  );
}
