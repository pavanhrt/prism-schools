import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listAllocations, listHostels, listRooms } from "@/features/hostel/service";
import { listStudents } from "@/features/students/service";
import { HostelManager } from "@/features/hostel/components/hostel-manager";

export default async function HostelPage() {
  const supabase = await createClient();
  const [hostels, rooms, allocations, students, canManage] = await Promise.all([
    listHostels(supabase),
    listRooms(supabase),
    listAllocations(supabase),
    listStudents(supabase),
    hasPermission("hostel.manage"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Hostel</h1>
      </div>
      <HostelManager hostels={hostels} rooms={rooms} allocations={allocations} students={students} canManage={canManage} />
    </div>
  );
}
