import { Customer } from "@/src/types/customer";
import { Repair } from "@/src/types/repair";
// Use CustomerOrder for billing
import { CustomerOrder } from "@/src/lib/api/customer-orders";
import {
  BillingLineItem,
  BillingStatement,
  BillingPeriod,
} from "@/src/types/billing";
import { isWithinInterval, parseISO } from "date-fns";

/**
 * Filter items by date range
 */
export function filterByDateRange<T>(
  items: T[],
  startDate: Date,
  endDate: Date,
  dateAccessor: (item: T) => string = (item: any) => item.date
): T[] {
  return items.filter((item) => {
    try {
      const dateStr = dateAccessor(item);
      if (!dateStr) return false;
      const itemDate = parseISO(dateStr);
      return isWithinInterval(itemDate, { start: startDate, end: endDate });
    } catch {
      return false;
    }
  });
}

/**
 * Aggregate repairs and customer orders for a customer within a date range
 */
export function aggregateCustomerData(
  customer: Customer,
  repairs: Repair[],
  orders: CustomerOrder[],
  period: BillingPeriod
): BillingLineItem[] {
  const lineItems: BillingLineItem[] = [];

  // Filter repairs for this customer within date range
  const customerRepairs = repairs.filter(
    (repair) => 
        (repair.customerId && String(repair.customerId) === String(customer.id)) || 
        repair.customer === customer.name
  );
  
  const filteredRepairs = filterByDateRange(
    customerRepairs,
    period.startDate,
    period.endDate,
    (r) => r.date
  );

  // Add repair line items
  filteredRepairs.forEach((repair) => {
    // 1. Add labor cost as a repair line item if > 0
    if (repair.cost > 0) {
        lineItems.push({
            id: String(repair.id) + "-labor",
            date: repair.date,
            type: "repair",
            description: `${repair.device} - ${repair.issue} (Labor/Service)`,
            referenceId: repair.ticketNumber || String(repair.id),
            amount: repair.cost,
        });
    }

    // 2. Add parts as product line items
    if (repair.products && repair.products.length > 0) {
        repair.products.forEach((product, index) => {
            const qty = product.pivot?.quantity || 1;
            const price = product.pivot?.unit_price || product.selling_price || 0;
            const lineTotal = product.pivot?.total_price || (qty * price);

            lineItems.push({
                id: String(repair.id) + "-part-" + (product.id || index),
                date: repair.date,
                type: "product", // Classify as product so it appears in the products section
                description: `Part: ${product.name} (Ticket: ${repair.ticketNumber})`,
                referenceId: repair.ticketNumber,
                quantity: qty,
                unitPrice: price,
                amount: lineTotal
            });
        });
    } else if (repair.cost === 0 && (!repair.products || repair.products.length === 0)) {
        // Fallback for empty repair with 0 cost - just to show it exists
        lineItems.push({
            id: String(repair.id),
            date: repair.date,
            type: "repair",
            description: `${repair.device} - ${repair.issue}`,
            referenceId: repair.ticketNumber || String(repair.id),
            amount: 0,
        });
    }
  });

  // Filter orders for this customer within date range
  const customerOrders = orders.filter(
    (order) => {
       // Check ID match if available
       if (order.customer_id && String(order.customer_id) === String(customer.id)) return true;
       // Fallback to name match if populated
       if (order.customer && order.customer.name === customer.name) return true;
       return false;
    }
  );
  
  const filteredOrders = filterByDateRange(
    customerOrders,
    period.startDate,
    period.endDate,
    (o) => o.created_at || "" // Handle API created_at
  );

  // Add order/product line items
  filteredOrders.forEach((order) => {
    const items = order.items || [];

    // Get date string safely
    const orderDate = order.created_at || "";
    const formattedDate = orderDate.split('T')[0]; // Ensure YYYY-MM-DD
    
    if (Array.isArray(items) && items.length > 0) {
        // Explode items into individual line items
        items.forEach((item: any, index: number) => {
            const qty = item.quantity_ordered || 1;
            const price = item.unit_cost || 0;
            const lineTotal = item.line_total || (qty * price);

            lineItems.push({
            id: String(order.id) + "-" + index,
            date: formattedDate,
            type: "product",
            description: item.product_name || `Product ${index + 1}`,
            referenceId: order.co_number || String(order.id),
            amount: lineTotal,
            quantity: qty,
            unitPrice: price
          });
        });
    } else {
        // Fallback for orders without items
        lineItems.push({
          id: String(order.id),
          date: formattedDate,
          type: "product",
          description: `Order ${order.co_number} [Summary]`,
          referenceId: order.co_number || String(order.id),
          amount: typeof order.total === 'number' ? order.total : parseFloat(String(order.total) || '0'),
        });
    }
  });

  // Sort by date (newest first)
  lineItems.sort((a, b) => {
    const dateA = parseISO(a.date);
    const dateB = parseISO(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  return lineItems;
}

/**
 * Generate complete billing statement
 */
export function generateBillingStatement(
  customer: Customer,
  repairs: Repair[],
  orders: CustomerOrder[],
  period: BillingPeriod
): BillingStatement {
  const lineItems = aggregateCustomerData(
    customer,
    repairs,
    orders,
    period
  );

  // Calculate subtotals
  const repairSubtotal = lineItems
    .filter((item) => item.type === "repair")
    .reduce((sum, item) => sum + item.amount, 0);

  const productSubtotal = lineItems
    .filter((item) => item.type === "product")
    .reduce((sum, item) => sum + item.amount, 0);

  const grandTotal = repairSubtotal + productSubtotal;

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    },
    period,
    lineItems,
    repairSubtotal,
    productSubtotal,
    grandTotal,
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

/**
 * Get the quarterly period for a given date
 */
export function getQuarterlyPeriod(date: Date): BillingPeriod {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const quarter = Math.floor(month / 3); // 0-3

  const startMonth = quarter * 3;
  const endMonth = startMonth + 2;

  return {
    startDate: new Date(year, startMonth, 1),
    endDate: new Date(year, endMonth + 1, 0, 23, 59, 59, 999), // Last day of month
  };
}

/**
 * Get the current quarter
 */
export function getCurrentQuarter(): BillingPeriod {
  return getQuarterlyPeriod(new Date());
}

/**
 * Get previous N quarters
 */
export function getPreviousQuarters(count: number): BillingPeriod[] {
  const quarters: BillingPeriod[] = [];
  const currentDate = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i * 3,
      1
    );
    quarters.push(getQuarterlyPeriod(date));
  }

  return quarters;
}

/**
 * Get monthly period for a given date
 */
export function getMonthlyPeriod(date: Date): BillingPeriod {
  const year = date.getFullYear();
  const month = date.getMonth();

  return {
    startDate: new Date(year, month, 1),
    endDate: new Date(year, month + 1, 0, 23, 59, 59, 999),
  };
}

/**
 * Format period label for display
 */
export function formatPeriodLabel(
  period: BillingPeriod,
  type: "quarterly" | "monthly" | "custom"
): string {
  const startYear = period.startDate.getFullYear();
  const startMonth = period.startDate.getMonth();

  if (type === "quarterly") {
    const quarter = Math.floor(startMonth / 3) + 1;
    return `Q${quarter} ${startYear}`;
  }

  if (type === "monthly") {
    const monthName = period.startDate.toLocaleString("default", {
      month: "long",
    });
    return `${monthName} ${startYear}`;
  }

  // Custom
  return `${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()}`;
}

/**
 * Get quarter number and year from a date
 */
export function getQuarterInfo(date: Date): { quarter: number; year: number } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  return { quarter, year };
}

/**
 * Get period from quarter and year
 */
export function getPeriodFromQuarter(
  quarter: number,
  year: number
): BillingPeriod {
  const startMonth = (quarter - 1) * 3;
  const endMonth = startMonth + 2;

  return {
    startDate: new Date(year, startMonth, 1),
    endDate: new Date(year, endMonth + 1, 0, 23, 59, 59, 999),
  };
}
