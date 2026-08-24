"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertCalendarOverrideAction } from "../actions";

export function CalendarOverrideForm({ academicYearId }: { academicYearId: string }) {
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState("holiday");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="grid gap-3 sm:grid-cols-[160px_160px_1fr_auto] sm:items-end">
      <label className="text-xs font-medium text-slate-600">Date<Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1" /></label>
      <label className="text-xs font-medium text-slate-600">Override<select value={kind} onChange={(event) => setKind(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm"><option value="holiday">Non-working day</option><option value="working">Working day</option></select></label>
      <label className="text-xs font-medium text-slate-600">Label<Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="School holiday" className="mt-1" /></label>
      <Button disabled={pending || !date || label.trim().length < 2} onClick={() => startTransition(async () => {
        setFeedback(null);
        const result = await upsertCalendarOverrideAction({ academicYearId, calendarDate: date, isWorkingDay: kind === "working", label });
        setFeedback({ ok: result.ok, text: result.ok ? result.message ?? "Saved." : result.error });
      })}>{pending ? "Saving…" : "Save override"}</Button>
      {feedback && <p className={`text-xs sm:col-span-4 ${feedback.ok ? "text-emerald-700" : "text-red-600"}`}>{feedback.text}</p>}
    </div>
  );
}
