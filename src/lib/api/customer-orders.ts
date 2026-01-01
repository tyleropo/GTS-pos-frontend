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

const customerOrderItemSchema = z.object({
  product_id: z.union([z.string(), z.number()]),
  product_name: z.string().optional(),
  quantity_ordered: z.number(),
  quantity_fulfilled: z.number().optional(),
  unit_cost: priceNumber,
  tax: priceNumber.optional(),
  line_total: priceNumber,
  description: z.string().nullable().optional(),
  is_voided: z.boolean().optional(),
  void_reason: z.string().nullable().optional(),
});

const customerOrderAdjustmentSchema = z.object({
  id: z.union([z.string(), z.number()]),
  customer_order_id: z.string(),
  type: z.string(),
  amount: priceNumber,
  description: z.string().nullable().optional(),
  related_product_id: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const customerOrderSchema = z.object({
  id: z.union([z.string(), z.number()]),
  co_number: z.string(),
  customer_id: z.string(),
  status: z.enum(["draft", "submitted", "fulfilled", "cancelled"]),
  payment_status: z.enum(["pending", "partial", "paid"]).optional(),
  expected_at: z.string().nullable().optional(),
  subtotal: priceNumber,
  tax: priceNumber,
  total: priceNumber,
  total_paid: priceNumber.optional(),
  outstanding_balance: priceNumber.optional(),
  notes: z.string().nullable().optional(),
  items: z.array(customerOrderItemSchema).optional(),
  adjustments: z.array(customerOrderAdjustmentSchema).optional(),
  meta: z.union([z.record(z.unknown()), z.array(z.unknown())]).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  // Relations
  customer: z
    .object({
      id: z.union([z.string(), z.number()]),
      name: z.string().optional(),
      company: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  // Payments linked to this customer order
  payments: z.array(z.object({
    id: z.union([z.string(), z.number()]),
    reference_number: z.string().nullable().optional(),
    amount: priceNumber,
    payment_method: z.string(),
    date_received: z.string(),
    is_deposited: z.boolean(),
    date_deposited: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
  })).optional(),
});

const paginatedCustomerOrderSchema = z.object({
  data: z.array(customerOrderSchema),
  meta: paginationMetaSchema.optional(),
});

export type CustomerOrder = z.infer<typeof customerOrderSchema>;
export type CustomerOrderItem = z.infer<typeof customerOrderItemSchema>;
export type CustomerOrderAdjustment = z.infer<typeof customerOrderAdjustmentSchema>;

export type FetchCustomerOrdersParams = {
  search?: string;
  status?: "draft" | "submitted" | "fulfilled" | "cancelled";
  customer_id?: string;
  customer_ids?: string[];
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
};

export type CreateCustomerOrderPayload = {
  customer_id: string;
  items: Array<{
    product_id: string | number;
    quantity_ordered: number;
    unit_cost: number;
    line_total: number;
    tax?: number;
    description?: string | null;
  }>;
  expected_at?: string;
  status?: "draft" | "submitted" | "fulfilled" | "cancelled";
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  meta?: Record<string, unknown>;
};

export type UpdateCustomerOrderPayload = Partial<CreateCustomerOrderPayload> & {
  status?: "draft" | "submitted" | "fulfilled" | "cancelled";
};

export type FulfillCustomerOrderPayload = {
  items: Array<{
    product_id: string;
    quantity_fulfilled: number;
  }>;
};

/**
 * Fetch all customer orders with optional filters
 */
export async function fetchCustomerOrders(
  params?: FetchCustomerOrdersParams,
  config?: AxiosRequestConfig
) {
  const requestConfig: AxiosRequestConfig = {
    params,
    ...config,
  };
  const { data } = await apiClient.get("/customer-orders", requestConfig);
  // Map root-level pagination fields to 'meta'
  return paginatedCustomerOrderSchema.parse({
    data: data.data,
    meta: data
  });
}

/**
 * Fetch a single customer order by ID
 */
export async function fetchCustomerOrder(
  customerOrderId: string,
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get(
    `/customer-orders/${customerOrderId}`,
    config
  );
  return customerOrderSchema.parse(data);
}

/**
 * Create a new customer order
 */
export async function createCustomerOrder(payload: CreateCustomerOrderPayload) {
  const { data } = await apiClient.post("/customer-orders", payload);
  return customerOrderSchema.parse(data);
}

/**
 * Update an existing customer order
 */
export async function updateCustomerOrder(
  customerOrderId: string,
  payload: UpdateCustomerOrderPayload
) {
  const { data } = await apiClient.put(
    `/customer-orders/${customerOrderId}`,
    payload
  );
  return customerOrderSchema.parse(data);
}

/**
 * Delete a customer order
 */
export async function deleteCustomerOrder(customerOrderId: string) {
  await apiClient.delete(`/customer-orders/${customerOrderId}`);
}

/**
 * Fulfill items from a customer order (deducts inventory)
 */
export async function fulfillCustomerOrder(
  customerOrderId: string,
  payload: FulfillCustomerOrderPayload
) {
  const { data } = await apiClient.post(
    `/customer-orders/${customerOrderId}/fulfill`,
    payload
  );
  return customerOrderSchema.parse(data);
}

/**
 * Cancel a customer order
 */
export async function cancelCustomerOrder(customerOrderId: string) {
  const { data } = await apiClient.post(
    `/customer-orders/${customerOrderId}/cancel`
  );
  return customerOrderSchema.parse(data);
}

/**
 * Convert a product line to cash (voids the line and adds adjustment)
 */
export async function convertLineToCash(
  customerOrderId: string,
  productId: string
) {
  const { data } = await apiClient.post(
    `/customer-orders/${customerOrderId}/convert-to-cash`,
    { product_id: productId }
  );
  return customerOrderSchema.parse(data);
}

/**
 * Revert a voided product line back to active (removes void and adjustment)
 */
export async function revertLineToCash(
  customerOrderId: string,
  productId: string
) {
  const { data } = await apiClient.post(
    `/customer-orders/${customerOrderId}/revert-to-cash`,
    { product_id: productId }
  );
  return customerOrderSchema.parse(data);
}

