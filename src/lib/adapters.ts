/**
 * Type adapters to convert API responses to component-compatible types
 * This allows the frontend components to work with both mock data and real API data
 */

import type { Customer as APICustomer } from "@/src/lib/api/customers";
import type { Transaction as APITransaction } from "@/src/lib/api/transactions";
import type { PurchaseOrder as APIPurchaseOrder } from "@/src/lib/api/purchase-orders";
import type { Repair as APIRepair } from "@/src/lib/api/repairs";

import type { Customer } from "@/src/types/customer";
import type { Transaction } from "@/src/types/transactions";
import type { PurchaseOrder } from "@/src/types/purchaseOrder";
import type { Repair } from "@/src/types/repair";

/**
 * Convert API customer to component customer
 */
export function adaptCustomer(apiCustomer: APICustomer): Customer {
  return {
    id: apiCustomer.id,
    name: apiCustomer.name,
    email: apiCustomer.email || null,
    phone: apiCustomer.phone || null,
    address: apiCustomer.address || null,
    company: apiCustomer.company || null,
    created_at: apiCustomer.created_at,
    updated_at: apiCustomer.updated_at,
    totalSpent: apiCustomer.total_spent || 0,
    orders: apiCustomer.transactions_count || 0,
    lastPurchase:
      apiCustomer.transactions_count && apiCustomer.transactions_count > 0
        ? apiCustomer.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0]
        : "N/A",
    status: (apiCustomer.status as "Active" | "Inactive") || "Active",
    type: apiCustomer.type || "Regular",
  };
}

/**
 * Convert API transaction to component transaction
 */
export function adaptTransaction(apiTransaction: APITransaction): Transaction {
  const created = apiTransaction.created_at || new Date().toISOString();
  const [date, timeWithMs] = created.split("T");
  const time = timeWithMs ? timeWithMs.split(".")[0] : "00:00:00";

  return {
    id: String(apiTransaction.id),
    invoice_number: apiTransaction.invoice_number || String(apiTransaction.id),
    date: date || new Date().toISOString().split("T")[0],
    time: time,
    customer: apiTransaction.customer?.name || "Walk-in",
    items: apiTransaction.items?.length || 0,
    lineItems:
      apiTransaction.items?.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name || "Unknown Product",
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        line_total: Number(item.line_total),
      })) || [],
    total: apiTransaction.total,
    paymentMethod:
      apiTransaction.payment_method === "cash"
        ? "Cash"
        : apiTransaction.payment_method === "card"
        ? "Credit Card"
        : "GCash",
    status: "Completed", // Transactions from backend are completed
    cashier: "System", // Can be enhanced if backend provides this
  };
}

/**
 * Convert API purchase order to component purchase order
 */
export function adaptPurchaseOrder(
  apiPurchaseOrder: APIPurchaseOrder
): PurchaseOrder {
  const created = apiPurchaseOrder.created_at || new Date().toISOString();
  const date = created.split("T")[0];

  return {
    id: String(apiPurchaseOrder.id),
    po_number: apiPurchaseOrder.po_number || String(apiPurchaseOrder.id),
    date: date,
    customer:
      apiPurchaseOrder.customer?.company ||
      apiPurchaseOrder.customer?.name ||
      "Unknown Customer",
    items: apiPurchaseOrder.items?.length || 0,
    total: apiPurchaseOrder.total,
    status:
      apiPurchaseOrder.status.charAt(0).toUpperCase() +
      apiPurchaseOrder.status.slice(1),
    paymentStatus: 
      apiPurchaseOrder.payments && apiPurchaseOrder.payments.length > 0 
        ? "Paid" 
        : "Pending",
    deliveryDate: apiPurchaseOrder.expected_at || date,
  };
}

/**
 * Convert API repair to component repair
 */
export function adaptRepair(apiRepair: APIRepair): Repair {
  const created = apiRepair.created_at || new Date().toISOString();
  const date = created.split("T")[0];

  // Format status for display
  const statusMap: Record<string, string> = {
    pending: "Diagnostic",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return {
    id: String(apiRepair.id),
    ticketNumber: apiRepair.ticket_number,
    date: date,
    customer: apiRepair.customer?.name || "Walk-in",
    customerId: apiRepair.customer_id ? String(apiRepair.customer_id) : undefined,
    device: apiRepair.device || "Unknown",
    deviceModel: apiRepair.device_model || apiRepair.device || "Unknown",
    serialNumber: apiRepair.serial_number || undefined,
    issue: apiRepair.issue_description || "No description",
    status: statusMap[apiRepair.status] || apiRepair.status,
    resolution: apiRepair.resolution || undefined,
    cost: apiRepair.cost || 0,
    technician: apiRepair.technician || "Unassigned",
    completionDate: apiRepair.promised_at?.split("T")[0] || date,
  };
}
