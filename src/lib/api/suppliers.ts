
import { apiClient } from "@/src/lib/api-client";
import { z } from "zod";

export const supplierSchema = z.object({
  id: z.string(),
  company_name: z.string(),
  supplier_code: z.string().optional(),
  contact_person: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type Supplier = z.infer<typeof supplierSchema>;

export type FetchSuppliersParams = {
  page?: number;
  per_page?: number;
  search?: string;
};

const paginatedSupplierSchema = z.object({
  data: z.array(supplierSchema),
  meta: z.object({
    current_page: z.number().optional(),
    last_page: z.number().optional(),
    per_page: z.number().optional(),
    total: z.number().optional(),
  }).optional(),
});

export async function fetchSuppliers(params?: FetchSuppliersParams) {
  const { data } = await apiClient.get("/suppliers", { params });
  return paginatedSupplierSchema.parse(data);
}
