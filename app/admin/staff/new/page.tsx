import { StaffForm } from "@/features/staff/components/staff-form";

export default function NewStaffPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Add Staff</h1>
      </div>
      <StaffForm />
    </div>
  );
}
