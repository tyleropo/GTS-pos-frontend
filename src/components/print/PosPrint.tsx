import React, { forwardRef } from "react";
import { Transaction } from "@/src/types/transactions";
import { ReceiptSettings } from "@/src/components/modals/receipt-settings-modal";
import { format } from "date-fns";

interface PosPrintProps {
  transaction: Transaction;
  settings: ReceiptSettings;
}

export const PosPrint = forwardRef<HTMLDivElement, PosPrintProps>(
  ({ transaction, settings }, ref) => {
    return (
      <div ref={ref} className="p-4 max-w-[80mm] mx-auto text-xs font-mono leading-tight bg-white text-black print:p-0">
        <style jsx global>{`
          @media print {
            @page {
              margin: 0;
              size: 80mm auto; 
            }
            body { 
              margin: 0;
              padding: 0;
            }
          }
        `}</style>

         {/* -- Header -- */}
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold uppercase mb-1">{settings.storeName}</h1>
          <div className="whitespace-pre-wrap mb-1 text-[10px]">{settings.storeAddress}</div>
          <div className="whitespace-pre-wrap text-[10px]">{settings.contactInfo}</div>
        </div>

        {/* -- Transaction Info -- */}
        <div className="border-b border-dashed border-black pb-2 mb-2 text-[10px]">
            <div className="flex justify-between">
                <span>Date:</span>
                <span>{transaction.date} {transaction.time}</span>
            </div>
            <div className="flex justify-between">
                <span>Invoice:</span>
                <span>{transaction.invoice_number}</span>
            </div>
             {transaction.cashier && (
                <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{transaction.cashier}</span>
                </div>
             )}
             <div className="flex justify-between">
                <span>Customer:</span>
                <span>{transaction.customer}</span>
            </div>
        </div>

        {/* -- Items -- */}
        <div className="mb-2">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-black">
                        <th className="pb-1 w-[45%] font-semibold">Item</th>
                        <th className="pb-1 text-right font-semibold">Qty</th>
                        <th className="pb-1 text-right font-semibold">Price</th>
                        <th className="pb-1 text-right font-semibold">Total</th>
                    </tr>
                </thead>
                <tbody className="text-[11px]">
                   
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
            {/* Reverse calculate tax since it's added on top (12%) */}
            {(() => {
                const computedSubtotal = transaction.total / 1.12;
                const computedTax = transaction.total - computedSubtotal;
                
                return (
                    <>
                         <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                            <span>Total Sales (VAT Inclusive)</span>
                            <span>₱{transaction.total.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                            <span>Less: VAT 12%</span>
                            <span>₱{computedTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-600 mb-1 border-b border-gray-300 pb-1">
                            <span>Net of VAT</span>
                            <span>₱{computedSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm">
                            <span>TOTAL</span>
                            <span>₱{transaction.total.toFixed(2)}</span>
                        </div>
                    </>
                );
            })()}
            {/* If we had tax info here we would show it, but Transaction interface normally has total only, assuming inclusive */}
            
            <div className="mt-2 border-t border-dotted border-gray-400 pt-1">
                 <div className="flex justify-between mt-1 text-[11px]">
                    <span className="capitalize">Payment ({transaction.paymentMethod}):</span>
                    {/* Access meta if available, otherwise just show total */}
                    <span>₱{(transaction.meta as any)?.amount_tendered ? Number((transaction.meta as any).amount_tendered).toFixed(2) : transaction.total.toFixed(2)}</span>
                </div>
                {(transaction.meta as any)?.change !== undefined && (
                    <div className="flex justify-between mt-1 text-[11px]">
                        <span>Change:</span>
                        <span>₱{Number((transaction.meta as any).change).toFixed(2)}</span>
                    </div>
                )}
            </div>
        </div>

        {/* -- Footer -- */}
        <div className="text-center whitespace-pre-wrap border-t border-dashed border-black pt-4 text-[10px]">
           {settings.footerMessage}
        </div>
        {/* <div className="text-center mt-4 text-[9px]">
            Powered by GTS POS
        </div> */}
      </div>
    );
  }
);

PosPrint.displayName = "PosPrint";
