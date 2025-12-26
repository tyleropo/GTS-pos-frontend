"use client";

import { apiClient } from "@/src/lib/api-client";
import { z } from "zod";
import type { AxiosRequestConfig } from "axios";
import { Repair } from "@/src/types/repair";

// Assuming Repair type is already defined, or we can define schema here
// For now, let's assume specific fields we need for billing

export { type Repair } from "@/src/types/repair";

const repairSchema = z.object({
  id: z.union([z.string(), z.number()]),
  customer_id: z.union([z.string(), z.number()]).optional(),
  customer: z.string(), // name
  device: z.string(),
  issue: z.string(),
  cost: z.number(),
  status: z.string(),
  date: z.string(), // created_at or specific date
  reference_id: z.string().optional(),
});

const paginatedRepairSchema = z.object({
  data: z.array(repairSchema),
  // meta...
});

export type FetchRepairsParams = {
  customer_id?: string;
  customer_ids?: string[];
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
};

export async function fetchRepairs(
  params?: FetchRepairsParams,
  config?: AxiosRequestConfig
) {
  // Convert array to comma-separated string if needed by backend, 
  // or Axios handles array params like ?customer_ids[]=1&customer_ids[]=2
  // Let's assume standard Axios behavior is fine or manual join.
  
  const requestConfig: AxiosRequestConfig = {
    params: {
        ...params,
        customer_ids: params?.customer_ids?.join(',')
    },
    ...config,
  };
  const { data } = await apiClient.get("/repairs", requestConfig);
  // We might need to map backend fields to frontend Repair type if they differ
  // But for now let's return raw data or basic transform
  return data;
}
