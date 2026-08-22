import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import type { NewApplication, NewInquiry } from "./repository";
import * as studentsService from "@/features/students/service";
import type { ApplicationDecisionInput } from "@/validations/admissions";

export const listInquiries = repo.listInquiries;
export const getInquiry = repo.getInquiry;
export const listFollowups = repo.listFollowups;
export const listAllFollowups = repo.listAllFollowups;
export const listApplications = repo.listApplications;
export const getApplication = repo.getApplication;

export async function createInquiry(supabase: SupabaseClient, input: NewInquiry) {
  return repo.insertInquiry(supabase, input);
}

/** Logging a followup also moves a still-"pending" inquiry to "followed_up" —
 * the funnel status should reflect that someone has actually engaged. */
export async function addFollowup(
  supabase: SupabaseClient,
  inquiryId: string,
  input: { notes: string; followup_date: string | null },
) {
  const followup = await repo.insertFollowup(supabase, {
    inquiry_id: inquiryId,
    ...input,
  });
  await repo.updateInquiryStatus(supabase, inquiryId, "followed_up");
  return followup;
}

/** Submitting an application converts the inquiry — it has done its job as
 * a lead and now becomes a formal application record. */
export async function createApplication(
  supabase: SupabaseClient,
  input: NewApplication,
) {
  const application = await repo.insertApplication(supabase, input);
  await repo.updateInquiryStatus(supabase, input.inquiry_id, "converted");
  return application;
}

export async function decideApplication(
  supabase: SupabaseClient,
  applicationId: string,
  decision: ApplicationDecisionInput,
) {
  await repo.updateApplicationDecision(supabase, applicationId, {
    status: decision.status,
    decision_notes: decision.decision_notes || null,
  });
}

/**
 * The actual "Admission" step of Inquiry -> Followup -> Application ->
 * Admission: turns an approved application into a real student record.
 * Depends on features/students, never the other way — Admissions feeds
 * Students, matching the blueprint's module dependency graph (§5).
 */
export async function admitApplication(
  supabase: SupabaseClient,
  applicationId: string,
  placement: { section_id: string; roll_no: string | null },
) {
  const application = await repo.getApplication(supabase, applicationId);
  if (!application) {
    throw new Error("Application not found.");
  }
  if (application.status !== "approved") {
    throw new Error("Only an approved application can be admitted.");
  }
  if (application.student_id) {
    throw new Error("This application has already been admitted.");
  }

  const { student } = await studentsService.admitNewStudent(
    supabase,
    {
      first_name: application.first_name,
      last_name: application.last_name,
      dob: application.dob,
      gender: application.gender,
      blood_group: application.blood_group,
      religion: null,
      email: application.email,
      phone: application.phone,
      father_name: application.father_name,
      mother_name: application.mother_name,
      guardian_phone: application.guardian_phone,
      address: application.address,
      previous_school: application.previous_school,
      photo_url: null,
    },
    {
      academic_year_id: application.academic_year_id,
      class_id: application.class_applying_id,
      section_id: placement.section_id,
      roll_no: placement.roll_no,
    },
  );

  await repo.markApplicationAdmitted(supabase, applicationId, student.id);
  return student;
}
