"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  allocateHostelSchema,
  hostelRoomSchema,
  hostelSchema,
  type AllocateHostelInput,
  type HostelInput,
  type HostelRoomInput,
} from "@/validations/hostel";
import {
  allocateStudentAction,
  createHostelAction,
  createRoomAction,
  vacateAllocationAction,
} from "@/features/hostel/actions";
import { computeRoomOccupancy } from "@/features/hostel/service";
import type { Hostel, HostelAllocation, HostelRoom } from "@/types/hostel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function HostelManager({
  hostels,
  rooms,
  allocations,
  students,
  canManage,
}: {
  hostels: Hostel[];
  rooms: HostelRoom[];
  allocations: HostelAllocation[];
  students: { id: string; first_name: string; last_name: string; admission_no: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const hostelById = new Map(hostels.map((h) => [h.id, h]));
  const roomById = new Map(rooms.map((r) => [r.id, r]));
  const studentById = new Map(students.map((s) => [s.id, s]));

  const hostelForm = useForm<HostelInput>({ resolver: zodResolver(hostelSchema), defaultValues: { type: "boys" } });
  const roomForm = useForm<HostelRoomInput>({ resolver: zodResolver(hostelRoomSchema), defaultValues: { capacity: 1 } });
  const allocateForm = useForm<AllocateHostelInput>({ resolver: zodResolver(allocateHostelSchema) });

  async function onAddHostel(values: HostelInput) {
    setError(null);
    const result = await createHostelAction(values);
    if (!result.ok) { setError(result.error); return; }
    hostelForm.reset({ name: "", type: "boys", address: "" });
    router.refresh();
  }

  async function onAddRoom(values: HostelRoomInput) {
    setError(null);
    const result = await createRoomAction(values);
    if (!result.ok) { setError(result.error); return; }
    roomForm.reset({ hostel_id: values.hostel_id, room_no: "", room_type: "", capacity: 1, cost_per_bed: 0 });
    router.refresh();
  }

  async function onAllocate(values: AllocateHostelInput) {
    setError(null);
    const result = await allocateStudentAction(values);
    if (!result.ok) { setError(result.error); return; }
    allocateForm.reset({ room_id: "", student_id: "" });
    router.refresh();
  }

  function vacate(id: string) {
    startTransition(async () => {
      const result = await vacateAllocationAction(id);
      if (!result.ok) { setError(result.error); return; }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {canManage && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Add hostel</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={hostelForm.handleSubmit(onAddHostel)} className="flex flex-col gap-3">
                <Input placeholder="Name" {...hostelForm.register("name")} />
                <select className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...hostelForm.register("type")}>
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                  <option value="staff">Staff</option>
                  <option value="common">Common</option>
                </select>
                <Button type="submit" size="sm" disabled={hostelForm.formState.isSubmitting} className="self-start">Add</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Add room</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={roomForm.handleSubmit(onAddRoom)} className="flex flex-col gap-3">
                <select className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...roomForm.register("hostel_id")}>
                  <option value="">Choose hostel</option>
                  {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                <Input placeholder="Room no" {...roomForm.register("room_no")} />
                <Label htmlFor="capacity" className="sr-only">Capacity</Label>
                <Input id="capacity" type="number" placeholder="Beds" {...roomForm.register("capacity")} />
                <Button type="submit" size="sm" disabled={roomForm.formState.isSubmitting} className="self-start">Add</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Allocate bed</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={allocateForm.handleSubmit(onAllocate)} className="flex flex-col gap-3">
                <select className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...allocateForm.register("room_id")}>
                  <option value="">Choose room</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {hostelById.get(r.hostel_id)?.name} — {r.room_no} ({computeRoomOccupancy(r.id, allocations)}/{r.capacity})
                    </option>
                  ))}
                </select>
                <select className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...allocateForm.register("student_id")}>
                  <option value="">Choose student</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
                <Button type="submit" size="sm" disabled={allocateForm.formState.isSubmitting} className="self-start">Allocate</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Table>
        <THead><TR><TH>Room</TH><TH>Student</TH><TH>Allocated</TH><TH>Status</TH><TH></TH></TR></THead>
        <TBody>
          {allocations.map((a) => {
            const room = roomById.get(a.room_id);
            const student = studentById.get(a.student_id);
            return (
              <TR key={a.id}>
                <TD>{room ? `${hostelById.get(room.hostel_id)?.name ?? ""} — ${room.room_no}` : "—"}</TD>
                <TD>{student ? `${student.first_name} ${student.last_name}` : "—"}</TD>
                <TD>{a.allocated_date}</TD>
                <TD><Badge variant={a.status === "active" ? "success" : "outline"}>{a.status}</Badge></TD>
                <TD>
                  {canManage && a.status === "active" && (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => vacate(a.id)}>Vacate</Button>
                  )}
                </TD>
              </TR>
            );
          })}
          {allocations.length === 0 && <TR><TD colSpan={5} className="py-6 text-center text-slate-400">No allocations yet.</TD></TR>}
        </TBody>
      </Table>
    </div>
  );
}
