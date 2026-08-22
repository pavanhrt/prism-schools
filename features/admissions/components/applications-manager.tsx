"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  admitApplicationAction,
  decideApplicationAction,
} from "@/features/admissions/actions";
import type { Application } from "@/types/admissions";
import type { SchoolClass, Section } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "outline"> = {
  submitted: "outline",
  under_review: "warning",
  approved: "success",
  rejected: "default",
};

export function ApplicationsManager({
  initialApplications: applications,
  classes,
  sections,
  canEdit,
  canAdmit,
}: {
  initialApplications: Application[];
  classes: SchoolClass[];
  sections: Section[];
  canEdit: boolean;
  canAdmit: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const classById = new Map(classes.map((c) => [c.id, c.name]));

  return (
    <Table>
      <THead>
        <TR>
          <TH>Applicant</TH>
          <TH>Class applying</TH>
          <TH>Status</TH>
          <TH></TH>
        </TR>
      </THead>
      <TBody>
        {applications.map((app) => (
          <Fragment key={app.id}>
            <TR>
              <TD className="font-medium text-slate-900">
                {app.first_name} {app.last_name}
              </TD>
              <TD>{classById.get(app.class_applying_id) ?? "—"}</TD>
              <TD>
                <Badge variant={STATUS_VARIANT[app.status]}>{app.status.replace("_", " ")}</Badge>
                {app.student_id && <Badge variant="success" className="ml-2">admitted</Badge>}
              </TD>
              <TD>
                <div className="flex justify-end gap-2">
                  {app.student_id ? (
                    <Link
                      href={`/admin/students/${app.student_id}`}
                      className="text-sm text-slate-600 underline"
                    >
                      View student
                    </Link>
                  ) : (
                    (canEdit || canAdmit) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                      >
                        {expanded === app.id ? "Hide" : "Review"}
                      </Button>
                    )
                  )}
                </div>
              </TD>
            </TR>
            {expanded === app.id && !app.student_id && (
              <TR>
                <TD colSpan={4} className="bg-slate-50">
                  <ReviewPanel
                    application={app}
                    sections={sections.filter((s) => s.class_id === app.class_applying_id)}
                    canEdit={canEdit}
                    canAdmit={canAdmit}
                  />
                </TD>
              </TR>
            )}
          </Fragment>
        ))}
        {applications.length === 0 && (
          <TR>
            <TD colSpan={4} className="py-8 text-center text-slate-400">
              No applications yet.
            </TD>
          </TR>
        )}
      </TBody>
    </Table>
  );
}

function ReviewPanel({
  application,
  sections,
  canEdit,
  canAdmit,
}: {
  application: Application;
  sections: Section[];
  canEdit: boolean;
  canAdmit: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const decisionForm = useForm<{ decision_notes: string }>();
  const admitForm = useForm<{ section_id: string; roll_no: string }>();

  async function decide(status: "under_review" | "approved" | "rejected") {
    setError(null);
    setBusy(true);
    const notes = decisionForm.getValues("decision_notes");
    const result = await decideApplicationAction(application.id, {
      status,
      decision_notes: notes,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function onAdmit(values: { section_id: string; roll_no: string }) {
    setError(null);
    const result = await admitApplicationAction(application.id, {
      section_id: values.section_id,
      roll_no: values.roll_no,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 py-3">
      <div className="text-sm text-slate-600">
        <p>{application.phone} · {application.email || "no email"}</p>
        {application.previous_school && <p>Previously: {application.previous_school}</p>}
      </div>

      {canEdit && application.status !== "approved" && (
        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`notes-${application.id}`}>Decision notes</Label>
            <Input id={`notes-${application.id}`} {...decisionForm.register("decision_notes")} />
          </div>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => decide("under_review")}>
            Mark under review
          </Button>
          <Button size="sm" disabled={busy} onClick={() => decide("approved")}>
            Approve
          </Button>
          <Button size="sm" variant="destructive" disabled={busy} onClick={() => decide("rejected")}>
            Reject
          </Button>
        </div>
      )}

      {canAdmit && application.status === "approved" && (
        <form
          onSubmit={admitForm.handleSubmit(onAdmit)}
          className="flex items-end gap-2 border-t border-slate-200 pt-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`section-${application.id}`}>Section</Label>
            <select
              id={`section-${application.id}`}
              className="h-9 w-40 rounded-md border border-slate-300 bg-white px-3 text-sm"
              {...admitForm.register("section_id", { required: true })}
            >
              <option value="">Choose a section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`roll-${application.id}`}>Roll no</Label>
            <Input id={`roll-${application.id}`} className="w-28" {...admitForm.register("roll_no")} />
          </div>
          <Button type="submit" size="sm" disabled={admitForm.formState.isSubmitting}>
            Admit
          </Button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
