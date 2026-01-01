import { Product } from "@/src/lib/api/products";

export type RepairProduct = Product & {
    pivot?: {
        quantity: number;
        unit_price: number;
        total_price?: number;
    }
};

export type Repair = {
  id: string;
  ticketNumber: string;
  date: string;
  customer: string;
  customerId?: string;
  device: string;
  deviceModel: string;
  serialNumber?: string;
  issue: string;
  status: string;
  resolution?: string;
  cost: number;
  technician: string;
  completionDate: string;
  products?: RepairProduct[];
};
