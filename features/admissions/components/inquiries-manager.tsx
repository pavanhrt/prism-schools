"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inquirySchema, type InquiryInput } from "@/validations/admissions";
import { createInquiryAction, addFollowupAction } from "@/features/admissions/actions";
import type { AdmissionInquiry, InquiryFollowup } from "@/types/admissions";
import type { AcademicYear, SchoolClass } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "outline"> = {
  pending: "warning",
  followed_up: "outline",
  converted: "success",
  closed: "default",
};

export function InquiriesManager({
  initialInquiries: inquiries,
  classes,
  academicYears,
  followupsByInquiry,
  canCreate,
  canEdit,
}: {
  initialInquiries: AdmissionInquiry[];
  classes: SchoolClass[];
  academicYears: AcademicYear[];
  followupsByInquiry: Record<string, InquiryFollowup[]>;
  canCreate: boolean;
  canEdit: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const router = useRouter();
  const classById = new Map(classes.map((c) => [c.id, c.name]));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { source: "walk_in" },
  });

  async function onSubmit(values: InquiryInput) {
    setError(null);
    const result = await createInquiryAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ student_name: "", parent_name: "", phone: "", email: "", message: "", source: "walk_in" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {canCreate && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>New inquiry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="student_name">Student name</Label>
                  <Input id="student_name" {...register("student_name")} />
                  {errors.student_name && (
                    <p className="text-xs text-red-600">{errors.student_name.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="parent_name">Parent/guardian name</Label>
                  <Input id="parent_name" {...register("parent_name")} />
                  {errors.parent_name && (
                    <p className="text-xs text-red-600">{errors.parent_name.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...register("phone")} />
                  {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="class_requested_id">Class requested</Label>
                  <select
                    id="class_requested_id"
                    className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                    {...register("class_requested_id")}
                  >
                    <option value="">Not specified</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="academic_year_id">Academic year</Label>
                  <select
                    id="academic_year_id"
                    className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                    {...register("academic_year_id")}
                  >
                    <option value="">Not specified</option>
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>{y.year_label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="source">Source</Label>
                  <select
                    id="source"
                    className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                    {...register("source")}
                  >
                    <option value="walk_in">Walk-in</option>
                    <option value="phone">Phone</option>
                    <option value="web">Web</option>
                    <option value="referral">Referral</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  rows={2}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  {...register("message")}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Adding…" : "Add inquiry"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <THead>
          <TR>
            <TH>Student</TH>
            <TH>Parent</TH>
            <TH>Phone</TH>
            <TH>Class requested</TH>
            <TH>Status</TH>
            <TH></TH>
          </TR>
        </THead>
        <TBody>
          {inquiries.map((inquiry) => (
            <Fragment key={inquiry.id}>
              <TR>
                <TD className="font-medium text-slate-900">{inquiry.student_name}</TD>
                <TD>{inquiry.parent_name}</TD>
                <TD>{inquiry.phone}</TD>
                <TD>{inquiry.class_requested_id ? classById.get(inquiry.class_requested_id) : "—"}</TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[inquiry.status]}>{inquiry.status}</Badge>
                </TD>
                <TD>
                  <div className="flex justify-end gap-2">
                    {canEdit && inquiry.status !== "closed" && inquiry.status !== "converted" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpanded(expanded === inquiry.id ? null : inquiry.id)}
                      >
                        {expanded === inquiry.id ? "Hide" : "Follow up"}
                      </Button>
                    )}
                    {canCreate && inquiry.status !== "converted" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          router.push(`/admin/admissions/applications/new?inquiry_id=${inquiry.id}`);
                        }}
                      >
                        Create application
                      </Button>
                    )}
                  </div>
                </TD>
              </TR>
              {expanded === inquiry.id && (
                <TR>
                  <TD colSpan={6} className="bg-slate-50">
                    <FollowupPanel
                      inquiryId={inquiry.id}
                      followups={followupsByInquiry[inquiry.id] ?? []}
                    />
                  </TD>
                </TR>
              )}
            </Fragment>
          ))}
          {inquiries.length === 0 && (
            <TR>
              <TD colSpan={6} className="py-8 text-center text-slate-400">
                No inquiries yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}

function FollowupPanel({
  inquiryId,
  followups,
}: {
  inquiryId: string;
  followups: InquiryFollowup[];
}) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{
    notes: string;
    followup_date: string;
  }>();

  async function onSubmit(values: { notes: string; followup_date: string }) {
    setError(null);
    const result = await addFollowupAction({
      inquiry_id: inquiryId,
      notes: values.notes,
      followup_date: values.followup_date,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({ notes: "", followup_date: "" });
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="flex flex-col gap-2">
        {followups.length === 0 && (
          <p className="text-xs text-slate-400">No followups logged yet.</p>
        )}
        {followups.map((f) => (
          <div key={f.id} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
            <p className="text-slate-700">{f.notes}</p>
            <p className="mt-1 text-xs text-slate-400">
              {f.followup_date ?? new Date(f.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={`notes-${inquiryId}`}>Add followup note</Label>
          <Input id={`notes-${inquiryId}`} {...register("notes", { required: true })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`date-${inquiryId}`}>Date</Label>
          <Input id={`date-${inquiryId}`} type="date" {...register("followup_date")} />
        </div>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Add"}
        </Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
