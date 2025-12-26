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

const transactionItemSchema = z.object({
  product_id: z.string(),
  product_name: z.string().optional(),
  quantity: z.number(),
  unit_price: priceNumber,
  discount: priceNumber.optional(),
  tax: priceNumber.optional(),
  line_total: priceNumber,
});

export const transactionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  invoice_number: z.string(),
  customer_id: z.string().nullable(),
  subtotal: priceNumber,
  tax: priceNumber,
  total: priceNumber,
  payment_method: z.enum(["cash", "card", "gcash"]),
  items: z.array(transactionItemSchema).optional(),
  meta: z
    .union([z.record(z.unknown()), z.array(z.unknown())])
    .transform((val) => (Array.isArray(val) ? {} : val))
    .optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  // Relations
  customer: z
    .object({
      id: z.union([z.string(), z.number()]),
      name: z.string(),
      email: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const paginatedTransactionSchema = z.object({
  data: z.array(transactionSchema),
  meta: paginationMetaSchema.optional(),
});

export type Transaction = z.infer<typeof transactionSchema>;
export type TransactionItem = z.infer<typeof transactionItemSchema>;

export type FetchTransactionsParams = {
  search?: string;
  customer_id?: string;
  customer_ids?: string[];
  payment_method?: "cash" | "card" | "gcash";
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
};

export type CreateTransactionPayload = {
  customer_id?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    line_total: number;
  }>;
  payment_method: "cash" | "card" | "gcash";
  subtotal: number;
  tax: number;
  total: number;
  meta?: Record<string, unknown>;
};

/**
 * Fetch all transactions with optional filters
 */
export async function fetchTransactions(
  params?: FetchTransactionsParams,
  config?: AxiosRequestConfig
) {
  const requestConfig: AxiosRequestConfig = {
    params,
    ...config,
  };
  const { data } = await apiClient.get("/transactions", requestConfig);
  return paginatedTransactionSchema.parse(data);
}

/**
 * Fetch a single transaction by ID
 */
export async function fetchTransaction(
  transactionId: string,
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get(
    `/transactions/${transactionId}`,
    config
  );
  return transactionSchema.parse(data);
}

/**
 * Create a new transaction (POS sale)
 */
export async function createTransaction(payload: CreateTransactionPayload) {
  const { data } = await apiClient.post("/transactions", payload);
  return transactionSchema.parse(data);
}
