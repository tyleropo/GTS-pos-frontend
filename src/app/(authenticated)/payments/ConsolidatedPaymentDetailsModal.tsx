import React from 'react';
import { formatCurrency } from '@/src/lib/format-currency';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { Badge } from '@/src/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Payment } from '@/src/lib/api/payments';

interface ConsolidatedPaymentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
}

export function ConsolidatedPaymentDetailsModal({
  open,
  onOpenChange,
  payment,
}: ConsolidatedPaymentDetailsModalProps) {
  if (!payment) return null;

  // Use the enriched details if available, otherwise fall back to basic related_orders
  const relatedOrders = (payment as any).related_orders_details || payment.related_orders || [];
  const totalOrders = relatedOrders.length;

  // Debug logging
  console.log('Payment data:', payment);
  console.log('Related orders:', relatedOrders);
  console.log('Has related_orders_details:', !!(payment as any).related_orders_details);

  // Safe date formatter
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Consolidated Payment Details</DialogTitle>
          <DialogDescription>
            Payment #{payment.payment_number || String(payment.id).substring(0, 8)} • 
            {totalOrders} {totalOrders === 1 ? 'Order' : 'Orders'} • 
            Total: ₱{formatCurrency(payment.amount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Payment Type</p>
              <Badge variant="outline" className={
                payment.type === 'inbound' 
                  ? "bg-green-100 text-green-700" 
                  : "bg-blue-100 text-blue-700"
              }>
                {payment.type === 'inbound' ? 'Receivable' : 'Payable'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date Received</p>
              <p className="font-medium">
                {formatDate(payment.date_received)}
              </p>
            </div>
          </div>

          {/* Related Orders Table */}
          <div>
            <h3 className="font-semibold mb-2">Paid Orders ({totalOrders})</h3>
            {relatedOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No related orders found.
              </p>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>{payment.type === 'inbound' ? 'Customer' : 'Supplier'}</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.number || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {order.type === 'purchase_order' ? 'PO' : 'CO'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(order.date)}
                        </TableCell>
                        <TableCell>
                          {order.supplier || order.customer || order.entity || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₱{formatCurrency(order.amount || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={order.type === 'purchase_order' 
                              ? `/purchase-orders/${order.id}` 
                              : `/customer-orders/${order.id}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
