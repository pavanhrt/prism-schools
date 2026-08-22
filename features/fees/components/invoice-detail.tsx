"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { collectPaymentSchema, type CollectPaymentInput } from "@/validations/fees";
import { collectPaymentAction, voidPaymentAction } from "@/features/fees/actions";
import type { FeeInvoiceItem, FeePayment } from "@/types/fees";
import type { FeeType } from "@/types/fees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export function InvoiceDetail({
  invoiceId,
  items,
  payments,
  feeTypeById,
  totalAmount,
  paidAmount,
  balance,
  canCollect,
  canVoid,
}: {
  invoiceId: string;
  items: FeeInvoiceItem[];
  payments: FeePayment[];
  feeTypeById: Map<string, FeeType>;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  canCollect: boolean;
  canVoid: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CollectPaymentInput>({
    resolver: zodResolver(collectPaymentSchema),
    defaultValues: {
      invoice_id: invoiceId,
      payment_mode: "cash",
      payment_date: new Date().toISOString().slice(0, 10),
      amount: balance,
    },
  });

  async function onSubmit(values: CollectPaymentInput) {
    setError(null);
    const result = await collectPaymentAction(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset({
      invoice_id: invoiceId,
      payment_mode: "cash",
      payment_date: new Date().toISOString().slice(0, 10),
      amount: 0,
      transaction_ref: "",
      note: "",
    });
    router.refresh();
  }

  function confirmVoid(paymentId: string) {
    if (!voidReason.trim()) return;
    startTransition(async () => {
      const result = await voidPaymentAction({ payment_id: paymentId, reason: voidReason });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setVoidingId(null);
      setVoidReason("");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Fee type</TH>
                <TH className="text-right">Amount</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((item) => (
                <TR key={item.id}>
                  <TD>{feeTypeById.get(item.fee_type_id)?.name ?? "—"}</TD>
                  <TD className="text-right">₹{item.amount.toFixed(2)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <dl className="mt-4 flex flex-col gap-1 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Total</dt><dd className="font-medium text-slate-900">₹{totalAmount.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Paid</dt><dd className="font-medium text-emerald-600">₹{paidAmount.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Balance</dt><dd className="font-medium text-slate-900">₹{balance.toFixed(2)}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-col gap-1 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{p.receipt_no}</span>
                  <span className={p.status === "voided" ? "text-slate-400 line-through" : "text-slate-900"}>
                    ₹{p.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{p.payment_date} · {p.payment_mode.replace("_", " ")}{p.transaction_ref ? ` · ${p.transaction_ref}` : ""}</span>
                  {p.status === "voided" ? (
                    <Badge variant="outline">voided</Badge>
                  ) : (
                    canVoid && (
                      voidingId === p.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            className="h-7 w-32 text-xs"
                            placeholder="Reason"
                            value={voidReason}
                            onChange={(e) => setVoidReason(e.target.value)}
                          />
                          <Button size="sm" variant="destructive" disabled={pending} onClick={() => confirmVoid(p.id)}>
                            Confirm
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="text-red-500 underline"
                          onClick={() => { setVoidingId(p.id); setVoidReason(""); }}
                        >
                          Void
                        </button>
                      )
                    )
                  )}
                </div>
                {p.status === "voided" && p.void_reason && (
                  <p className="text-xs text-slate-400">Voided: {p.void_reason}</p>
                )}
              </div>
            ))}
            {payments.length === 0 && <p className="py-6 text-center text-slate-400">No payments yet.</p>}
          </div>

          {canCollect && balance > 0 && (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4">
              <input type="hidden" {...register("invoice_id")} />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" type="number" step="0.01" {...register("amount")} />
                  {errors.amount && <p className="text-xs text-red-600">{errors.amount.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="payment_date">Date</Label>
                  <Input id="payment_date" type="date" {...register("payment_date")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="payment_mode">Mode</Label>
                  <select id="payment_mode" className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm" {...register("payment_mode")}>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="transaction_ref">Reference</Label>
                  <Input id="transaction_ref" {...register("transaction_ref")} />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="self-start">
                {isSubmitting ? "Recording…" : "Record payment"}
              </Button>
            </form>
          )}
          {balance <= 0 && <p className="mt-4 text-sm text-emerald-600">Fully paid.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
