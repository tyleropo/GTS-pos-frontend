
export type PurchaseOrder = {
  id: string;
  po_number: string;
  date: string;
  supplier: string;
  items: number;
  total: number;
  status: string;
  paymentStatus: string;
  deliveryDate: string;
};
