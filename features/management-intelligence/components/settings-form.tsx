"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateSettingAction } from "../actions";

export function SettingEditor({ settingKey, label, value, suffix }: { settingKey: string; label: string; value: number; suffix: string }) {
  const [nextValue, setNextValue] = useState(String(value));
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-3 border-b border-slate-100 py-4 last:border-0 sm:grid-cols-[1fr_180px_auto] sm:items-center">
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{suffix}</p>
      </div>
      <Input type="number" min="0" step="0.01" value={nextValue} onChange={(event) => setNextValue(event.target.value)} disabled={pending} />
      <Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(async () => {
        setMessage(null);
        setError(null);
        const result = await updateSettingAction({ settingKey: settingKey as never, numericValue: Number(nextValue) });
        if (result.ok) setMessage(result.message ?? "Saved.");
        else setError(result.error);
      })}>{pending ? "Saving…" : "Save"}</Button>
      {(message || error) && <p className={`text-xs sm:col-start-2 sm:col-span-2 ${error ? "text-red-600" : "text-emerald-700"}`}>{error ?? message}</p>}
    </div>
  );
}
