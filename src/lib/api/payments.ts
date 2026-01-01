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

// PurchaseOrder schema for nested data (keep simple)
const purchaseOrderSchema = z.object({
  id: z.string(),
  po_number: z.string(),
  supplier_id: z.string().optional(),
  supplier: z.object({
    company_name: z.string(),
    contact_person: z.string().nullable(),
  }).optional(),
});

// CustomerOrder schema for nested data
const customerOrderSchema = z.object({
  id: z.string(),
  co_number: z.string(),
  customer_id: z.string().optional(),
  customer: z.object({
    name: z.string(),
    company: z.string().nullable().optional(),
  }).optional(),
});

export const paymentSchema = z.object({
  id: z.union([z.string(), z.number()]),
  payment_number: z.string().nullable().optional(),
  payable_id: z.string(),
  payable_type: z.string(),
  type: z.enum(["inbound", "outbound"]),
  reference_number: z.string().nullable().optional(),
  amount: priceNumber,
  payment_method: z.enum(["cash", "cheque", "bank_transfer", "credit_card", "online_wallet"]),
  bank_name: z.string().nullable().optional(),
  account_number: z.string().nullable().optional(),
  date_received: z.string(),
  is_deposited: z.boolean().nullable().optional(),
  date_deposited: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  status_updated_at: z.string().nullable().optional(),
  is_consolidated: z.boolean().nullable().optional(),
  related_orders: z.array(z.object({
    id: z.string(),
    type: z.string(),
    amount: z.number().optional(),
  })).nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  payable: z.union([purchaseOrderSchema, customerOrderSchema]).nullable().optional(),
});

const paginatedPaymentSchema = z.object({
  data: z.array(paymentSchema),
  meta: paginationMetaSchema.optional(),
});

export type Payment = z.infer<typeof paymentSchema>;

export type FetchPaymentsParams = {
  payable_id?: string;
  payable_type?: string;
  type?: "inbound" | "outbound";
  is_deposited?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
};

export type CreatePaymentPayload = {
  payable_id: string;
  payable_type: "purchase_order" | "customer_order";
  reference_number?: string | null;
  amount: number;
  payment_method: "cash" | "cheque" | "bank_transfer" | "credit_card" | "online_wallet";
  bank_name?: string | null;
  account_number?: string | null;
  date_received: string;
  is_deposited?: boolean;
  date_deposited?: string | null;
  status?: string | null;
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
