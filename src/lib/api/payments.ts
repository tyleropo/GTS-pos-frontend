"use client";

import { apiClient } from "@/src/lib/api-client";
import { z } from "zod";
import type { AxiosRequestConfig } from "axios";

const paginationMetaSchema = z
  .object({
    current_page: z.number().optional(),
    last_page: z.number().optional(),
    per_page: z.number().optional(),
    total: z.number().optional(),
  })
  .passthrough();

const priceNumber = z.union([z.number(), z.string()]).transform((val) => {
  const numericValue =
    typeof val === "string" ? parseFloat(val as string) : (val as number);
  return Number.isFinite(numericValue) ? numericValue : 0;
});

// Customer schema for nested data
const customerSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  company: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

// PurchaseOrder schema for nested data
const purchaseOrderSchema = z.object({
  id: z.union([z.string(), z.number()]),
  po_number: z.string(),
  status: z.string(),
  total: priceNumber,
  customer: customerSchema.nullable().optional(),
});

export const paymentSchema = z.object({
  id: z.union([z.string(), z.number()]),
  purchase_order_id: z.union([z.string(), z.number()]),
  reference_number: z.string().nullable().optional(),
  amount: priceNumber,
  payment_method: z.enum(["cash", "cheque", "bank_transfer", "credit_card"]),
  date_received: z.string(),
  is_deposited: z.boolean(),
  date_deposited: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  purchase_order: purchaseOrderSchema.nullable().optional(),
});

const paginatedPaymentSchema = z.object({
  data: z.array(paymentSchema),
  meta: paginationMetaSchema.optional(),
});

export type Payment = z.infer<typeof paymentSchema>;

export type FetchPaymentsParams = {
  purchase_order_id?: string;
  is_deposited?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
};

export type CreatePaymentPayload = {
  purchase_order_id: string;
  reference_number?: string | null;
  amount: number;
  payment_method: "cash" | "cheque" | "bank_transfer" | "credit_card";
  date_received: string;
  is_deposited?: boolean;
  date_deposited?: string | null;
  notes?: string | null;
};

export type UpdatePaymentPayload = Partial<CreatePaymentPayload>;

/**
 * Fetch all payments with optional filters
 */
export async function fetchPayments(
  params?: FetchPaymentsParams,
  config?: AxiosRequestConfig
) {
  const requestConfig: AxiosRequestConfig = {
    params,
    ...config,
  };
  const { data } = await apiClient.get("/payments", requestConfig);
  return paginatedPaymentSchema.parse(data);
}

/**
 * Fetch a single payment by ID
 */
export async function fetchPayment(
  paymentId: string | number,
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get(`/payments/${paymentId}`, config);
  return paymentSchema.parse(data);
}

/**
 * Create a new payment
 */
export async function createPayment(payload: CreatePaymentPayload) {
  const { data } = await apiClient.post("/payments", payload);
  return paymentSchema.parse(data);
}

/**
 * Update an existing payment
 */
export async function updatePayment(
  paymentId: string | number,
  payload: UpdatePaymentPayload
) {
  const { data } = await apiClient.put(`/payments/${paymentId}`, payload);
  return paymentSchema.parse(data);
}

/**
 * Delete a payment
 */
export async function deletePayment(paymentId: string | number) {
  await apiClient.delete(`/payments/${paymentId}`);
}
