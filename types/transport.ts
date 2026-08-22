export interface Vehicle {
  id: string;
  vehicle_no: string;
  model: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  capacity: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface TransportRoute {
  id: string;
  route_name: string;
  vehicle_id: string | null;
  fare: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface TransportStop {
  id: string;
  route_id: string;
  stop_name: string;
  sequence: number;
  pickup_time: string | null;
  created_at: string;
}

export type StudentTransportStatus = "active" | "inactive";

export interface StudentTransport {
  id: string;
  student_id: string;
  route_id: string;
  stop_id: string | null;
  academic_year_id: string;
  status: StudentTransportStatus;
  created_at: string;
  created_by: string | null;
}
