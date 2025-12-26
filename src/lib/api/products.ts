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

export const categorySchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  description: z.string().nullable().optional(),
  parent_id: z.string().nullable().optional(),
});

export const supplierSchema = z.object({
  id: z.union([z.string(), z.number()]),
  supplier_code: z.string().optional(),
  company_name: z.string().optional(),
  contact_person: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

const priceNumber = z.union([z.number(), z.string()]).transform((val) => {
  const numericValue =
    typeof val === "string" ? parseFloat(val as string) : (val as number);
  return Number.isFinite(numericValue) ? numericValue : 0;
});

export const productSchema = z.object({
  id: z.union([z.string(), z.number()]),
  sku: z.string(),
  barcode: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  category_id: z.string().nullable(),
  supplier_id: z.string().nullable(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  cost_price: priceNumber,
  selling_price: priceNumber,
  markup_percentage: priceNumber.nullable().optional(),
  tax_rate: priceNumber.nullable().optional(),
  stock_quantity: z.coerce.number(),
  reorder_level: z.coerce.number(),
  max_stock_level: z.coerce.number().nullish(),
  image_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  category: categorySchema.nullable().optional(),
  supplier: supplierSchema.nullable().optional(),
  total_sold: z.coerce.number().optional(),
  sales_value: priceNumber.nullable().optional(),
});

const paginatedProductSchema = z.object({
  data: z.array(productSchema),
  meta: paginationMetaSchema.optional(),
});

export type Product = z.infer<typeof productSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Supplier = z.infer<typeof supplierSchema>;

export type FetchProductsParams = {
  search?: string;
  category_id?: string;
  page?: number;
  per_page?: number;
  low_stock?: boolean;
};

export async function fetchProducts(
  params?: FetchProductsParams,
  config?: AxiosRequestConfig
) {
  const requestConfig: AxiosRequestConfig = {
    params,
    ...config,
  };
  const { data } = await apiClient.get("/products", requestConfig);
  return paginatedProductSchema.parse(data);
}

export async function fetchLowStockProducts() {
  const { data } = await apiClient.get("/products/low-stock");
  return z.array(productSchema).parse(data);
}

export async function fetchProductCategories(config?: AxiosRequestConfig) {
  const { data } = await apiClient.get("/products/categories", config);
  return z.array(categorySchema).parse(data);
}

export async function fetchProductByBarcode(
  barcode: string,
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get(`/products/barcode/${barcode}`, config);
  return productSchema.parse(data);
}

export async function createProduct(payload: Partial<Product>) {
  const { data } = await apiClient.post("/products", payload);
  return productSchema.parse(data);
}

export async function updateProduct(
  productId: string,
  payload: Partial<Product>
) {
  const { data } = await apiClient.put(`/products/${productId}`, payload);
  return productSchema.parse(data);
}

export async function uploadProductImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await apiClient.post("/products/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return z.object({ url: z.string() }).parse(data);
}
