"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removePublicMediaAction, reusePublicMediaAction, uploadPublicMediaAction } from "@/features/media/actions";
import { PublicMediaLibraryBrowser } from "@/features/media/components/public-media-library";
import type { PublicMediaAsset } from "@/types/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MediaUpload({ category, entityId = null, current, label }: { category: string; entityId?: string | null; current: string | null; label: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function submit(data: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await uploadPublicMediaAction(category, entityId, data);
      setMessage(result.ok ? "Uploaded and saved." : result.error);
      if (result.ok) router.refresh();
    });
  }
  function remove() {
    if (!window.confirm("Remove this media reference? This permanently deletes the file when it is a managed upload.")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await removePublicMediaAction(category, entityId);
      setMessage(result.ok ? "Removed successfully." : result.error);
      if (result.ok || (!result.ok && result.referenceCleared)) router.refresh();
    });
  }
  function reuse(asset: PublicMediaAsset) {
    startTransition(async () => {
      const result = await reusePublicMediaAction({ path: asset.path, category, entityId });
      setMessage(result.ok ? "Existing image selected and saved." : result.error);
      if (result.ok) { setShowLibrary(false); router.refresh(); }
    });
  }
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <Label>{label}</Label>
    {current && <div className="relative mt-3 h-28 w-full overflow-hidden rounded-md bg-white"><Image src={current} alt={`Current ${label.toLowerCase()}`} fill sizes="20rem" className="object-contain" unoptimized={category === "branding-favicon"} /></div>}
    <form action={submit} className="mt-3 flex flex-col gap-2">
      <Input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/x-icon,image/vnd.microsoft.icon" required />
      <Button type="submit" size="sm" disabled={pending}>{pending ? "Uploading…" : current ? "Upload replacement" : "Upload image"}</Button>
    </form>
    <Button type="button" size="sm" variant="outline" className="mt-2" disabled={pending} onClick={() => setShowLibrary((value) => !value)}>{showLibrary ? "Close media library" : "Choose existing image"}</Button>
    {current && <Button type="button" size="sm" variant="outline" className="mt-2" disabled={pending} onClick={remove}>{pending ? "Working…" : "Remove"}</Button>}
    {message && <p aria-live="polite" className={`mt-2 text-xs ${message.includes("saved") || message === "Removed successfully." ? "text-emerald-700" : "text-red-600"}`}>{message}</p>}
    {showLibrary && <div className="mt-4"><PublicMediaLibraryBrowser canManage={false} onSelect={reuse} /></div>}
  </div>;
}
