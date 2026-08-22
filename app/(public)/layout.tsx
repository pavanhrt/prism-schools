import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSchoolSettings } from "@/features/settings/repository";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/academics", label: "Academics" },
  { href: "/gallery", label: "Gallery" },
  { href: "/admissions", label: "Admissions" },
  { href: "/contact", label: "Contact" },
];

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const settings = await getSchoolSettings(supabase);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-lg font-semibold text-slate-900">
            {settings.school_name}
          </Link>
          <nav className="hidden gap-6 text-sm text-slate-600 md:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-slate-900">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/auth/login"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 py-8 text-sm text-slate-500">
          <p className="font-medium text-slate-700">{settings.school_name}</p>
          <p className="mt-1">© {new Date().getFullYear()} {settings.school_name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
