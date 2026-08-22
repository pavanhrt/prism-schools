import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listClasses } from "@/features/academics/repository";

export const metadata: Metadata = {
  title: "Academics",
  description: "Classes offered and our approach to teaching.",
};

export default async function AcademicsPage() {
  const supabase = await createClient();
  const classes = await listClasses(supabase);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Academics</h1>
      <p className="mt-4 text-slate-700">
        A structured curriculum with dedicated subject teachers at every level, and regular
        assessment to track each student&apos;s progress.
      </p>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">Classes offered</h2>
      {classes.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {classes.map((c) => (
            <span key={c.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {c.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Class list coming soon.</p>
      )}
    </div>
  );
}
