"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, Home, Search, ShoppingCart, User } from "lucide-react";
import { STRINGS } from "@/lib/constants";

export function BottomNav({ lang }: { lang: "en" | "hi" }) {
  const pathname = usePathname();
  const s = STRINGS[lang];
  const navItems = [
    { id: "today", href: "/today", label: s.nav.today, icon: Home },
    { id: "discover", href: "/discover", label: s.nav.discover, icon: Search },
    { id: "grocery", href: "/grocery", label: s.nav.grocery, icon: ShoppingCart },
    { id: "cook", href: "/cook", label: s.nav.cook, icon: ChefHat },
    { id: "profile", href: "/profile", label: s.nav.profile, icon: User },
  ];

  return (
    <div className="flex border-t border-stone-200 bg-white">
      {navItems.map((n) => {
        const Icon = n.icon;
        const active = pathname?.startsWith(n.href);
        return (
          <Link
            key={n.id}
            href={n.href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] ${active ? "text-red-900" : "text-stone-400"}`}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
            {n.label}
          </Link>
        );
      })}
    </div>
  );
}
