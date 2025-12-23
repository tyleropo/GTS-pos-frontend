"use client";

import { apiClient } from "@/src/lib/api-client";
import { categorySchema } from "@/src/lib/api/products";
import { z } from "zod";
import type { AxiosRequestConfig } from "axios";
import type { Category } from "@/src/lib/api/products";

export type { Category };

export type CreateCategoryPayload = {
  name: string;
  description?: string;
  parent_id?: string;
};

/**
 * Fetch all categories
 */
export async function fetchCategories(config?: AxiosRequestConfig) {
  const { data } = await apiClient.get("/categories", config);
  return z.array(categorySchema).parse(data);
}

/**
 * Create a new category
 */
export async function createCategory(payload: CreateCategoryPayload) {
  const { data } = await apiClient.post("/categories", payload);
  return categorySchema.parse(data);
}
