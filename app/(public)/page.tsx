import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSchoolSettings } from "@/features/settings/repository";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const settings = await getSchoolSettings(supabase);
  return {
    title: settings.school_name,
    description: `${settings.school_name} — admissions, academics, and school life.`,
  };
}

export default async function HomePage() {
  const supabase = await createClient();
  const settings = await getSchoolSettings(supabase);

  return (
    <div className="flex flex-col">
      <section className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-5 py-20">
        <h1 className="max-w-2xl text-4xl font-semibold text-slate-900 sm:text-5xl">
          {settings.school_name}
        </h1>
        <p className="max-w-xl text-lg text-slate-600">
          A place where students learn, grow, and belong. Explore what makes our school
          community what it is.
        </p>
        <div className="flex gap-3">
          <Link
            href="/admissions"
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Enquire about admissions
          </Link>
          <Link
            href="/about"
            className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Learn more
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-16 sm:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Academics</h2>
            <p className="mt-2 text-sm text-slate-600">
              A structured curriculum from early years through to graduation, with dedicated
              subject teachers at every level.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admissions</h2>
            <p className="mt-2 text-sm text-slate-600">
              A straightforward path from enquiry to enrollment — reach out and our
              admissions team will guide you through it.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Community</h2>
            <p className="mt-2 text-sm text-slate-600">
              Regular notices, events, and open communication between school and home.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
