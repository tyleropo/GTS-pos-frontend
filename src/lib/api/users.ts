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

export const userSchema = z.object({
  id: z.union([z.string(), z.number()]),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  roles: z.array(z.enum(["admin", "manager", "cashier", "technician"])),
  is_active: z.boolean(),
  avatar_url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  password_plain: z.string().nullable().optional(),
  last_login_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  // Computed
  audit_logs_count: z.number().optional(),
});

const paginatedUserSchema = z.object({
  data: z.array(userSchema),
  meta: paginationMetaSchema.optional(),
});

export type User = z.infer<typeof userSchema>;

export type FetchUsersParams = {
  search?: string;
  role?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
};

export type CreateUserPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
  roles: Array<"admin" | "manager" | "cashier" | "technician">;
  is_active?: boolean;
  notes?: string;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">> & {
  password?: string;
};

/**
 * Fetch all users with optional pagination and search
 */
export async function fetchUsers(
  params?: FetchUsersParams,
  config?: AxiosRequestConfig
) {
  const requestConfig: AxiosRequestConfig = {
    params,
    ...config,
  };
  const { data } = await apiClient.get("/users", requestConfig);
  return paginatedUserSchema.parse({
    data: data.data,
    meta: data,
  });
}

/**
 * Fetch a single user by ID
 */
export async function fetchUser(
  userId: string,
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get(`/users/${userId}`, config);
  return userSchema.parse(data);
}

/**
 * Create a new user
 */
export async function createUser(payload: CreateUserPayload) {
  const { data } = await apiClient.post("/users", payload);
  return userSchema.parse(data);
}

/**
 * Update an existing user
 */
export async function updateUser(
  userId: string,
  payload: UpdateUserPayload
) {
  const { data } = await apiClient.put(`/users/${userId}`, payload);
  return userSchema.parse(data);
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  await apiClient.delete(`/users/${userId}`);
}

/**
 * Toggle user active status
 */
export async function toggleUserStatus(userId: string) {
  const { data } = await apiClient.patch(`/users/${userId}/toggle-status`);
  return userSchema.parse(data);
}
