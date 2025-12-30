export type Customer = {
  id: number | string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  company?: string | null;
  created_at?: string;
  updated_at?: string;
  // Computed from backend
  totalSpent?: number;
  orders?: number;
  // For UI compatibility - optional fields
  lastPurchase?: string;
  status?: "Active" | "Inactive" | string | null;
  type?: string | null;
};
