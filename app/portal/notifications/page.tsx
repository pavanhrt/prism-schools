import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/permissions";
import { listPortalNotifications } from "@/features/portal/service";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/features/portal/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CATEGORY_LABEL: Record<string, string> = {
  ATTENDANCE: "Attendance",
  EXAM: "Exam",
  RESULT: "Result",
  FEE: "Fee",
  ANNOUNCEMENT: "Announcement",
  LEAVE_REQUEST: "Leave request",
};

async function markAllReadFormAction() {
  "use server";
  await markAllNotificationsReadAction();
}

async function markReadFormAction(id: string) {
  "use server";
  await markNotificationReadAction(id);
}

export default async function PortalNotificationsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const notifications = await listPortalNotifications(supabase, user.id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Notifications</h1>
        <form action={markAllReadFormAction}>
          <Button variant="outline" size="sm" type="submit">Mark all read</Button>
        </form>
      </div>

      <div className="flex flex-col gap-2">
        {notifications.map((n) => (
          <Card key={n.id} className={n.is_read ? "opacity-60" : ""}>
            <CardContent className="flex flex-col gap-1 py-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline">{CATEGORY_LABEL[n.category] ?? n.category}</Badge>
                <span className="text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm font-medium text-slate-900">{n.title}</p>
              <p className="text-sm text-slate-600">{n.message}</p>
              {!n.is_read && (
                <form action={markReadFormAction.bind(null, n.id)} className="self-end">
                  <button type="submit" className="text-xs font-medium text-slate-500 hover:text-slate-900">
                    Mark read
                  </button>
                </form>
              )}
            </CardContent>
          </Card>
        ))}
        {notifications.length === 0 && <p className="py-8 text-center text-slate-400">No notifications yet.</p>}
      </div>
    </div>
  );
}
