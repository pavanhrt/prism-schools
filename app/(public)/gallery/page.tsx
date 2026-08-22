import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from school life and events.",
};

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-semibold text-slate-900">Gallery</h1>
      <p className="mt-4 text-slate-700">
        Photos from campus life, events, and activities will appear here.
      </p>
      <p className="mt-8 rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">
        Photo uploads aren&apos;t wired up yet — this page is ready for them once Storage is
        connected.
      </p>
    </div>
  );
}
