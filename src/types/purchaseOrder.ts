
export type PurchaseOrder = {
  id: string;
  po_number: string;
  date: string;
  customer: string;
  items: number;
  total: number;
  status: string;
  paymentStatus: string;
  deliveryDate: string;
};
