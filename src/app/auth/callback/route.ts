import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/discover";

  // No `code` at all almost always means the link was already consumed
  // before this click — most commonly an email security scanner visiting
  // every link in the message ahead of the user.
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=link_used_or_expired`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // A code that fails to exchange (rather than being missing outright) is
  // the signature of PKCE's code_verifier living in a different browser/app
  // than the one the link was opened in.
  return NextResponse.redirect(`${origin}/login?error=wrong_browser`);
}
