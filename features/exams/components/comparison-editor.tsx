"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateExamComparisonAction } from "@/features/exams/actions";
import type { Exam } from "@/types/exams";

export function ComparisonEditor({ exam, canEdit }: { exam: Exam; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [group, setGroup] = useState(exam.comparison_group ?? "");
  const [sequence, setSequence] = useState(exam.sequence_no ? String(exam.sequence_no) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">
          {exam.comparison_group ? `${exam.comparison_group} · #${exam.sequence_no ?? "—"}` : <span className="text-slate-400">Not comparable</span>}
        </span>
        {canEdit && (
          <button type="button" className="text-xs text-slate-500 underline" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Comparison group" className="h-8 w-36 text-xs" disabled={pending} />
        <Input value={sequence} onChange={(e) => setSequence(e.target.value)} placeholder="Seq" type="number" min={1} step={1} className="h-8 w-16 text-xs" disabled={pending} />
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await updateExamComparisonAction({ id: exam.id, comparison_group: group, sequence_no: sequence });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setEditing(false);
              router.refresh();
            })
          }
        >
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
