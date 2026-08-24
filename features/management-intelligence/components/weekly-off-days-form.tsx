"use client";

import { useState, useTransition } from "react";
import { setWeeklyOffDayAction } from "../actions";

const DAYS = [
  [0, "Sunday"],
  [1, "Monday"],
  [2, "Tuesday"],
  [3, "Wednesday"],
  [4, "Thursday"],
  [5, "Friday"],
  [6, "Saturday"],
] as const;

export function WeeklyOffDaysForm({ initialDays }: { initialDays: number[] }) {
  const [days, setDays] = useState(() => new Set(initialDays));
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function toggle(day: number, enabled: boolean) {
    const previous = new Set(days);
    const next = new Set(days);
    if (enabled) next.add(day);
    else next.delete(day);
    setDays(next);
    setFeedback(null);
    startTransition(async () => {
      const result = await setWeeklyOffDayAction({ dayOfWeek: day, enabled });
      if (!result.ok) {
        setDays(previous);
        setFeedback(result.error);
      } else {
        setFeedback(`${DAYS.find(([value]) => value === day)?.[1]} updated.`);
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Checked days are recurring non-working days. Any date-specific override takes precedence.</p>
      <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {DAYS.map(([day, label]) => (
          <label key={day} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={days.has(day)}
              disabled={pending}
              onChange={(event) => toggle(day, event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            {label}
          </label>
        ))}
      </div>
      {feedback && <p className={feedback.includes("Could not") || feedback.includes("Forbidden") ? "text-xs text-red-600" : "text-xs text-emerald-700"}>{feedback}</p>}
    </div>
  );
}
