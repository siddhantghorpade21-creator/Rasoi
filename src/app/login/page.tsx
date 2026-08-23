"use client";

import { useState } from "react";
import { ChefHat, Loader2, Mail, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

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

          {status === "sent" ? (
            <div className="w-full rounded-2xl border border-dashed border-emerald-700 bg-emerald-50 p-4 text-sm text-emerald-800">
              Check <span className="font-medium">{email}</span> for a sign-in link.
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

          <p className="text-[11px] text-stone-400">No passwords — just a link sent to your email, or your Google account.</p>
        </div>
      </div>
    </div>
  );
}
