export interface CustomerOrder {
  id: string;
  co_number: string;
  date: string;
  customer: string;
  items: number;
  total: number;
  status: "Pending" | "Draft" | "Processing" | "Submitted" | "Completed" | "Fulfilled" | "Delivered" | "Cancelled";
  paymentStatus: "Paid" | "Pending" | "Partial" | "Refunded" | "paid" | "pending" | "partial" | "refunded";
  deliveryDate?: string | null;
}
