export type GuardianRelationship = "father" | "mother" | "guardian";

export interface Guardian {
  id: string;
  user_id: string | null;
  full_name: string;
  relationship: GuardianRelationship;
  phone: string;
  email: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface StudentGuardian {
  student_id: string;
  guardian_id: string;
  is_primary: boolean;
  created_at: string;
}
