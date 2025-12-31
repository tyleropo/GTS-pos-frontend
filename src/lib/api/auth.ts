"use client";

import { apiClient } from "@/src/lib/api-client";
import { z } from "zod";

const userRoleSchema = z.enum(["admin", "manager", "cashier", "technician"]);

export const userSchema = z.object({
  id: z.union([z.string(), z.number()]),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  roles: z.array(userRoleSchema),
  is_active: z.boolean().default(true),
  last_login_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const authResponseSchema = z
  .object({
    token: z.string().optional(),
    access_token: z.string().optional(),
    refresh_token: z.string().nullable().optional(),
    user: userSchema,
    expires_in: z.number().optional(),
    token_type: z.string().optional(),
    abilities: z.array(z.string()).optional(),
  })
  .transform((payload) => {
    const token = payload.token ?? payload.access_token;
    if (!token) {
      throw new Error("Missing access token in auth response.");
    }
    return {
      accessToken: token,
      refreshToken: payload.refresh_token ?? null,
      user: payload.user,
      expiresIn: payload.expires_in ?? null,
      tokenType: payload.token_type ?? "Bearer",
      abilities: payload.abilities ?? [],
    };
  });

export type AuthUser = z.infer<typeof userSchema>;

export type AuthResponse = z.infer<typeof authResponseSchema>;

export type LoginPayload = {
  email: string;
  password: string;
  device_name?: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  password_confirmation: string;
  first_name: string;
  last_name: string;
  roles?: z.infer<typeof userRoleSchema>[];
};

export async function login(payload: LoginPayload) {
  const { data } = await apiClient.post("/login", payload);
  return authResponseSchema.parse(data);
}

export async function register(payload: RegisterPayload) {
  const { data } = await apiClient.post("/register", payload);
  return authResponseSchema.parse(data);
}

export async function logout() {
  await apiClient.post("/logout");
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get("/me");
  return userSchema.parse(data);
}
