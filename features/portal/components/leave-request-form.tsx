"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitLeaveRequestAction } from "@/features/portal/actions";
import { Button } from "@/components/ui/button";

export function LeaveRequestForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await submitLeaveRequestAction({ student_id: studentId, from_date: fromDate, to_date: toDate, reason });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFromDate("");
    setToDate("");
    setReason("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="from_date" className="text-xs text-slate-500">From</label>
          <input
            id="from_date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            required
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="to_date" className="text-xs text-slate-500">To</label>
          <input
            id="to_date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            required
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="reason" className="text-xs text-slate-500">Reason (optional)</label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting} size="sm" className="self-start">
        {submitting ? "Submitting…" : "Submit request"}
      </Button>
    </form>
  );
}
