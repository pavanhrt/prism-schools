import { createClient } from "@/lib/supabase/server";
import { listFeeTypes } from "@/features/fees/service";
import { listStudents } from "@/features/students/service";
import { listAcademicYears } from "@/features/academics/repository";
import { GenerateInvoiceForm } from "@/features/fees/components/generate-invoice-form";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const [students, feeTypes, academicYears] = await Promise.all([
    listStudents(supabase),
    listFeeTypes(supabase),
    listAcademicYears(supabase),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">New Invoice</h1>
      </div>
      <GenerateInvoiceForm students={students} feeTypes={feeTypes} academicYears={academicYears} />
    </div>
  );
}
