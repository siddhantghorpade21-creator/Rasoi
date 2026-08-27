"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChefHat, KeyRound, Loader2, Mail, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  link_used_or_expired:
    "That link didn't work — it may have already been opened once (some email apps do this automatically), or it's expired. Enter the 6-digit code from the same email instead, or request a new one below.",
  wrong_browser:
    "That link only works in the browser you requested it from. If you opened it from a different app or device, enter the 6-digit code from the email instead.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setVerifying(true);
    setVerifyError("");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setVerifyError(error.message);
      setVerifying(false);
      return;
    }
    router.push("/discover");
    router.refresh();
  };

  const signInWithGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen w-full bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] rounded-[2.5rem] border-8 border-stone-900 bg-amber-50 shadow-2xl overflow-hidden font-sans">
        <div className="flex min-h-[600px] flex-col items-center justify-center gap-6 px-8 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-900">
            <ChefHat size={30} className="text-amber-50" />
          </div>
          <div>
            <h1 className="text-3xl text-stone-900 font-serif font-semibold">Rasoi</h1>
            <p className="mt-1 text-sm italic text-stone-500">Aaj kya banega?</p>
          </div>

          {callbackError && (
            <div className="w-full rounded-2xl border border-dashed border-red-800 bg-red-50 p-3 text-left text-xs text-red-800">
              {CALLBACK_ERROR_MESSAGES[callbackError] ?? "That sign-in link didn't work — please try again below."}
            </div>
          )}

          {status === "sent" ? (
            <div className="flex w-full flex-col gap-3">
              <div className="rounded-2xl border border-dashed border-emerald-700 bg-emerald-50 p-4 text-sm text-emerald-800">
                Check <span className="font-medium">{email}</span> — click the link, or enter the 6-digit code from that email below.
              </div>
              <form onSubmit={verifyCode} className="flex w-full flex-col gap-3">
                <div className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5">
                  <KeyRound size={16} className="text-stone-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6-digit code"
                    className="flex-1 text-sm outline-none placeholder:text-stone-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex items-center justify-center gap-2 rounded-full bg-stone-900 py-2.5 text-sm font-medium text-amber-50 disabled:opacity-60"
                >
                  {verifying ? <Loader2 size={16} className="animate-spin" /> : null}
                  Verify code
                </button>
                {verifyError && <p className="text-xs text-red-800">{verifyError}</p>}
              </form>
              <button onClick={() => setStatus("idle")} className="text-xs text-stone-500 underline">
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={sendMagicLink} className="flex w-full flex-col gap-3">
              <div className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5">
                <Mail size={16} className="text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 text-sm outline-none placeholder:text-stone-400"
                />
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="flex items-center justify-center gap-2 rounded-full bg-stone-900 py-2.5 text-sm font-medium text-amber-50 disabled:opacity-60"
              >
                {status === "sending" ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                Send magic link
              </button>
              {status === "error" && <p className="text-xs text-red-800">{errorMsg}</p>}
            </form>
          )}

          <div className="flex w-full items-center gap-3 text-xs text-stone-400">
            <div className="h-px flex-1 bg-stone-200" />
            or
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white py-2.5 text-sm font-medium text-stone-700"
          >
            Continue with Google
          </button>

          <p className="text-[11px] text-stone-400">No passwords — a link or a code sent to your email, or your Google account.</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
