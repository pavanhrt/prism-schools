import { createClient } from "@/lib/supabase/server";
import { listAcademicYears } from "@/features/academics/repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const years = await listAcademicYears(supabase);
  const current = years.find((y) => y.is_current);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Phase 1 — auth, RBAC, and academic setup are live. Other modules land in
          later phases per the roadmap.
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Current academic year</CardTitle>
        </CardHeader>
        <CardContent>
          {current ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-slate-900">
                {current.year_label}
              </span>
              <Badge variant="success">current</Badge>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No academic year is marked current yet — set one from{" "}
              <span className="font-medium">Academic Years</span>.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
