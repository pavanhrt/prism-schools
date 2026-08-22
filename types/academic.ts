// Hand-written to match supabase/migrations/0002_academic_setup.sql exactly.
// Swap for `supabase gen types typescript` output once a project is linked
// (§28.1) — the shape won't change, this just becomes generated.

export interface AcademicYear {
  id: string;
  year_label: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface SchoolClass {
  id: string;
  name: string;
  sequence: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Section {
  id: string;
  class_id: string;
  name: string;
  capacity: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type SubjectType = "theory" | "practical" | "both";

export interface Subject {
  id: string;
  class_id: string;
  name: string;
  code: string | null;
  subject_type: SubjectType;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}
