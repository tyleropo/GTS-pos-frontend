/**
 * Format a number as currency with thousands separators and 2 decimal places
 * @param amount - The numeric amount to format
 * @returns Formatted string with thousands separators (e.g., "1,234.56")
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
