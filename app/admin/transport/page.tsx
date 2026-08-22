import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listAllocations, listRoutes, listStops, listVehicles } from "@/features/transport/service";
import { listStudents } from "@/features/students/service";
import { listAcademicYears } from "@/features/academics/repository";
import { TransportManager } from "@/features/transport/components/transport-manager";

export default async function TransportPage() {
  const supabase = await createClient();
  const [vehicles, routes, stops, allocations, students, academicYears, canManage] = await Promise.all([
    listVehicles(supabase),
    listRoutes(supabase),
    listStops(supabase),
    listAllocations(supabase),
    listStudents(supabase),
    listAcademicYears(supabase),
    hasPermission("transport.manage"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Transport</h1>
      </div>
      <TransportManager
        vehicles={vehicles}
        routes={routes}
        stops={stops}
        allocations={allocations}
        students={students}
        academicYears={academicYears}
        canManage={canManage}
      />
    </div>
  );
}
