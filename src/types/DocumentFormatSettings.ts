export type BillingPeriodType = "quarterly" | "monthly" | "custom";

export interface DocumentFormatSettings {
  companyName: string;
  fontSize: "small" | "medium" | "large";
  colorScheme: "default" | "blue" | "green" | "monochrome";
  pageOrientation: "portrait" | "landscape";
  headerText?: string;
  footerText?: string;
  includeLogo: boolean;
}

export interface CustomerBillingTab {
  customerId: string;
  customerName: string;
  isActive: boolean;
}

export const DEFAULT_FORMAT_SETTINGS: DocumentFormatSettings = {
  companyName: "POS System",
  fontSize: "medium",
  colorScheme: "default",
  pageOrientation: "portrait",
  includeLogo: false,
};
