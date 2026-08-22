import type { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "./repository";
import type { LeaveRequestInput, MarkStaffAttendanceInput, StaffInput } from "@/validations/staff";

export const listStaff = repo.listStaff;
export const listActiveStaff = repo.listActiveStaff;
export const getStaff = repo.getStaff;
export const listLeaveRequests = repo.listLeaveRequests;
export const listStaffAttendanceForDate = repo.listStaffAttendanceForDate;

export async function createStaff(supabase: SupabaseClient, input: StaffInput) {
  return repo.insertStaff(supabase, {
    first_name: input.first_name,
    last_name: input.last_name,
    father_name: input.father_name || null,
    mother_name: input.mother_name || null,
    email: input.email,
    phone: input.phone,
    emergency_contact: input.emergency_contact || null,
    gender: input.gender,
    dob: input.dob,
    date_of_joining: input.date_of_joining,
    qualification: input.qualification || null,
    work_experience: null,
    designation: input.designation || null,
    department: input.department || null,
    basic_salary: input.basic_salary,
    blood_group: input.blood_group || null,
    address: input.address || null,
  });
}

export async function createLeaveRequest(supabase: SupabaseClient, input: LeaveRequestInput) {
  return repo.insertLeaveRequest(supabase, {
    staff_id: input.staff_id,
    leave_type: input.leave_type,
    start_date: input.start_date,
    end_date: input.end_date,
    reason: input.reason || null,
  });
}

export const decideLeaveRequest = repo.decideLeaveRequest;

export async function markStaffAttendance(
  supabase: SupabaseClient,
  input: MarkStaffAttendanceInput,
) {
  await repo.upsertStaffAttendance(
    supabase,
    input.entries.map((e) => ({
      staff_id: e.staff_id,
      attendance_date: input.attendance_date,
      status: e.status,
    })),
  );
}
