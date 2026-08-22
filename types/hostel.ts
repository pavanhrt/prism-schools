export type HostelType = "boys" | "girls" | "staff" | "common";

export interface Hostel {
  id: string;
  name: string;
  type: HostelType;
  address: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface HostelRoom {
  id: string;
  hostel_id: string;
  room_no: string;
  room_type: string | null;
  capacity: number;
  cost_per_bed: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type HostelAllocationStatus = "active" | "vacated";

export interface HostelAllocation {
  id: string;
  room_id: string;
  student_id: string;
  allocated_date: string;
  vacated_date: string | null;
  status: HostelAllocationStatus;
  created_at: string;
  created_by: string | null;
}
