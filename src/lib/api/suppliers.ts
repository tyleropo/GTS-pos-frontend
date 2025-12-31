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

export const supplierSchema = z.object({
  id: z.union([z.string(), z.number()]),
  company_name: z.string(),
  supplier_code: z.string().nullable().optional(),
  contact_person: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const paginatedSupplierSchema = z.object({
  data: z.array(supplierSchema),
  meta: paginationMetaSchema.optional(),
});

export type Supplier = z.infer<typeof supplierSchema>;

export type FetchSuppliersParams = {
  search?: string;
  page?: number;
  per_page?: number;
};

export type CreateSupplierPayload = {
  company_name: string;
  supplier_code?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;

/**
 * Fetch all suppliers with optional pagination and search
 */
export async function fetchSuppliers(
  params?: FetchSuppliersParams,
  config?: AxiosRequestConfig
) {
  const requestConfig: AxiosRequestConfig = {
    params,
    ...config,
  };
  const { data } = await apiClient.get("/suppliers", requestConfig);
  
  // Check if the response is already an array (direct response) or has a data property
  if (Array.isArray(data)) {
    // Backend returns array directly
    return paginatedSupplierSchema.parse({
      data: data,
      meta: {}
    });
  } else {
    // Backend returns { data: [...], ...pagination }
    return paginatedSupplierSchema.parse({
      data: data.data,
      meta: data
    });
  }
}

/**
 * Fetch a single supplier by ID
 */
export async function fetchSupplier(
  supplierId: string,
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get(`/suppliers/${supplierId}`, config);
  return supplierSchema.parse(data);
}

/**
 * Create a new supplier
 */
export async function createSupplier(payload: CreateSupplierPayload) {
  const { data } = await apiClient.post("/suppliers", payload);
  return supplierSchema.parse(data);
}

/**
 * Update an existing supplier
 */
export async function updateSupplier(
  supplierId: string,
  payload: UpdateSupplierPayload
) {
  const { data } = await apiClient.put(`/suppliers/${supplierId}`, payload);
  return supplierSchema.parse(data);
}

/**
 * Delete a supplier
 */
export async function deleteSupplier(supplierId: string) {
  await apiClient.delete(`/suppliers/${supplierId}`);
}
