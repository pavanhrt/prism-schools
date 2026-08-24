"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { transitionAlertAction } from "../actions";

export function AlertActions({ alertId, status }: { alertId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function transition(next: "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED") {
    startTransition(async () => {
      setError(null);
      const result = await transitionAlertAction({ alertId, status: next });
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {status === "OPEN" && <Button size="sm" variant="outline" disabled={pending} onClick={() => transition("ACKNOWLEDGED")}>Acknowledge</Button>}
      {(status === "OPEN" || status === "ACKNOWLEDGED") && <Button size="sm" variant="outline" disabled={pending} onClick={() => transition("RESOLVED")}>Resolve</Button>}
      {(status === "OPEN" || status === "ACKNOWLEDGED") && <Button size="sm" variant="ghost" disabled={pending} onClick={() => transition("DISMISSED")}>Dismiss</Button>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
