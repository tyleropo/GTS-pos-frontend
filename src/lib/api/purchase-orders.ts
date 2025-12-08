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

const purchaseOrderItemSchema = z.object({
  product_id: z.string(),
  product_name: z.string().optional(),
  quantity_ordered: z.number(),
  quantity_received: z.number().optional().default(0),
  unit_cost: priceNumber,
  tax: priceNumber.optional(),
  line_total: priceNumber,
});

export const purchaseOrderSchema = z.object({
  id: z.union([z.string(), z.number()]),
  po_number: z.string(),
  supplier_id: z.string(),
  status: z.enum(["draft", "submitted", "received", "cancelled"]),
  expected_at: z.string().nullable().optional(),
  subtotal: priceNumber,
  tax: priceNumber,
  total: priceNumber,
  items: z.array(purchaseOrderItemSchema).optional(),
  meta: z.record(z.unknown()).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  // Relations
  supplier: z
    .object({
      id: z.union([z.string(), z.number()]),
      company_name: z.string().optional(),
      supplier_code: z.string().optional(),
    })
    .nullable()
    .optional(),
});

const paginatedPurchaseOrderSchema = z.object({
  data: z.array(purchaseOrderSchema),
  meta: paginationMetaSchema.optional(),
});

export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderItem = z.infer<typeof purchaseOrderItemSchema>;

export type FetchPurchaseOrdersParams = {
  search?: string;
  status?: "draft" | "submitted" | "received" | "cancelled";
  page?: number;
  per_page?: number;
};

export type CreatePurchaseOrderPayload = {
  supplier_id: string;
  items: Array<{
    product_id: string;
    quantity_ordered: number;
    unit_cost: number;
  }>;
  expected_at?: string;
  status?: "draft" | "submitted";
  subtotal: number;
  tax: number;
  total: number;
  meta?: Record<string, unknown>;
};

export type UpdatePurchaseOrderPayload = Partial<CreatePurchaseOrderPayload>;

export type ReceivePurchaseOrderPayload = {
  items: Array<{
    product_id: string;
    quantity_received: number;
  }>;
};

/**
 * Fetch all purchase orders with optional filters
 */
export async function fetchPurchaseOrders(
  params?: FetchPurchaseOrdersParams,
  config?: AxiosRequestConfig
) {
  const requestConfig: AxiosRequestConfig = {
    params,
    ...config,
  };
  const { data } = await apiClient.get("/purchase-orders", requestConfig);
  return paginatedPurchaseOrderSchema.parse(data);
}

/**
 * Fetch a single purchase order by ID
 */
export async function fetchPurchaseOrder(
  purchaseOrderId: string,
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get(
    `/purchase-orders/${purchaseOrderId}`,
    config
  );
  return purchaseOrderSchema.parse(data);
}

/**
 * Create a new purchase order
 */
export async function createPurchaseOrder(payload: CreatePurchaseOrderPayload) {
  const { data } = await apiClient.post("/purchase-orders", payload);
  return purchaseOrderSchema.parse(data);
}

/**
 * Update an existing purchase order
 */
export async function updatePurchaseOrder(
  purchaseOrderId: string,
  payload: UpdatePurchaseOrderPayload
) {
  const { data } = await apiClient.put(
    `/purchase-orders/${purchaseOrderId}`,
    payload
  );
  return purchaseOrderSchema.parse(data);
}

/**
 * Delete a purchase order
 */
export async function deletePurchaseOrder(purchaseOrderId: string) {
  await apiClient.delete(`/purchase-orders/${purchaseOrderId}`);
}

/**
 * Receive items from a purchase order
 */
export async function receivePurchaseOrder(
  purchaseOrderId: string,
  payload: ReceivePurchaseOrderPayload
) {
  const { data } = await apiClient.post(
    `/purchase-orders/${purchaseOrderId}/receive`,
    payload
  );
  return purchaseOrderSchema.parse(data);
}
