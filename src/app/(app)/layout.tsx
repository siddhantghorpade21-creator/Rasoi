import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("language").eq("id", user.id).single();
  const lang = (profile?.language ?? "en") as "en" | "hi";

  return (
    <div className="min-h-screen w-full bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] rounded-[2.5rem] border-8 border-stone-900 bg-amber-50 shadow-2xl overflow-hidden font-sans">
        <div className="h-[720px] overflow-y-auto relative">{children}</div>
        <BottomNav lang={lang} />
      </div>
    </div>
  );
}
