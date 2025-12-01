export type BillingLineItemType = "repair" | "product";

export interface BillingLineItem {
  id: string;
  date: string;
  type: BillingLineItemType;
  description: string;
  referenceId: string;
  amount: number;
}

export interface BillingPeriod {
  startDate: Date;
  endDate: Date;
}

export interface BillingStatement {
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  period: BillingPeriod;
  lineItems: BillingLineItem[];
  repairSubtotal: number;
  productSubtotal: number;
  grandTotal: number;
}

export type ExportFormat = "print" | "pdf" | "docx";

export type {
  DocumentFormatSettings,
  BillingPeriodType,
  CustomerBillingTab,
} from "./DocumentFormatSettings";
export { DEFAULT_FORMAT_SETTINGS } from "./DocumentFormatSettings";
