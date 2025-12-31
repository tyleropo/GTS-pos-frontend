"use client";

import { apiClient } from "@/src/lib/api-client";
import { z } from "zod";
import type { AxiosRequestConfig } from "axios";

// Sales Report Schema
export const salesReportSchema = z.object({
  total_revenue: z.number(),
  total_transactions: z.number(),
  total_tax: z.number(),
  total_discount: z.number(),
  average_transaction: z.number().nullable(),
  transactions_by_status: z.array(
    z.object({
      status: z.string().nullable(),
      count: z.number(),
      total: z.number(),
    })
  ),
  daily_sales: z.array(
    z.object({
      date: z.string(),
      count: z.number(),
      total: z.number(),
    })
  ),
});

// Inventory Report Schema
export const inventoryReportSchema = z.object({
  total_products: z.number(),
  total_stock_value: z.number(),
  low_stock_products: z.array(z.any()),
  out_of_stock_products: z.number(),
  products_by_category: z.array(
    z.object({
      category: z.string().nullable(),
      count: z.number(),
    })
  ),
});

// Customer Report Schema
export const customerReportSchema = z.object({
  total_customers: z.number(),
  customers_by_type: z.array(
    z.object({
      type: z.string(),
      count: z.number(),
    })
  ),
  top_customers: z.array(z.any()),
});

// Government Markup Report Schema
export const governmentMarkupReportSchema = z.object({
  total_government_orders: z.number(),
  total_government_revenue: z.number(),
  government_orders: z.array(z.any()),
});

// Payment Report Schema
export const paymentReportSchema = z.object({
  total_payments_collected: z.number(),
  total_payments_count: z.number(),
  payments_by_method: z.array(
    z.object({
      payment_method: z.string(),
      count: z.number(),
      total: z.number(),
    })
  ),
  outstanding_balance: z.number(),
  orders_by_payment_status: z.array(
    z.object({
      payment_status: z.string(),
      count: z.number(),
      total_amount: z.number(),
    })
  ),
});

export type SalesReport = z.infer<typeof salesReportSchema>;
export type InventoryReport = z.infer<typeof inventoryReportSchema>;
export type CustomerReport = z.infer<typeof customerReportSchema>;
export type GovernmentMarkupReport = z.infer<typeof governmentMarkupReportSchema>;
export type PaymentReport = z.infer<typeof paymentReportSchema>;

export type ReportParams = {
  date_from?: string;
  date_to?: string;
  threshold?: number;
};

/**
 * Fetch sales report
 */
export async function fetchSalesReport(
  params?: ReportParams,
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get("/reports/sales", {
    params,
    ...config,
  });
  return salesReportSchema.parse(data);
}

/**
 * Fetch inventory report
 */
export async function fetchInventoryReport(
  params?: ReportParams,
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get("/reports/inventory", {
    params,
    ...config,
  });
  return inventoryReportSchema.parse(data);
}

/**
 * Fetch customer report
 */
export async function fetchCustomerReport(
  params?: ReportParams,
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get("/reports/customer", {
    params,
    ...config,
  });
  return customerReportSchema.parse(data);
}

/**
 * Fetch government markup report
 */
export async function fetchGovernmentMarkupReport(
  params?: ReportParams,
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get("/reports/government-markup", {
    params,
    ...config,
  });
  return governmentMarkupReportSchema.parse(data);
}

/**
 * Fetch payment report
 */
export async function fetchPaymentReport(
  params?: ReportParams,
  config?: AxiosRequestConfig
) {
  const { data } = await apiClient.get("/reports/payment", {
    params,
    ...config,
  });
return paymentReportSchema.parse(data);
}

/**
 * Export report to CSV
 */
export async function exportReport(params: {
  report_type: "sales" | "inventory" | "customer" | "government" | "payment";
  date_from?: string;
  date_to?: string;
}) {
  const { data } = await apiClient.post("/reports/export", params, {
    responseType: "blob",
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `${params.report_type}_report_${new Date().toISOString().split("T")[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
