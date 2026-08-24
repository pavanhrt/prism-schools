import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
      </CardContent>
    </Card>
  );
}
