"use client";

import { apiClient } from "@/src/lib/api-client";
import { z } from "zod";
import type { AxiosRequestConfig } from "axios";

export const auditLogSchema = z.object({
  id: z.union([z.string(), z.number()]),
  user_id: z.union([z.string(), z.number()]).nullable(),
  action: z.string(),
  model_type: z.string(),
  model_id: z.union([z.string(), z.number()]),
  old_values: z.record(z.any()).nullable().optional(),
  new_values: z.record(z.any()).nullable().optional(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
  // Relationships
  user: z
    .object({
      id: z.union([z.string(), z.number()]),
      first_name: z.string(),
      last_name: z.string(),
      email: z.string(),
    })
    .nullable()
    .optional(),
});

const paginatedAuditLogSchema = z.object({
  data: z.array(auditLogSchema),
  current_page: z.number().optional(),
  last_page: z.number().optional(),
  per_page: z.number().optional(),
  total: z.number().optional(),
  from: z.number().nullable().optional(),
  to: z.number().nullable().optional(),
}).passthrough();

export type AuditLog = z.infer<typeof auditLogSchema>;

export type FetchAuditLogsParams = {
  user_id?: string;
  action?: string;
  model_type?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
};

/**
 * Fetch all audit logs with optional filters
 */
export async function fetchAuditLogs(
  params?: FetchAuditLogsParams,
  config?: AxiosRequestConfig
) {
  const requestConfig: AxiosRequestConfig = {
    params,
    ...config,
  };
  const { data } = await apiClient.get("/audit-logs", requestConfig);
  return paginatedAuditLogSchema.parse(data);
}

/**
 * Fetch a single audit log by ID
 */
export async function fetchAuditLog(
  auditLogId: string,
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get(`/audit-logs/${auditLogId}`, config);
  return auditLogSchema.parse(data);
}
