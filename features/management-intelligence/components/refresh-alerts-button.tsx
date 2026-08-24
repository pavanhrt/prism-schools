"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { refreshAttendanceAlertsAction } from "../actions";

export function RefreshAlertsButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => {
          setError(null);
          setMessage(null);
          const result = await refreshAttendanceAlertsAction();
          if (result.ok) setMessage(result.message ?? "Alerts refreshed.");
          else setError(result.error);
        })}
      >
        {pending ? "Evaluating…" : "Evaluate attendance rules"}
      </Button>
      {message && <span className="text-sm text-emerald-700">{message}</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
