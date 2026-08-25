import { createClient } from "@/lib/supabase/server";
import { listLeaveRequestsForReview } from "@/features/portal/service";
import { listStudents } from "@/features/students/service";
import { LeaveRequestReview } from "@/features/portal/components/leave-request-review";

export default async function AdminStudentLeaveRequestsPage() {
  const supabase = await createClient();
  const [requests, students] = await Promise.all([
    listLeaveRequestsForReview(supabase),
    listStudents(supabase),
  ]);
  const studentNameById = new Map(students.map((s) => [s.id, `${s.first_name} ${s.last_name} (${s.admission_no})`]));

  const submitted = requests.filter((r) => r.status === "submitted");
  const reviewed = requests.filter((r) => r.status !== "submitted");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Student Leave Requests</h1>
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Pending</h2>
        <LeaveRequestReview requests={submitted} studentNameById={studentNameById} />
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Reviewed</h2>
        <LeaveRequestReview requests={reviewed} studentNameById={studentNameById} />
      </div>
    </div>
  );
}
