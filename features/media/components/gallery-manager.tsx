"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGalleryItemAction, createGalleryItemFromExistingAction, deleteGalleryItemAction, setGalleryItemActiveAction, updateGalleryItemAction } from "@/features/media/actions";
import { reorderWebsiteCollectionAction } from "@/features/settings/actions";
import type { PublicMediaAsset, WebsiteGalleryItem } from "@/types/media";
import { PublicMediaLibraryBrowser } from "@/features/media/components/public-media-library";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GalleryManager({ items, canManage }: { items: WebsiteGalleryItem[]; canManage: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<WebsiteGalleryItem | null>(null);
  const [reuseAsset, setReuseAsset] = useState<PublicMediaAsset | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const run = (work: () => Promise<{ ok: boolean; error?: string; warning?: string }>) => startTransition(async () => { const result = await work(); setMessage(result.ok ? result.warning || "Gallery updated." : result.error || "Update failed."); if (result.ok) router.refresh(); });
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
    <Card><CardHeader><CardTitle>Authentic PRISM gallery</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      {items.map((item, index) => <article key={item.id} className="overflow-hidden rounded-lg border border-slate-200">
        <div className="relative aspect-[4/3]"><Image src={item.image_url} alt={item.alt_text} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" /></div>
        <div className="p-3"><p className="font-medium">{item.title}</p><p className="text-xs text-slate-500">{item.category || "Uncategorised"} · order {item.display_order} · {item.is_active ? "visible" : "hidden"}</p>
          {canManage && <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={pending || index === 0} onClick={() => run(() => reorderWebsiteCollectionAction({ collection: "gallery", id: item.id, direction: "up" }))}>Move Up</Button><Button size="sm" variant="outline" disabled={pending || index === items.length - 1} onClick={() => run(() => reorderWebsiteCollectionAction({ collection: "gallery", id: item.id, direction: "down" }))}>Move Down</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => setEditing(item)}>Edit details</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setGalleryItemActiveAction(item.id, !item.is_active))}>{item.is_active ? "Hide" : "Publish"}</Button><Button size="sm" variant="destructive" disabled={pending} onClick={() => window.confirm(`Permanently delete “${item.title}”? Its image is deleted only when nothing else uses it.`) && run(() => deleteGalleryItemAction(item.id))}>Delete</Button></div>}
        </div>
      </article>)}
      {!items.length && <p className="py-8 text-sm text-slate-500">No authentic gallery images have been uploaded yet.</p>}
    </CardContent></Card>
    {canManage && <Card className="h-fit"><CardHeader><CardTitle>{editing ? "Edit gallery details" : "Add gallery image"}</CardTitle></CardHeader><CardContent>{editing ? <form action={(data) => run(async () => {
      const result = await updateGalleryItemAction(editing.id, { title: String(data.get("title")), alt_text: String(data.get("alt_text")), caption: String(data.get("caption")), category: String(data.get("category")), display_order: Number(data.get("display_order")), is_active: data.get("is_active") === "on" });
      if (result.ok) setEditing(null); return result;
    })} className="flex flex-col gap-3">
      <div><Label htmlFor="gallery-edit-title">Title</Label><Input id="gallery-edit-title" name="title" maxLength={120} required defaultValue={editing.title} /></div>
      <div><Label htmlFor="gallery-edit-alt">Alt text</Label><Input id="gallery-edit-alt" name="alt_text" minLength={3} maxLength={200} required defaultValue={editing.alt_text} /></div>
      <div><Label htmlFor="gallery-edit-caption">Caption</Label><Input id="gallery-edit-caption" name="caption" maxLength={500} defaultValue={editing.caption ?? ""} /></div>
      <div><Label htmlFor="gallery-edit-category">Category</Label><Input id="gallery-edit-category" name="category" maxLength={80} defaultValue={editing.category ?? ""} /></div>
      <div><Label htmlFor="gallery-edit-order">Display order</Label><Input id="gallery-edit-order" name="display_order" type="number" min={0} max={10000} defaultValue={editing.display_order} /></div>
      <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={editing.is_active} /> Published</label>
      <div className="flex gap-2"><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save details"}</Button><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div>
    </form> : <form action={(data) => run(() => createGalleryItemAction(data))} className="flex flex-col gap-3">
      <div><Label htmlFor="gallery-file">Image</Label><Input id="gallery-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required /></div>
      <div><Label htmlFor="gallery-title">Title</Label><Input id="gallery-title" name="title" maxLength={120} required /></div>
      <div><Label htmlFor="gallery-alt">Alt text</Label><Input id="gallery-alt" name="alt_text" minLength={3} maxLength={200} required /></div>
      <div><Label htmlFor="gallery-caption">Caption</Label><Input id="gallery-caption" name="caption" maxLength={500} /></div>
      <div><Label htmlFor="gallery-category">Category</Label><Input id="gallery-category" name="category" maxLength={80} /></div>
      <div><Label htmlFor="gallery-order">Display order</Label><Input id="gallery-order" name="display_order" type="number" min={0} max={10000} defaultValue={0} /></div>
      <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked /> Publish immediately</label>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Upload and add"}</Button>
    </form>}{message && <p aria-live="polite" className="mt-3 text-sm text-slate-600">{message}</p>}</CardContent></Card>}
    {canManage && <div className="xl:col-span-2 space-y-4">
      <PublicMediaLibraryBrowser canManage={canManage} selectedPath={reuseAsset?.path} onSelect={setReuseAsset} />
      {reuseAsset && <Card><CardHeader><CardTitle>Reuse selected image in gallery</CardTitle></CardHeader><CardContent><form action={(data) => run(() => createGalleryItemFromExistingAction({ path: reuseAsset.path, title: data.get("title"), alt_text: data.get("alt_text"), caption: data.get("caption"), category: data.get("category"), display_order: data.get("display_order"), is_active: data.get("is_active") === "on" }))} className="grid gap-3 md:grid-cols-2">
        <div><Label htmlFor="reuse-title">Title</Label><Input id="reuse-title" name="title" maxLength={120} required /></div>
        <div><Label htmlFor="reuse-alt">Alt text</Label><Input id="reuse-alt" name="alt_text" minLength={3} maxLength={200} required /></div>
        <div><Label htmlFor="reuse-caption">Caption</Label><Input id="reuse-caption" name="caption" maxLength={500} /></div>
        <div><Label htmlFor="reuse-category">Category</Label><Input id="reuse-category" name="category" maxLength={80} /></div>
        <div><Label htmlFor="reuse-order">Display order</Label><Input id="reuse-order" name="display_order" type="number" min={0} max={10000} defaultValue={0} /></div>
        <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked /> Publish immediately</label>
        <div className="md:col-span-2"><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Add selected image"}</Button></div>
      </form></CardContent></Card>}
    </div>}
  </div>;
}
