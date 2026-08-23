"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPrivatePhotoSignedUrlAction, uploadStaffPhotoAction, uploadStudentPhotoAction } from "@/features/media/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PrivatePhotoManager({ domain, id, path, canEdit }: { domain: "students" | "staff"; id: string; path: string | null; canEdit: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useEffect(() => { if (!path) return; void createPrivatePhotoSignedUrlAction(domain, path).then((result) => { if (result.ok) setUrl(result.url); }); }, [domain, path]);
  function submit(data: FormData) { startTransition(async () => { const result = domain === "students" ? await uploadStudentPhotoAction(id, data) : await uploadStaffPhotoAction(id, data); setMessage(result.ok ? "Private photo saved." : result.error); if (result.ok) router.refresh(); }); }
  return <div className="flex flex-col gap-3">
    {url ? <div className="relative h-44 w-44 overflow-hidden rounded-xl bg-slate-100"><Image src={url} alt="Private profile photo" fill sizes="11rem" className="object-cover" unoptimized /></div> : <div className="flex h-44 w-44 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500">No photo</div>}
    {canEdit && <form action={submit} className="flex max-w-sm flex-col gap-2"><Input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required /><Button type="submit" size="sm" disabled={pending}>{pending ? "Uploading…" : path ? "Replace private photo" : "Upload private photo"}</Button></form>}
    {message && <p aria-live="polite" className="text-xs text-slate-600">{message}</p>}
  </div>;
}
