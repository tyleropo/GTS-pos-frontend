"use client";

import { apiClient } from "@/src/lib/api-client";
import { z } from "zod";
import type { AxiosRequestConfig } from "axios";
import { productSchema } from "./products";

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

export const repairSchema = z.object({
  id: z.union([z.string(), z.number()]),
  ticket_number: z.string(),
  customer_id: z.union([z.string(), z.number()]).nullable().optional(),
  device: z.string().nullable().optional(),
  device_model: z.string().nullable().optional(),
  serial_number: z.string().nullable().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  issue_description: z.string().nullable().optional(),
  resolution: z.string().nullable().optional(),
  cost: priceNumber,
  technician: z.string().nullable().optional(),
  promised_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  customer: z
    .object({
      id: z.union([z.string(), z.number()]),
      name: z.string(),
      company: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  products: z.array(productSchema.extend({
    pivot: z.object({
        quantity: z.coerce.number(),
        unit_price: z.coerce.number(),
        total_price: z.coerce.number().optional(),
    })
  })).optional().default([]),
});

const paginatedRepairSchema = z.object({
  data: z.array(repairSchema),
  meta: paginationMetaSchema.optional(),
});

export type Repair = z.infer<typeof repairSchema>;

export type FetchRepairsParams = {
  status?: string;
  customer_id?: string;
  customer_ids?: string[];
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
};

export type RepairProductPayload = {
  id: string;
  quantity: number;
  unit_price: number;
};

export type CreateRepairPayload = {
  customer_id?: string | null;
  device: string;
  device_model?: string | null;
  serial_number?: string | null;
  issue_description: string;
  cost?: number;
  technician?: string | null;
  promised_at?: string | null;
  products?: RepairProductPayload[];
};

export type UpdateRepairPayload = Partial<CreateRepairPayload> & {
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  resolution?: string | null;
};

/**
 * Fetch all repairs with optional filters
 */
export async function fetchRepairs(
  params?: FetchRepairsParams,
  config?: AxiosRequestConfig
) {
  const requestConfig: AxiosRequestConfig = {
    params,
    ...config,
  };
  const { data } = await apiClient.get("/repairs", requestConfig);
  return paginatedRepairSchema.parse(data);
}

/**
 * Fetch a single repair by ID
 */
export async function fetchRepair(
  repairId: string,
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get(`/repairs/${repairId}`, config);
  return repairSchema.parse(data);
}

/**
 * Create a new repair
 */
export async function createRepair(payload: CreateRepairPayload) {
  const { data } = await apiClient.post("/repairs", payload);
  return repairSchema.parse(data);
}

/**
 * Update an existing repair
 */
export async function updateRepair(
  repairId: string,
  payload: UpdateRepairPayload
) {
  const { data } = await apiClient.put(`/repairs/${repairId}`, payload);
  return repairSchema.parse(data);
}

/**
 * Delete a repair
 */
export async function deleteRepair(repairId: string) {
  await apiClient.delete(`/repairs/${repairId}`);
}
