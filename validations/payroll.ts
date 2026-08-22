import { z } from "zod";

export const createPayrollRunSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const updatePayrollItemSchema = z.object({
  id: z.string().uuid(),
  allowances: z.coerce.number().min(0),
  deductions: z.coerce.number().min(0),
  bonus: z.coerce.number().min(0),
  leave_deduction: z.coerce.number().min(0),
});

export const createAdjustmentSchema = z.object({
  staff_id: z.string().uuid("Choose a staff member"),
  amount: z.coerce.number().refine((v) => v !== 0, "Amount can't be zero"),
  reason: z.string().trim().min(1, "A reason is required").max(500),
});

export type CreatePayrollRunInput = z.infer<typeof createPayrollRunSchema>;
export type UpdatePayrollItemInput = z.infer<typeof updatePayrollItemSchema>;
export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>;
