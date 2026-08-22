import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listStaff } from "@/features/staff/service";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function StaffPage() {
  const supabase = await createClient();
  const [staff, canCreate] = await Promise.all([
    listStaff(supabase),
    hasPermission("staff.create"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Staff</h1>
        {canCreate && (
          <Link href="/admin/staff/new" className={buttonVariants({})}>
            Add staff
          </Link>
        )}
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Staff No</TH>
            <TH>Name</TH>
            <TH>Designation</TH>
            <TH>Department</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <TBody>
          {staff.map((s) => (
            <TR key={s.id}>
              <TD>
                <Link href={`/admin/staff/${s.id}`} className="font-medium text-slate-900 underline">
                  {s.staff_no}
                </Link>
              </TD>
              <TD>{s.first_name} {s.last_name}</TD>
              <TD>{s.designation ?? "—"}</TD>
              <TD>{s.department ?? "—"}</TD>
              <TD>
                <Badge variant={s.status === "active" ? "success" : "outline"}>{s.status}</Badge>
              </TD>
            </TR>
          ))}
          {staff.length === 0 && (
            <TR>
              <TD colSpan={5} className="py-8 text-center text-slate-400">
                No staff yet.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}
