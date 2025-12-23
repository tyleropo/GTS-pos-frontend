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

export const repairSchema = z.object({
  id: z.union([z.string(), z.number()]),
  ticket_number: z.string(),
  customer_id: z.string(),
  device: z.string(),
  serial_number: z.string().nullable().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  issue_description: z.string().nullable().optional(),
  resolution: z.string().nullable().optional(),
  promised_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  // Relations
  customer: z
    .object({
      id: z.union([z.string(), z.number()]),
      name: z.string(),
      email: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const paginatedRepairSchema = z.object({
  data: z.array(repairSchema),
  meta: paginationMetaSchema.optional(),
});

export type Repair = z.infer<typeof repairSchema>;

export type FetchRepairsParams = {
  search?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  page?: number;
  per_page?: number;
};

export type CreateRepairPayload = {
  customer_id: string;
  device: string;
  serial_number?: string;
  issue_description?: string;
  promised_at?: string;
  status?: "pending" | "in_progress";
};

export type UpdateRepairPayload = Partial<CreateRepairPayload> & {
  resolution?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
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
 * Create a new repair ticket
 */
export async function createRepair(payload: CreateRepairPayload) {
  const { data } = await apiClient.post("/repairs", payload);
  return repairSchema.parse(data);
}

/**
 * Update an existing repair ticket
 */
export async function updateRepair(
  repairId: string,
  payload: UpdateRepairPayload
) {
  const { data } = await apiClient.put(`/repairs/${repairId}`, payload);
  return repairSchema.parse(data);
}

/**
 * Delete a repair ticket
 */
export async function deleteRepair(repairId: string) {
  await apiClient.delete(`/repairs/${repairId}`);
}
