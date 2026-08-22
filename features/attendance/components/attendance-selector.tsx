"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SchoolClass, Section } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AttendanceSelector({
  classes,
  sections,
  defaultClassId,
  defaultSectionId,
  defaultDate,
}: {
  classes: SchoolClass[];
  sections: Section[];
  defaultClassId?: string;
  defaultSectionId?: string;
  defaultDate: string;
}) {
  const router = useRouter();
  const [classId, setClassId] = useState(defaultClassId ?? "");
  const [sectionId, setSectionId] = useState(defaultSectionId ?? "");
  const [date, setDate] = useState(defaultDate);
  const filteredSections = sections.filter((s) => s.class_id === classId);

  function loadRoster(e: React.FormEvent) {
    e.preventDefault();
    if (!classId || !sectionId || !date) return;
    router.push(`/admin/attendance?class_id=${classId}&section_id=${sectionId}&date=${date}`);
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Take attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={loadRoster} className="flex items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="class_id">Class</Label>
            <select
              id="class_id"
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={classId}
              onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}
            >
              <option value="">Choose</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="section_id">Section</Label>
            <select
              id="section_id"
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
            >
              <option value="">Choose</option>
              {filteredSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Button type="submit" disabled={!classId || !sectionId || !date}>
            Load roster
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
