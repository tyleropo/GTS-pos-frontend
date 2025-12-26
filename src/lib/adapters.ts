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
    id:
      typeof apiCustomer.id === "number"
        ? apiCustomer.id
        : parseInt(apiCustomer.id as string, 10) || 0,
    name: apiCustomer.name,
    email: apiCustomer.email || null,
    phone: apiCustomer.phone || null,
    address: apiCustomer.address || null,
    company: apiCustomer.company || null,
    created_at: apiCustomer.created_at,
    updated_at: apiCustomer.updated_at,
    totalSpent: apiCustomer.total_spent || 0,
    orders: apiCustomer.transaction_count || 0,
    lastPurchase:
      apiCustomer.created_at || new Date().toISOString().split("T")[0],
    status: "Active", // Default to Active, can be enhanced based on business logic
    type:
      apiCustomer.total_spent && apiCustomer.total_spent > 100000
        ? "VIP"
        : "Regular",
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
    date: date,
    customer:
      apiPurchaseOrder.supplier?.company_name ||
      apiPurchaseOrder.supplier?.supplier_code ||
      "Unknown Supplier",
    items: apiPurchaseOrder.items?.length || 0,
    total: apiPurchaseOrder.total,
    status:
      apiPurchaseOrder.status.charAt(0).toUpperCase() +
      apiPurchaseOrder.status.slice(1),
    paymentStatus: apiPurchaseOrder.status === "received" ? "Paid" : "Pending",
    deliveryDate: apiPurchaseOrder.expected_at || date,
  };
}

/**
 * Convert API repair to component repair
 */
export function adaptRepair(apiRepair: APIRepair): Repair {
  const created = apiRepair.created_at || new Date().toISOString();
  const date = created.split("T")[0];

  return {
    id: String(apiRepair.id),
    date: date,
    customer: apiRepair.customer?.name || "Unknown",
    device: apiRepair.device,
    deviceModel: apiRepair.device, // Backend doesn't separate device/model
    issue: apiRepair.issue_description || "No description",
    status:
      apiRepair.status.charAt(0).toUpperCase() +
      apiRepair.status.slice(1).replace("_", " "),
    cost: 0, // Backend doesn't track repair cost in this model
    technician: "Unassigned", // Backend doesn't track technician
    completionDate: apiRepair.promised_at || date,
  };
}
