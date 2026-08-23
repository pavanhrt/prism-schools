"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { deleteUnusedPublicMediaAction, listPublicMediaLibraryAction } from "@/features/media/actions";
import type { PublicMediaAsset, PublicMediaLibrary } from "@/types/media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const categoryLabel: Record<PublicMediaAsset["category"], string> = {
  branding: "Branding", hero: "Hero", program: "Programs", "future-learning": "Future Learning", gallery: "Gallery", seo: "SEO",
};

export function PublicMediaLibraryBrowser({
  canManage,
  onSelect,
  selectedPath,
}: {
  canManage: boolean;
  onSelect?: (asset: PublicMediaAsset) => void;
  selectedPath?: string | null;
}) {
  const [library, setLibrary] = useState<PublicMediaLibrary | null>(null);
  const [message, setMessage] = useState("Loading public media…");
  const [pending, startTransition] = useTransition();

  const load = () => startTransition(async () => {
    const result = await listPublicMediaLibraryAction();
    if (result.ok) { setLibrary(result.library); setMessage(result.library.assets.length ? "" : "No managed public images have been uploaded yet."); }
    else setMessage(result.error);
  });
  useEffect(load, []);

  function remove(asset: PublicMediaAsset) {
    if (!window.confirm(`Permanently delete the unused image “${asset.filename}”?`)) return;
    startTransition(async () => {
      const result = await deleteUnusedPublicMediaAction(asset.path);
      setMessage(result.ok ? "Unused public image deleted." : result.error);
      if (result.ok) {
        const refreshed = await listPublicMediaLibraryAction();
        if (refreshed.ok) setLibrary(refreshed.library);
      }
    });
  }

  return <Card>
    <CardHeader><div><CardTitle>Public media library</CardTitle><p className="mt-1 text-sm text-slate-500">Only managed website images appear here. Student, staff and private files are never included.</p></div></CardHeader>
    <CardContent>
      {message && <p aria-live="polite" className="mb-4 text-sm text-slate-600">{message}</p>}
      {library?.truncated && <p className="mb-4 text-sm text-amber-700">Showing the newest media. Older items are not loaded in this view.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {library?.assets.map((asset) => <article key={asset.path} className={`overflow-hidden rounded-lg border ${selectedPath === asset.path ? "border-amber-500 ring-2 ring-amber-200" : "border-slate-200"}`}>
          <div className="relative aspect-[4/3] bg-slate-100"><Image src={asset.url} alt="" fill sizes="(max-width: 640px) 100vw, 25vw" loading="lazy" className="object-cover" /></div>
          <div className="space-y-2 p-3">
            <div className="flex flex-wrap gap-2"><Badge variant="outline">{categoryLabel[asset.category]}</Badge><Badge variant={asset.isUnused ? "outline" : "success"}>{asset.isUnused ? "Unused" : "In use"}</Badge></div>
            <p className="truncate text-sm font-medium text-slate-900" title={asset.filename}>{asset.filename}</p>
            <p className="text-xs text-slate-500">{asset.extension.toUpperCase()}{asset.size == null ? "" : ` · ${Math.max(1, Math.round(asset.size / 1024))} KB`}</p>
            <p className="text-xs text-slate-600">{asset.usages.length ? asset.usages.map((usage) => usage.label).join(", ") : "Not referenced by public website content"}</p>
            <div className="flex flex-wrap gap-2">
              {onSelect && <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => onSelect(asset)}>{selectedPath === asset.path ? "Selected" : "Use image"}</Button>}
              {canManage && asset.isUnused && <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => remove(asset)}>Delete unused</Button>}
            </div>
          </div>
        </article>)}
      </div>
    </CardContent>
  </Card>;
}
