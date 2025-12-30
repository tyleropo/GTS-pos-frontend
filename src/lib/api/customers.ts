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

export const customerSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  // Computed attributes from backend
  total_spent: z.number().optional(),
  transactions_count: z.number().optional(),
});

const paginatedCustomerSchema = z.object({
  data: z.array(customerSchema),
  meta: paginationMetaSchema.optional(),
});

export type Customer = z.infer<typeof customerSchema>;

export type FetchCustomersParams = {
  search?: string;
  page?: number;
  per_page?: number;
};

export type CreateCustomerPayload = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  status?: string;
  type?: string;
};

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

/**
 * Fetch all customers with optional pagination and search
 */
export async function fetchCustomers(
  params?: FetchCustomersParams,
  config?: AxiosRequestConfig
) {
  const requestConfig: AxiosRequestConfig = {
    params,
    ...config,
  };
  const { data } = await apiClient.get("/customers", requestConfig);
  return paginatedCustomerSchema.parse(data);
}

/**
 * Fetch a single customer by ID
 */
export async function fetchCustomer(
  customerId: string,
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get(`/customers/${customerId}`, config);
  return customerSchema.parse(data);
}

/**
 * Create a new customer
 */
export async function createCustomer(payload: CreateCustomerPayload) {
  const { data } = await apiClient.post("/customers", payload);
  return customerSchema.parse(data);
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
  customerId: string,
  payload: UpdateCustomerPayload
) {
  const { data } = await apiClient.put(`/customers/${customerId}`, payload);
  return customerSchema.parse(data);
}

/**
 * Delete a customer
 */
export async function deleteCustomer(customerId: string) {
  await apiClient.delete(`/customers/${customerId}`);
}

/**
 * Fetch distinct customer types
 */
export async function fetchCustomerTypes(config?: AxiosRequestConfig) {
  const { data } = await apiClient.get<string[]>("/customers/types", config);
  return data;
}
