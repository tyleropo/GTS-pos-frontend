import { Customer } from "@/src/types/customer";
import { Repair } from "@/src/types/repair";
// Use the API transaction type which is more complete, or valid "any" for now to support migration
import { Transaction } from "@/src/lib/api/transactions";
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
 * Aggregate repairs and transactions for a customer within a date range
 */
export function aggregateCustomerData(
  customer: Customer,
  repairs: Repair[],
  transactions: Transaction[],
  period: BillingPeriod
): BillingLineItem[] {
  const lineItems: BillingLineItem[] = [];

  // Filter repairs for this customer within date range
  const customerRepairs = repairs.filter(
    (repair) => repair.customer === customer.name 
    // Note: If API doesn't return customer name in repair, this check might fail. 
    // Ideally we filter by customer_id if available, but for now name match.
    // Or we rely on the caller passing already filtered list.
  );
  
  const filteredRepairs = filterByDateRange(
    customerRepairs,
    period.startDate,
    period.endDate,
    (r) => r.date
  );

  // Add repair line items
  filteredRepairs.forEach((repair) => {
    lineItems.push({
      id: String(repair.id),
      date: repair.date,
      type: "repair",
      description: `${repair.device} - ${repair.issue}`,
      referenceId: String(repair.id),
      amount: repair.cost,
    });
  });

  // Filter transactions for this customer within date range
  // We assume transactions are already filtered by customer_id/ids from API if passed.
  // But let's keep name check if possible, or skip it if we blindly trust caller.
  // Checking transaction.customer_id vs customer.id is better.
  const customerTransactions = transactions.filter(
    (transaction) => {
       // Check ID match if available
       if (transaction.customer_id && String(transaction.customer_id) === String(customer.id)) return true;
       // Fallback to name match if populated
       if (transaction.customer && transaction.customer.name === customer.name) return true;
       return false;
    }
  );
  
  const filteredTransactions = filterByDateRange(
    customerTransactions,
    period.startDate,
    period.endDate,
    (t) => t.created_at || (t as any).date || "" // Handle API created_at or mock date
  );

  // Add transaction/product line items
  filteredTransactions.forEach((transaction) => {
    // Check if items is array or number (handling both mock and API structure)
    // We expect API to return items array now
    const items = (transaction as any).items || transaction.items;

    // Get date string safely
    const txDate = transaction.created_at || (transaction as any).date || "";
    const formattedDate = txDate.split('T')[0]; // Ensure YYYY-MM-DD
    
    if (Array.isArray(items) && items.length > 0) {
        // Explode items into individual line items
        items.forEach((item: any, index: number) => {
            const qty = item.quantity || 1;
            const price = item.unit_price || 0;
            const lineTotal = item.line_total || (qty * price);

           lineItems.push({
            id: String(transaction.id) + "-" + index,
            date: formattedDate,
            type: "product",
            description: item.product_name || `Product ${index + 1}`,
            referenceId: transaction.invoice_number || String(transaction.id),
            amount: lineTotal,
            quantity: qty,
            unitPrice: price
          });
        });
    } else {
        // Fallback for transactions without items (legacy/mock or summary only)
        const itemCount = typeof items === 'number' ? items : 0;
        
        lineItems.push({
          id: String(transaction.id),
          date: formattedDate,
          type: "product",
          description: `Products (${itemCount} items) - [Summary]`,
          referenceId: transaction.invoice_number || String(transaction.id),
          amount: typeof transaction.total === 'number' ? transaction.total : parseFloat(String(transaction.total) || '0'),
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
  transactions: Transaction[],
  period: BillingPeriod
): BillingStatement {
  const lineItems = aggregateCustomerData(
    customer,
    repairs,
    transactions,
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
