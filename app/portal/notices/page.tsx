import { createClient } from "@/lib/supabase/server";
import { listNotices } from "@/features/communication/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PortalNoticesPage() {
  const supabase = await createClient();
  const notices = await listNotices(supabase);
  const relevant = notices.filter(
    (n) => n.status === "active" && (n.target_role === "all" || n.target_role === "student" || n.target_role === "parent"),
  );

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold text-slate-900">Notices</h1>
      <div className="flex flex-col gap-3">
        {relevant.map((n) => (
          <Card key={n.id}>
            <CardHeader>
              <CardTitle>{n.title}</CardTitle>
              <Badge variant="outline">{new Date(n.created_at).toLocaleDateString()}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">{n.message}</p>
            </CardContent>
          </Card>
        ))}
        {relevant.length === 0 && <p className="py-8 text-center text-slate-400">No notices right now.</p>}
      </div>
    </div>
  );
}
