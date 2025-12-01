import { Customer } from "@/src/types/customer";
import { Repair } from "@/src/types/repair";
import { Transaction } from "@/src/types/transactions";
import {
  BillingLineItem,
  BillingStatement,
  BillingPeriod,
} from "@/src/types/billing";
import { isWithinInterval, parseISO } from "date-fns";

/**
 * Filter items by date range
 */
export function filterByDateRange<T extends { date: string }>(
  items: T[],
  startDate: Date,
  endDate: Date
): T[] {
  return items.filter((item) => {
    try {
      const itemDate = parseISO(item.date);
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
  );
  const filteredRepairs = filterByDateRange(
    customerRepairs,
    period.startDate,
    period.endDate
  );

  // Add repair line items
  filteredRepairs.forEach((repair) => {
    lineItems.push({
      id: repair.id,
      date: repair.date,
      type: "repair",
      description: `${repair.device} - ${repair.issue}`,
      referenceId: repair.id,
      amount: repair.cost,
    });
  });

  // Filter transactions for this customer within date range
  const customerTransactions = transactions.filter(
    (transaction) => transaction.customer === customer.name
  );
  const filteredTransactions = filterByDateRange(
    customerTransactions,
    period.startDate,
    period.endDate
  );

  // Add transaction/product line items
  filteredTransactions.forEach((transaction) => {
    lineItems.push({
      id: transaction.id,
      date: transaction.date,
      type: "product",
      description: `Products (${transaction.items} items)`,
      referenceId: transaction.id,
      amount: transaction.total,
    });
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
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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
