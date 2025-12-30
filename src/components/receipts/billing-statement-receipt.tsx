import React, { forwardRef } from "react";
import { BillingStatement, DocumentFormatSettings } from "@/src/types/billing";
import { format } from "date-fns";
import { ReceiptSettings } from "@/src/components/modals/receipt-settings-modal";

// Reuse standard receipt settings structure or create a simplified one
interface BillingStatementReceiptProps {
  statement: BillingStatement;
  // We can optionally pass receipt settings if we want to reuse store info
  // For now, let's hardcode or accept optional settings
  settings?: ReceiptSettings;
}

export const BillingStatementReceipt = forwardRef<HTMLDivElement, BillingStatementReceiptProps>(
  ({ statement, settings }, ref) => {
    // Fallback store info if settings are not provided or used
    const storeName = settings?.storeName || "My Store";
    const storeAddress = settings?.storeAddress || "123 Main St, City";
    const contactInfo = settings?.contactInfo || "Phone: (123) 456-7890";
    const footerMessage = settings?.footerMessage || "Thank you for your business!";
    const showRef = settings?.showReferenceNumber ?? true;

    return (
      <div
        ref={ref}
        className="p-8 max-w-[80mm] mx-auto text-xs font-mono leading-tight bg-white text-black"
        style={{ width: "80mm" }} // Force width for receipt printers
      >
        {/* -- Header -- */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold uppercase mb-1">{storeName}</h1>
          <div className="whitespace-pre-wrap mb-1">{storeAddress}</div>
          <div className="whitespace-pre-wrap">{contactInfo}</div>
        </div>

        <div className="text-center border-b border-dashed border-black pb-2 mb-2 font-bold uppercase">
          Billing Statement
        </div>

        {/* -- Statement Info -- */}
        <div className="border-b border-dashed border-black pb-2 mb-2">
            <div className="flex justify-between">
                <span>Date:</span>
                <span>{format(new Date(), "yyyy-MM-dd HH:mm")}</span>
            </div>
            <div className="flex justify-between">
                <span>Period:</span>
                <span>{format(statement.period.startDate, "MMM d")} - {format(statement.period.endDate, "MMM d, yyyy")}</span>
            </div>
             <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold">{statement.customer.name}</span>
            </div>
        </div>

        {/* -- Items (Summary of Transactions/Repairs) -- */}
        <div className="mb-2">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-black">
                        <th className="pb-1 w-[40%]">Date/Ref</th>
                        <th className="pb-1 text-right">Type</th>
                        <th className="pb-1 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {statement.lineItems.map((item, idx) => (
                        <tr key={idx}>
                            <td className="py-1 align-top pr-1">
                                <div>{format(item.date, "MM/dd")}</div>
                                <div className="text-[10px] text-gray-600">{item.referenceId}</div>
                            </td>
                            <td className="py-1 align-top text-right uppercase text-[10px]">{item.type}</td>
                            <td className="py-1 align-top text-right">{item.amount.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* -- Totals -- */}
        <div className="border-t border-dashed border-black pt-2 mb-4">
            <div className="flex justify-between font-bold text-sm">
                <span>TOTAL DUE</span>
                <span>₱{statement.grandTotal.toFixed(2)}</span>
            </div>
        </div>

         {/* -- Footer -- */}
         <div className="text-center whitespace-pre-wrap border-t border-dashed border-black pt-4">
            {footerMessage}
        </div>

      </div>
    );
  }
);

BillingStatementReceipt.displayName = "BillingStatementReceipt";
