import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listEmailTemplates, listSmsTemplates } from "@/features/communication/service";
import { TemplatesManager } from "@/features/communication/components/templates-manager";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const [emailTemplates, smsTemplates, canManage] = await Promise.all([
    listEmailTemplates(supabase),
    listSmsTemplates(supabase),
    hasPermission("communication.manage_templates"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Templates</h1>
      </div>
      <TemplatesManager emailTemplates={emailTemplates} smsTemplates={smsTemplates} canManage={canManage} />
    </div>
  );
}
