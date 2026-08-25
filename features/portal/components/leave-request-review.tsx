"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewLeaveRequestAction } from "@/features/portal/actions";
import type { StudentLeaveRequest } from "@/types/portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LeaveRequestReview({
  requests,
  studentNameById,
}: {
  requests: StudentLeaveRequest[];
  studentNameById: Map<string, string>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState<Record<string, string>>({});

  function decide(id: string, status: "approved" | "rejected") {
    startTransition(async () => {
      setError(null);
      const result = await reviewLeaveRequestAction({ id, status, review_note: notes[id] ?? "" });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {requests.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle>{studentNameById.get(r.student_id) ?? "Student"}</CardTitle>
            <Badge variant={r.status === "approved" ? "success" : r.status === "rejected" ? "warning" : "outline"}>{r.status}</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-slate-700">{r.from_date} → {r.to_date}</p>
            {r.reason && <p className="text-sm text-slate-600">{r.reason}</p>}
            {r.status === "submitted" && (
              <div className="flex flex-col gap-2">
                <textarea
                  placeholder="Review note (optional)"
                  value={notes[r.id] ?? ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  rows={2}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" disabled={pending} onClick={() => decide(r.id, "approved")}>Approve</Button>
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => decide(r.id, "rejected")}>Reject</Button>
                </div>
              </div>
            )}
            {r.status !== "submitted" && r.review_note && <p className="text-xs text-slate-500">Note: {r.review_note}</p>}
          </CardContent>
        </Card>
      ))}
      {requests.length === 0 && <p className="py-8 text-center text-slate-400">No leave requests.</p>}
    </div>
  );
}
