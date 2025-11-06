import type { Product } from "@/src/lib/api/products";

export type InventoryItem = Product;

export type NewInventoryItem = {
  name: string;
  sku?: string;
  barcode?: string | null;
  description?: string | null;
  category_id?: string | null;
  supplier_id?: string | null;
  brand?: string | null;
  model?: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  reorder_level: number;
  tax_rate?: number;
  markup_percentage?: number | null;
  unit_of_measure?: string;
  is_serialized?: boolean;
  warranty_period?: number | null;
};
