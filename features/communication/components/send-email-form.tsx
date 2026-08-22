"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendEmailSchema, type SendEmailInput } from "@/validations/communication";
import { sendEmailAction } from "@/features/communication/actions";
import type { EmailLog, EmailTemplate } from "@/types/communication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function SendEmailForm({
  templates,
  logs,
}: {
  templates: EmailTemplate[];
  logs: EmailLog[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SendEmailInput>({ resolver: zodResolver(sendEmailSchema) });

  async function onSubmit(values: SendEmailInput) {
    setError(null);
    setNotice(null);
    const result = await sendEmailAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice("Sent.");
    reset({ template_id: "", recipient_email: "", recipient_group: "", variables_json: "" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Send email</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="template_id">Template</Label>
                <select id="template_id" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("template_id")}>
                  <option value="">Choose</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {errors.template_id && <p className="text-xs text-red-600">{errors.template_id.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recipient_email">Recipient</Label>
                <Input id="recipient_email" type="email" {...register("recipient_email")} />
                {errors.recipient_email && <p className="text-xs text-red-600">{errors.recipient_email.message}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="variables_json">Variables (JSON, optional)</Label>
              <Input id="variables_json" placeholder='{"student_name":"Asha"}' {...register("variables_json")} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {notice && <p className="text-sm text-emerald-600">{notice}</p>}
            <Button type="submit" disabled={isSubmitting} className="self-start">
              {isSubmitting ? "Sending…" : "Send"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Table>
        <THead>
          <TR><TH>Sent</TH><TH>Recipient</TH><TH>Subject</TH><TH>Status</TH></TR>
        </THead>
        <TBody>
          {logs.map((l) => (
            <TR key={l.id}>
              <TD>{new Date(l.created_at).toLocaleString()}</TD>
              <TD>{l.recipient_email}</TD>
              <TD>{l.subject}</TD>
              <TD>
                <Badge variant={l.status === "sent" ? "success" : l.status === "failed" ? "warning" : "outline"}>
                  {l.status}
                </Badge>
                {l.error && <span className="ml-2 text-xs text-slate-400">{l.error}</span>}
              </TD>
            </TR>
          ))}
          {logs.length === 0 && (
            <TR><TD colSpan={4} className="py-8 text-center text-slate-400">No emails sent yet.</TD></TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
