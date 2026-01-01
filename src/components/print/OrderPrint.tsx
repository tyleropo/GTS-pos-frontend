import React, { forwardRef } from 'react';
import { CustomerOrder } from '@/src/types/customerOrder';
import { PurchaseOrder } from '@/src/types/purchaseOrder';
import { format } from 'date-fns';
import { formatCurrency } from '@/src/lib/billing';

import { PurchaseOrder as APIPurchaseOrder } from '@/src/lib/api/purchase-orders';
import { CustomerOrder as APICustomerOrder } from '@/src/lib/api/customer-orders';

interface OrderPrintProps {
  order: CustomerOrder | PurchaseOrder | APIPurchaseOrder | APICustomerOrder | null;
  type: 'customer' | 'purchase';
  companyName?: string;
}

export const OrderPrint = forwardRef<HTMLDivElement, OrderPrintProps>(
  ({ order, type, companyName = "GTS Marketing" }, ref) => {
    if (!order) return null;

    const isCustomerOrder = type === 'customer';
    
    // Helper to safely access items if they exist as an array
    const lineItems = (order as any).items as any[];
    const hasLineItems = Array.isArray(lineItems) && lineItems.length > 0;

    const orderNumber = isCustomerOrder 
        ? (order as CustomerOrder).co_number 
        : (order as PurchaseOrder).po_number;
        
    let entityName = "N/A";
    if (isCustomerOrder) {
        // Safe access for CustomerOrder union
        const cust = (order as any).customer;
        // If it's an object with name, use it. If it's a string, use it.
        if (typeof cust === 'object' && cust !== null) {
            entityName = cust.name || cust.company || "N/A";
        } else if (typeof cust === 'string') {
            entityName = cust;
        }
    } else {
        // Safe access for PurchaseOrder union
        const supp = (order as any).supplier;
        if (typeof supp === 'object' && supp !== null) {
            entityName = supp.company_name || supp.name || "N/A";
        } else if (typeof supp === 'string') {
            entityName = supp;
        }
    }
        
    const entityLabel = isCustomerOrder ? "Customer" : "Supplier";

    return (
      <div ref={ref} className="p-8 max-w-2xl mx-auto bg-white text-black print:p-0">
        <style jsx global>{`
          @media print {
            @page {
              margin: 20mm;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b pb-4">
             <div>
                <h1 className="text-xl font-bold uppercase tracking-wider mb-1">{companyName}</h1>
                {/* <p className="text-xs text-gray-500">Official Receipt / Record</p> */}
             </div>
             <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-800 uppercase">{isCustomerOrder ? "Order" : "Purchase Order"}</h2>
                <p className="font-mono text-lg">{orderNumber || order.id}</p>
             </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">{entityLabel}</h3>
                <p className="text-lg font-medium">{entityName}</p>
            </div>
            <div className="text-right">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Date</h3>
                <p className="text-lg">{order.date || (order as any).created_at?.substring(0, 10)}</p>
                {order.deliveryDate && (
                    <p className="text-sm text-gray-500 mt-1">Due: {format(new Date(order.deliveryDate), "MMM dd, yyyy")}</p>
                )}
            </div>
        </div>
        
        {/* Statuses */}
        {/* <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded text-sm">
             <div>
                <span className="block text-gray-400 text-xs uppercase">Status</span>
                <span className="font-semibold">{order.status}</span>
             </div>
             <div className="text-right">
                <span className="block text-gray-400 text-xs uppercase">Payment</span>
                <span className="font-semibold">{order.paymentStatus || (order as any).payment_status}</span>
             </div>
        </div> */}

        {/* Items Table */}
        <div className="mb-12">
             {hasLineItems ? (
                 <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b-2 border-gray-100">
                            <th className="py-2 text-gray-500 font-semibold uppercase text-xs">Description</th>
                            <th className="py-2 text-gray-500 font-semibold uppercase text-xs text-center w-20">Qty</th>
                            <th className="py-2 text-gray-500 font-semibold uppercase text-xs text-right w-24">Price</th>
                            <th className="py-2 text-gray-500 font-semibold uppercase text-xs text-right w-24">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {lineItems.map((item: any, index: number) => {
                             // Handle different field names between PO and CO items if necessary
                             // Both have product_name, quantity_ordered, unit_cost, line_total
                             const desc = item.product_name || item.product?.name || item.description || "Unknown Item";
                             const qty = item.quantity_ordered ?? 0;
                             const price = item.unit_cost ?? 0;
                             const total = item.line_total ?? 0;

                             return (
                                <tr key={index}>
                                    <td className="py-3 pr-4">
                                        <div className="font-medium text-gray-900">{desc}</div>
                                        {/* {item.description && item.description !== desc && (
                                            <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                                        )} */}
                                    </td>
                                    <td className="py-3 text-center text-gray-600">{qty}</td>
                                    <td className="py-3 text-right text-gray-600">{formatCurrency(price)}</td>
                                    <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(total)}</td>
                                </tr>
                             );
                        })}
                    </tbody>
                 </table>
             ) : (
                <>
                    <div className="flex justify-between items-center border-b pb-2 mb-2">
                        <span className="font-bold">Description</span>
                        <span className="font-bold">Total</span>
                    </div>
                    <div className="flex justify-between items-center py-2 text-gray-500 italic">
                        <span>Items details not loaded ({typeof order.items === 'number' ? order.items : 0} count)</span>
                        <span className="font-mono">{formatCurrency(order.total)}</span>
                    </div>
                </>
             )}
             
             <div className="flex justify-between items-center border-t-2 border-black py-3 mt-4">
                <span className="text-xl font-bold uppercase tracking-tight">Total</span>
                <span className="text-2xl font-bold">{formatCurrency(order.total)}</span>
             </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-400 text-center mt-12 pt-8 border-t">
             <p>Thank you for your business.</p>
        </div>
      </div>
    );
  }
);

OrderPrint.displayName = 'OrderPrint';
