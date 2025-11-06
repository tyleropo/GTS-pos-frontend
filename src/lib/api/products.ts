"use client";

import { apiClient } from "@/src/lib/api-client";
import { z } from "zod";

const paginationMetaSchema = z
  .object({
    current_page: z.number().optional(),
    last_page: z.number().optional(),
    per_page: z.number().optional(),
    total: z.number().optional(),
  })
  .passthrough();

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  parent_id: z.string().nullable().optional(),
});

export const supplierSchema = z.object({
  id: z.string().uuid(),
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
  id: z.string().uuid(),
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
  unit_of_measure: z.string().nullable().optional(),
  weight: priceNumber.nullable().optional(),
  dimensions: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  is_serialized: z.boolean().default(false),
  warranty_period: z.coerce.number().nullable().optional(),
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

export async function fetchProducts(params?: FetchProductsParams) {
  const { data } = await apiClient.get("/products", { params });
  return paginatedProductSchema.parse(data);
}

export async function fetchLowStockProducts() {
  const { data } = await apiClient.get("/products/low-stock");
  return z.array(productSchema).parse(data);
}

export async function fetchProductCategories() {
  const { data } = await apiClient.get("/products/categories");
  return z.array(categorySchema).parse(data);
}

export async function fetchProductByBarcode(barcode: string) {
  const { data } = await apiClient.get(`/products/barcode/${barcode}`);
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
