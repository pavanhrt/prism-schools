import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listAllFollowups, listInquiries } from "@/features/admissions/service";
import { listClasses, listAcademicYears } from "@/features/academics/repository";
import { InquiriesManager } from "@/features/admissions/components/inquiries-manager";
import type { InquiryFollowup } from "@/types/admissions";

export default async function InquiriesPage() {
  const supabase = await createClient();
  const [inquiries, classes, academicYears, followups, canCreate, canEdit] =
    await Promise.all([
      listInquiries(supabase),
      listClasses(supabase),
      listAcademicYears(supabase),
      listAllFollowups(supabase),
      hasPermission("admissions.create"),
      hasPermission("admissions.edit"),
    ]);

  const followupsByInquiry: Record<string, InquiryFollowup[]> = {};
  for (const f of followups) {
    (followupsByInquiry[f.inquiry_id] ??= []).push(f);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Admissions — Inquiries</h1>
        <p className="text-sm text-slate-500">
          Stage 1 of the funnel: Inquiry → Followup → Application → Admission.
        </p>
      </div>
      <InquiriesManager
        initialInquiries={inquiries}
        classes={classes}
        academicYears={academicYears}
        followupsByInquiry={followupsByInquiry}
        canCreate={canCreate}
        canEdit={canEdit}
      />
    </div>
  );
}
