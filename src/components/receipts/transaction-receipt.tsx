import React, { forwardRef } from "react";
import { Transaction } from "@/src/types/transactions";
import { ReceiptSettings } from "@/src/components/modals/receipt-settings-modal";
import { format } from "date-fns";

interface TransactionReceiptProps {
  transaction: Transaction;
  settings: ReceiptSettings;
}

export const TransactionReceipt = forwardRef<HTMLDivElement, TransactionReceiptProps>(
  ({ transaction, settings }, ref) => {
    return (
      <div ref={ref} className="p-8 max-w-[80mm] mx-auto text-xs font-mono leading-tight bg-white text-black">
         {/* -- Header -- */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold uppercase mb-1">{settings.storeName}</h1>
          <div className="whitespace-pre-wrap mb-1">{settings.storeAddress}</div>
          <div className="whitespace-pre-wrap">{settings.contactInfo}</div>
        </div>

        {/* -- Transaction Info -- */}
        <div className="border-b border-dashed border-black pb-2 mb-2">
            <div className="flex justify-between">
                <span>Date:</span>
                <span>{transaction.date} {transaction.time}</span>
            </div>
            <div className="flex justify-between">
                <span>Invoice:</span>
                <span>{transaction.invoice_number}</span>
            </div>
             <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{transaction.cashier}</span>
            </div>
             <div className="flex justify-between">
                <span>Customer:</span>
                <span>{transaction.customer}</span>
            </div>
            {settings.showReferenceNumber && transaction.meta?.reference_number && (
                 <div className="flex justify-between">
                    <span>Ref No:</span>
                    <span>{transaction.meta.reference_number}</span>
                </div>
            )}
        </div>

        {/* -- Items -- */}
        <div className="mb-2">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-black">
                        <th className="pb-1 w-[40%]">Item</th>
                        <th className="pb-1 text-right">Qty</th>
                        <th className="pb-1 text-right">Price</th>
                        <th className="pb-1 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {transaction.lineItems.map((item, idx) => (
                        <tr key={idx}>
                            <td className="py-1 align-top pr-1">{item.product_name}</td>
                            <td className="py-1 align-top text-right">{item.quantity}</td>
                            <td className="py-1 align-top text-right">{item.unit_price.toFixed(2)}</td>
                            <td className="py-1 align-top text-right">{item.line_total.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* -- Totals -- */}
        <div className="border-t border-dashed border-black pt-2 mb-4">
             {/* Note: If subtotal/tax are added to Transaction type later, update here. Using total for now. */}
            <div className="flex justify-between font-bold text-sm">
                <span>TOTAL</span>
                <span>₱{transaction.total.toFixed(2)}</span>
            </div>
             <div className="flex justify-between mt-1">
                <span>Payment ({transaction.paymentMethod})</span>
                 {/* For simplicity assuming full payment for now, can be updated if partial */}
                <span>₱{transaction.total.toFixed(2)}</span>
            </div>
        </div>

        {/* -- Footer -- */}
        <div className="text-center whitespace-pre-wrap border-t border-dashed border-black pt-4">
           {settings.footerMessage}
        </div>
      </div>
    );
  }
);

TransactionReceipt.displayName = "TransactionReceipt";
