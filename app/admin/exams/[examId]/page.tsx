import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { listExamSchedules, listExams } from "@/features/exams/service";
import { listClasses, listSubjects } from "@/features/academics/repository";
import { ExamSchedulesManager } from "@/features/exams/components/exam-schedules-manager";

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const supabase = await createClient();
  const [exams, allSchedules, classes, subjects, canCreate, canPublish] = await Promise.all([
    listExams(supabase),
    listExamSchedules(supabase),
    listClasses(supabase),
    listSubjects(supabase),
    hasPermission("exams.create"),
    hasPermission("exams.publish"),
  ]);

  const exam = exams.find((e) => e.id === examId);
  if (!exam) notFound();

  const schedules = allSchedules.filter((s) => s.exam_id === examId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{exam.name}</h1>
        {exam.description && <p className="text-sm text-slate-500">{exam.description}</p>}
      </div>
      <ExamSchedulesManager
        examId={examId}
        initialSchedules={schedules}
        classes={classes}
        subjects={subjects}
        canCreate={canCreate}
        canPublish={canPublish}
      />
    </div>
  );
}
