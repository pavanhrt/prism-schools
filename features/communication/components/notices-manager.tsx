"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { noticeSchema, type NoticeInput } from "@/validations/communication";
import { createNoticeAction } from "@/features/communication/actions";
import type { Notice } from "@/types/communication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NoticesManager({
  initialNotices: notices,
  canCreate,
}: {
  initialNotices: Notice[];
  canCreate: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NoticeInput>({
    resolver: zodResolver(noticeSchema),
    defaultValues: { target_role: "all" },
  });

  async function onSubmit(values: NoticeInput) {
    setError(null);
    const result = await createNoticeAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ title: "", message: "", target_role: "all", expiry_date: "" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {canCreate && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Post notice</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...register("title")} />
                {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="message">Message</Label>
                <textarea id="message" rows={3} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" {...register("message")} />
                {errors.message && <p className="text-xs text-red-600">{errors.message.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="target_role">Audience</Label>
                  <select id="target_role" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("target_role")}>
                    <option value="all">Everyone</option>
                    <option value="school_admin">Admins</option>
                    <option value="teacher">Teachers</option>
                    <option value="accountant">Accountants</option>
                    <option value="receptionist">Receptionists</option>
                    <option value="student">Students</option>
                    <option value="parent">Parents</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="expiry_date">Expires (optional)</Label>
                  <Input id="expiry_date" type="date" {...register("expiry_date")} />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Posting…" : "Post notice"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {notices.map((n) => (
          <Card key={n.id}>
            <CardHeader>
              <CardTitle>{n.title}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">{n.target_role === "all" ? "everyone" : n.target_role}</Badge>
                <Badge variant={n.status === "active" ? "success" : "outline"}>{n.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">{n.message}</p>
              {n.expiry_date && <p className="mt-1 text-xs text-slate-400">Expires {n.expiry_date}</p>}
            </CardContent>
          </Card>
        ))}
        {notices.length === 0 && <p className="py-8 text-center text-slate-400">No notices yet.</p>}
      </div>
    </div>
  );
}
