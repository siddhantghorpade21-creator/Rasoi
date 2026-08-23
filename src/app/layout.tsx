import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Rasoi — Aaj kya banega?",
  description: "An India-market meal planner: today's thali, recipe discovery, grocery lists by vendor, and step-by-step cook mode.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Rasoi" },
};

export const viewport: Viewport = {
  themeColor: "#7f1d1d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans text-stone-900 antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
