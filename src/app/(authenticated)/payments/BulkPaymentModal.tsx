"use client";

import { useState } from "react";
import { formatCurrency } from "@/src/lib/format-currency";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import { Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { createPayment } from "@/src/lib/api/payments";
import type { PurchaseOrder } from "@/src/types/purchaseOrder";
import type { CustomerOrder } from "@/src/types/customerOrder";
import { format } from 'date-fns';

interface BulkPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: (PurchaseOrder | CustomerOrder)[];
  orderType: "purchase_order" | "customer_order";
  onSuccess?: () => void;
}

export function BulkPaymentModal({
  open,
  onOpenChange,
  orders,
  orderType,
  onSuccess,
}: BulkPaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    payment_method: "bank_transfer",
    bank_name: "",
    account_number: "",
    date_received: format(new Date(), 'yyyy-MM-dd'),
    reference_number: "",
    notes: "",
    status: null as string | null,
  });

  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);
  
  // Get the supplier/customer name (should be same for all orders)
  const entityName = orders.length > 0 
    ? 'supplier' in orders[0] 
      ? (orders[0] as PurchaseOrder).supplier 
      : 'customer' in orders[0] 
        ? (orders[0] as any).customer?.company || (orders[0] as any).customer?.name || "Unknown Customer"
        : "Unknown"
    : "Unknown";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (orders.length === 0) {
      toast.error("No orders selected");
      return;
    }

    try {
      setIsSubmitting(true);

      // Build related orders array
      const relatedOrders = orders.map(order => ({
        id: order.id,
        type: orderType,
        amount: order.total,
      }));

      // Use the first order for the payable reference
      const firstOrder = orders[0];

      const payload = {
        payable_id: firstOrder.id,
        payable_type: orderType,
        amount: totalAmount,
        payment_method: form.payment_method as "cash" | "cheque" | "bank_transfer" | "credit_card" | "online_wallet",
        bank_name: form.bank_name || undefined,
        account_number: form.account_number || undefined,
        date_received: form.date_received,
        reference_number: form.reference_number || undefined,
        status: form.status || undefined,
        is_consolidated: true,
        related_orders: relatedOrders,
        notes: form.notes || undefined,
      };

      await createPayment(payload);
      toast.success(`Consolidated payment created for ${orders.length} orders`);
      
      setForm({
        payment_method: "bank_transfer",
        bank_name: "",
        account_number: "",
        date_received: format(new Date(), 'yyyy-MM-dd'),
        reference_number: "",
        notes: "",
        status: null,
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating bulk payment:", error);
      toast.error(error?.response?.data?.message || "Failed to create consolidated payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available status options based on payment type and method
  const getStatusOptions = () => {
    const isPayable = orderType === "purchase_order";
    const method = form.payment_method;

    if (isPayable) {
      // Payables (outbound payments)
      if (method === "cash") return ["paid"];
      if (method === "cheque") return ["pending_clearance", "cleared"];
      if (method === "bank_transfer") return ["pending_verification", "verified", "transferred"];
      if (method === "credit_card") return ["charged"];
      if (method === "online_wallet") return ["sent", "confirmed"];
    } else {
      // Receivables (inbound payments)
      if (method === "cash") return ["received"];
      if (method === "cheque") return ["deposited", "cleared"];
      if (method === "bank_transfer") return ["pending_confirmation", "confirmed", "settled"];
      if (method === "credit_card") return ["charged"];
      if (method === "online_wallet") return ["received", "settled"];
    }
    return [];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Create Consolidated Payment
          </DialogTitle>
          <DialogDescription>
            Create a single payment for {orders.length} selected {orderType === "purchase_order" ? "purchase orders" : "customer orders"} from {entityName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Orders Summary Table */}
          <div className="space-y-2">
            <Label>Selected Orders ({orders.length})</Label>
            <div className="rounded-md border max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {'po_number' in order ? order.po_number : (order as any).order_number}
                      </TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell className="text-right">₱{formatCurrency(order.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Total Amount */}
          <div className="p-4 bg-muted rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold text-emerald-600">₱{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select
                value={form.payment_method}
                onValueChange={(value) => setForm({ ...form, payment_method: value, status: null })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="online_wallet">Online Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_received">Date Received *</Label>
              <Input
                id="date_received"
                type="date"
                value={form.date_received}
                onChange={(e) => setForm({ ...form, date_received: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Bank Details (if applicable) */}
          {(form.payment_method === "bank_transfer" || form.payment_method === "cheque") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  placeholder="Enter bank name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_number">Account/Check Number</Label>
                <Input
                  id="account_number"
                  value={form.account_number}
                  onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                  placeholder="Enter account or check number"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                value={form.reference_number}
                onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                placeholder="Transaction reference"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Payment Status</Label>
              <Select
                value={form.status || "auto"}
                onValueChange={(value) => setForm({ ...form, status: value === "auto" ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auto (based on payment method)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (based on payment method)</SelectItem>
                  {getStatusOptions().map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional payment information..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Consolidated Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
