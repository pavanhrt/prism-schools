"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  allocateTransportSchema,
  transportRouteSchema,
  transportStopSchema,
  vehicleSchema,
  type AllocateTransportInput,
  type TransportRouteInput,
  type TransportStopInput,
  type VehicleInput,
} from "@/validations/transport";
import {
  allocateTransportAction,
  createRouteAction,
  createStopAction,
  createVehicleAction,
} from "@/features/transport/actions";
import type { StudentTransport, TransportRoute, TransportStop, Vehicle } from "@/types/transport";
import type { AcademicYear } from "@/types/academic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function TransportManager({
  vehicles,
  routes,
  stops,
  allocations,
  students,
  academicYears,
  canManage,
}: {
  vehicles: Vehicle[];
  routes: TransportRoute[];
  stops: TransportStop[];
  allocations: StudentTransport[];
  students: { id: string; first_name: string; last_name: string }[];
  academicYears: AcademicYear[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const routeById = new Map(routes.map((r) => [r.id, r]));
  const stopById = new Map(stops.map((s) => [s.id, s]));
  const studentById = new Map(students.map((s) => [s.id, s]));

  const vehicleForm = useForm<VehicleInput>({ resolver: zodResolver(vehicleSchema) });
  const routeForm = useForm<TransportRouteInput>({ resolver: zodResolver(transportRouteSchema) });
  const stopForm = useForm<TransportStopInput>({ resolver: zodResolver(transportStopSchema), defaultValues: { sequence: 0 } });
  const allocateForm = useForm<AllocateTransportInput>({ resolver: zodResolver(allocateTransportSchema) });

  async function submit<T>(action: (v: T) => Promise<{ ok: boolean; error?: string }>, values: T, reset: () => void) {
    setError(null);
    const result = await action(values);
    if (!result.ok) { setError(result.error ?? "Something went wrong."); return; }
    reset();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      {canManage && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Add vehicle</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={vehicleForm.handleSubmit((v) => submit(createVehicleAction, v, () => vehicleForm.reset({ vehicle_no: "" })))} className="flex items-end gap-2">
                <Input placeholder="Vehicle no" {...vehicleForm.register("vehicle_no")} />
                <Input placeholder="Driver name" {...vehicleForm.register("driver_name")} />
                <Input placeholder="Driver phone" {...vehicleForm.register("driver_phone")} />
                <Button type="submit" size="sm" disabled={vehicleForm.formState.isSubmitting}>Add</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Add route</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={routeForm.handleSubmit((v) => submit(createRouteAction, v, () => routeForm.reset({ route_name: "" })))} className="flex items-end gap-2">
                <Input placeholder="Route name" {...routeForm.register("route_name")} />
                <select className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...routeForm.register("vehicle_id")}>
                  <option value="">No vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicle_no}</option>)}
                </select>
                <Input type="number" placeholder="Fare" {...routeForm.register("fare")} />
                <Button type="submit" size="sm" disabled={routeForm.formState.isSubmitting}>Add</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Add stop</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={stopForm.handleSubmit((v) => submit(createStopAction, v, () => stopForm.reset({ route_id: stopForm.getValues("route_id"), stop_name: "", sequence: 0 })))} className="flex items-end gap-2">
                <select className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...stopForm.register("route_id")}>
                  <option value="">Choose route</option>
                  {routes.map((r) => <option key={r.id} value={r.id}>{r.route_name}</option>)}
                </select>
                <Input placeholder="Stop name" {...stopForm.register("stop_name")} />
                <Input type="number" placeholder="Order" className="w-20" {...stopForm.register("sequence")} />
                <Button type="submit" size="sm" disabled={stopForm.formState.isSubmitting}>Add</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Allocate student</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={allocateForm.handleSubmit((v) => submit(allocateTransportAction, v, () => allocateForm.reset({ student_id: "", route_id: "", academic_year_id: allocateForm.getValues("academic_year_id") })))} className="flex items-end gap-2">
                <select className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...allocateForm.register("student_id")}>
                  <option value="">Choose student</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
                <select className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...allocateForm.register("route_id")}>
                  <option value="">Choose route</option>
                  {routes.map((r) => <option key={r.id} value={r.id}>{r.route_name}</option>)}
                </select>
                <select className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...allocateForm.register("academic_year_id")}>
                  <option value="">Choose year</option>
                  {academicYears.map((y) => <option key={y.id} value={y.id}>{y.year_label}</option>)}
                </select>
                <Button type="submit" size="sm" disabled={allocateForm.formState.isSubmitting}>Allocate</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Table>
        <THead><TR><TH>Student</TH><TH>Route</TH><TH>Stop</TH><TH>Status</TH></TR></THead>
        <TBody>
          {allocations.map((a) => {
            const student = studentById.get(a.student_id);
            return (
              <TR key={a.id}>
                <TD>{student ? `${student.first_name} ${student.last_name}` : "—"}</TD>
                <TD>{routeById.get(a.route_id)?.route_name ?? "—"}</TD>
                <TD>{a.stop_id ? stopById.get(a.stop_id)?.stop_name ?? "—" : "—"}</TD>
                <TD>{a.status}</TD>
              </TR>
            );
          })}
          {allocations.length === 0 && <TR><TD colSpan={4} className="py-6 text-center text-slate-400">No allocations yet.</TD></TR>}
        </TBody>
      </Table>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Vehicles</h2>
        <Table>
          <THead><TR><TH>No</TH><TH>Driver</TH><TH>Phone</TH></TR></THead>
          <TBody>
            {vehicles.map((v) => (
              <TR key={v.id}><TD>{v.vehicle_no}</TD><TD>{v.driver_name ?? "—"}</TD><TD>{v.driver_phone ?? "—"}</TD></TR>
            ))}
            {vehicles.length === 0 && <TR><TD colSpan={3} className="py-6 text-center text-slate-400">No vehicles yet.</TD></TR>}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
