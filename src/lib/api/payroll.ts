"use client";

import { apiClient } from "@/src/lib/api-client";
import { z } from "zod";

// Payroll Period Schema
export const payrollPeriodSchema = z.object({
  id: z.number(),
  name: z.string(),
  period_type: z.enum(['weekly', 'bi-weekly', 'monthly', 'custom']),
  start_date: z.string(),
  end_date: z.string(),
  status: z.enum(['draft', 'finalized', 'paid']),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  total_payroll: z.number().optional(),
  employee_count: z.number().optional(),
});

// Payroll Record Schema
export const payrollRecordSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  payroll_period_id: z.number(),
  base_salary: z.number(),
  commission: z.number(),
  gross_pay: z.number(),
  total_deductions: z.number(),
  net_pay: z.number(),
  benefit_items: z.array(z.object({
    name: z.string(),
    amount: z.number(),
  })).nullable().optional(),
  deduction_items: z.array(z.object({
    name: z.string(),
    amount: z.number(),
  })).nullable().optional(),
  notes: z.string().nullable().optional(),
  user: z.object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
  }).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PayrollPeriod = z.infer<typeof payrollPeriodSchema>;
export type PayrollRecord = z.infer<typeof payrollRecordSchema>;

export type CreatePeriodPayload = {
  name: string;
  period_type: 'weekly' | 'bi-weekly' | 'monthly' | 'custom';
  employee_selection: 'all' | 'custom';
  selected_user_ids?: number[];
  start_date: string;
  end_date: string;
};

export type UpdateRecordPayload = {
  base_salary?: number;
  commission?: number;
  benefit_items?: Array<{ name: string; amount: number }>;
  deduction_items?: Array<{ name: string; amount: number }>;
  notes?: string;
};

/**
 * Fetch all payroll periods
 */
export async function fetchPayrollPeriods(params?: { status?: string }) {
  const { data } = await apiClient.get("/payroll/periods", { params });
  return z.array(payrollPeriodSchema).parse(data);
}

/**
 * Create new payroll period
 */
export async function createPayrollPeriod(payload: CreatePeriodPayload) {
  const { data } = await apiClient.post("/payroll/periods", payload);
  return payrollPeriodSchema.parse(data);
}

/**
 * Get payroll period details
 */
export async function fetchPayrollPeriod(periodId: string | number) {
  const { data } = await apiClient.get(`/payroll/periods/${periodId}`);
  return payrollPeriodSchema.extend({
    payroll_records: z.array(payrollRecordSchema),
  }).parse(data);
}

/**
 * Update payroll record
 */
export async function updatePayrollRecord(
  periodId: string | number,
  recordId: string | number,
  payload: UpdateRecordPayload
) {
  const { data } = await apiClient.put(
    `/payroll/periods/${periodId}/records/${recordId}`,
    payload
  );
  return payrollRecordSchema.parse(data);
}

/**
 * Finalize payroll period
 */
export async function finalizePayroll(periodId: string | number) {
  const { data } = await apiClient.post(`/payroll/periods/${periodId}/finalize`);
  return payrollPeriodSchema.parse(data);
}

/**
 * Mark payroll period as paid
 */
export async function markPayrollAsPaid(periodId: string | number) {
  const { data } = await apiClient.post(`/payroll/periods/${periodId}/mark-paid`);
  return payrollPeriodSchema.parse(data);
}

/**
 * Delete payroll period
 */
export async function deletePayrollPeriod(periodId: string | number) {
  await apiClient.delete(`/payroll/periods/${periodId}`);
}

/**
 * Get employee payroll history
 */
export async function fetchEmployeePayroll(userId: string | number) {
  const { data } = await apiClient.get(`/payroll/employee/${userId}`);
  return z.array(payrollRecordSchema).parse(data);
}
