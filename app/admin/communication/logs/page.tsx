import { createClient } from "@/lib/supabase/server";
import { listEmailLogs, listEmailTemplates } from "@/features/communication/service";
import { SendEmailForm } from "@/features/communication/components/send-email-form";

export default async function CommunicationLogsPage() {
  const supabase = await createClient();
  const [templates, logs] = await Promise.all([
    listEmailTemplates(supabase),
    listEmailLogs(supabase),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Send Email</h1>
        <p className="text-sm text-slate-500">
          Every attempt is logged, success or failure — nothing is a silent no-op.
        </p>
      </div>
      <SendEmailForm templates={templates} logs={logs} />
    </div>
  );
}
