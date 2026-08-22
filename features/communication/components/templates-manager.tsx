"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  emailTemplateSchema,
  smsTemplateSchema,
  type EmailTemplateInput,
  type SmsTemplateInput,
} from "@/validations/communication";
import { createEmailTemplateAction, createSmsTemplateAction } from "@/features/communication/actions";
import type { EmailTemplate, SmsTemplate } from "@/types/communication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function TemplatesManager({
  emailTemplates,
  smsTemplates,
  canManage,
}: {
  emailTemplates: EmailTemplate[];
  smsTemplates: SmsTemplate[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);

  const emailForm = useForm<EmailTemplateInput>({ resolver: zodResolver(emailTemplateSchema) });
  const smsForm = useForm<SmsTemplateInput>({ resolver: zodResolver(smsTemplateSchema) });

  async function onSubmitEmail(values: EmailTemplateInput) {
    setEmailError(null);
    const result = await createEmailTemplateAction(values);
    if (!result.ok) { setEmailError(result.error); return; }
    emailForm.reset({ name: "", subject: "", body: "" });
    router.refresh();
  }

  async function onSubmitSms(values: SmsTemplateInput) {
    setSmsError(null);
    const result = await createSmsTemplateAction(values);
    if (!result.ok) { setSmsError(result.error); return; }
    smsForm.reset({ name: "", body: "" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Email templates</h2>
        <div className="flex flex-col gap-4">
          {canManage && (
            <Card className="max-w-2xl">
              <CardContent className="pt-5">
                <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Fee reminder" {...emailForm.register("name")} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="Fee due for {student_name}" {...emailForm.register("subject")} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="body">Body (HTML, {"{tag}"} placeholders)</Label>
                    <textarea id="body" rows={3} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" {...emailForm.register("body")} />
                  </div>
                  {emailError && <p className="text-sm text-red-600">{emailError}</p>}
                  <Button type="submit" size="sm" disabled={emailForm.formState.isSubmitting} className="self-start">
                    Add template
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
          <Table>
            <THead><TR><TH>Name</TH><TH>Subject</TH></TR></THead>
            <TBody>
              {emailTemplates.map((t) => (
                <TR key={t.id}><TD className="font-medium text-slate-900">{t.name}</TD><TD>{t.subject}</TD></TR>
              ))}
              {emailTemplates.length === 0 && (
                <TR><TD colSpan={2} className="py-6 text-center text-slate-400">No email templates.</TD></TR>
              )}
            </TBody>
          </Table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">SMS templates</h2>
        <div className="flex flex-col gap-4">
          {canManage && (
            <Card className="max-w-2xl">
              <CardContent className="pt-5">
                <form onSubmit={smsForm.handleSubmit(onSubmitSms)} className="flex items-end gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sms-name">Name</Label>
                    <Input id="sms-name" {...smsForm.register("name")} />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label htmlFor="sms-body">Body (160 chars)</Label>
                    <Input id="sms-body" {...smsForm.register("body")} />
                  </div>
                  <Button type="submit" size="sm" disabled={smsForm.formState.isSubmitting}>Add</Button>
                </form>
                {smsError && <p className="mt-2 text-sm text-red-600">{smsError}</p>}
              </CardContent>
            </Card>
          )}
          <Table>
            <THead><TR><TH>Name</TH><TH>Body</TH></TR></THead>
            <TBody>
              {smsTemplates.map((t) => (
                <TR key={t.id}><TD className="font-medium text-slate-900">{t.name}</TD><TD>{t.body}</TD></TR>
              ))}
              {smsTemplates.length === 0 && (
                <TR><TD colSpan={2} className="py-6 text-center text-slate-400">No SMS templates.</TD></TR>
              )}
            </TBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
