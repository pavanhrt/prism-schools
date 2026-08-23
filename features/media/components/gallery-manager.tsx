"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGalleryItemAction, deleteGalleryItemAction, setGalleryItemActiveAction, updateGalleryItemAction } from "@/features/media/actions";
import type { WebsiteGalleryItem } from "@/types/media";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GalleryManager({ items, canManage }: { items: WebsiteGalleryItem[]; canManage: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const run = (work: () => Promise<{ ok: boolean; error?: string }>) => startTransition(async () => { const result = await work(); setMessage(result.ok ? "Gallery updated." : result.error || "Update failed."); if (result.ok) router.refresh(); });
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
    <Card><CardHeader><CardTitle>Authentic PRISM gallery</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => <article key={item.id} className="overflow-hidden rounded-lg border border-slate-200">
        <div className="relative aspect-[4/3]"><Image src={item.image_url} alt={item.alt_text} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" /></div>
        <div className="p-3"><p className="font-medium">{item.title}</p><p className="text-xs text-slate-500">{item.category || "Uncategorised"} · order {item.display_order} · {item.is_active ? "visible" : "hidden"}</p>
          {canManage && <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setGalleryItemActiveAction(item.id, !item.is_active))}>{item.is_active ? "Hide" : "Publish"}</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => updateGalleryItemAction(item.id, { display_order: item.display_order + 10 }))}>Move later</Button><Button size="sm" variant="destructive" disabled={pending} onClick={() => window.confirm(`Permanently delete “${item.title}” and its stored image?`) && run(() => deleteGalleryItemAction(item.id))}>Delete</Button></div>}
        </div>
      </article>)}
      {!items.length && <p className="py-8 text-sm text-slate-500">No authentic gallery images have been uploaded yet.</p>}
    </CardContent></Card>
    {canManage && <Card className="h-fit"><CardHeader><CardTitle>Add gallery image</CardTitle></CardHeader><CardContent><form action={(data) => run(() => createGalleryItemAction(data))} className="flex flex-col gap-3">
      <div><Label htmlFor="gallery-file">Image</Label><Input id="gallery-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required /></div>
      <div><Label htmlFor="gallery-title">Title</Label><Input id="gallery-title" name="title" maxLength={120} required /></div>
      <div><Label htmlFor="gallery-alt">Alt text</Label><Input id="gallery-alt" name="alt_text" minLength={3} maxLength={200} required /></div>
      <div><Label htmlFor="gallery-caption">Caption</Label><Input id="gallery-caption" name="caption" maxLength={500} /></div>
      <div><Label htmlFor="gallery-category">Category</Label><Input id="gallery-category" name="category" maxLength={80} /></div>
      <div><Label htmlFor="gallery-order">Display order</Label><Input id="gallery-order" name="display_order" type="number" min={0} max={10000} defaultValue={0} /></div>
      <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked /> Publish immediately</label>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Upload and add"}</Button>
    </form>{message && <p aria-live="polite" className="mt-3 text-sm text-slate-600">{message}</p>}</CardContent></Card>}
  </div>;
}
