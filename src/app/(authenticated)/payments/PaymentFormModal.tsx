"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import {
  createPayment,
  updatePayment,
  type Payment,
  type CreatePaymentPayload,
} from "@/src/lib/api/payments";
import { fetchPurchaseOrders } from "@/src/lib/api/purchase-orders";

interface PaymentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: Payment | null;
  defaultPurchaseOrderId?: string;
  onSuccess?: () => void;
}

export function PaymentFormModal({
  open,
  onOpenChange,
  payment,
  defaultPurchaseOrderId,
  onSuccess,
}: PaymentFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!payment;

  const [form, setForm] = useState<Partial<CreatePaymentPayload>>({
    purchase_order_id: defaultPurchaseOrderId || "",
    reference_number: "",
    amount: 0,
    payment_method: "cash",
    date_received: new Date().toISOString().split("T")[0],
    is_deposited: false,
    date_deposited: null,
    notes: "",
  });

  const [poOpen, setPoOpen] = useState(false);

  // Fetch purchase orders for dropdown
  const { data: purchaseOrdersData } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => fetchPurchaseOrders({ per_page: 100 }),
  });

  useEffect(() => {
    if (payment) {
      setForm({
        purchase_order_id: String(payment.purchase_order_id),
        reference_number: payment.reference_number || "",
        amount: payment.amount,
        payment_method: payment.payment_method,
        date_received: payment.date_received.split("T")[0],
        is_deposited: payment.is_deposited,
        date_deposited: payment.date_deposited?.split("T")[0] || null,
        notes: payment.notes || "",
      });
    } else if (defaultPurchaseOrderId) {
      setForm((prev) => ({
        ...prev,
        purchase_order_id: defaultPurchaseOrderId,
      }));
    }
  }, [payment, defaultPurchaseOrderId]);

  const createMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Payment created successfully");
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create payment");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string | number; payload: Partial<CreatePaymentPayload> }) =>
      updatePayment(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Payment updated successfully");
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update payment");
    },
  });

  const resetForm = () => {
    setForm({
      purchase_order_id: defaultPurchaseOrderId || "",
      reference_number: "",
      amount: 0,
      payment_method: "cash",
      date_received: new Date().toISOString().split("T")[0],
      is_deposited: false,
      date_deposited: null,
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.purchase_order_id || !form.amount || !form.date_received) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload: CreatePaymentPayload = {
      purchase_order_id: form.purchase_order_id,
      reference_number: form.reference_number || null,
      amount: Number(form.amount),
      payment_method: form.payment_method as any,
      date_received: form.date_received,
      is_deposited: form.is_deposited || false,
      date_deposited: form.is_deposited ? form.date_deposited : null,
      notes: form.notes || null,
    };

    if (isEditing && payment) {
      updateMutation.mutate({ id: payment.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const purchaseOrders = purchaseOrdersData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Payment" : "Record New Payment"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update payment details below"
              : "Record payment received for a customer order"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="purchase_order">Customer Order (PO) *</Label>
            <Popover open={poOpen} onOpenChange={setPoOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={isEditing}
                  className={cn(
                    "w-full justify-between",
                    !form.purchase_order_id && "text-muted-foreground"
                  )}
                >
                  {form.purchase_order_id
                    ? purchaseOrders.find(
                        (po) => String(po.id) === form.purchase_order_id
                      )?.po_number +
                      " - " +
                      (purchaseOrders.find(
                        (po) => String(po.id) === form.purchase_order_id
                      )?.customer?.name ||
                        purchaseOrders.find(
                          (po) => String(po.id) === form.purchase_order_id
                        )?.customer?.company) +
                      " (₱" +
                      purchaseOrders
                        .find((po) => String(po.id) === form.purchase_order_id)
                        ?.total.toFixed(2) +
                      ")"
                    : "Select purchase order"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[200]">
                <Command>
                  <CommandInput placeholder="Search order..." />
                  <CommandList>
                    {purchaseOrders.length === 0 && (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No purchase orders found.
                      </div>
                    )}
                    <CommandGroup>
                      {purchaseOrders.map((po) => (
                        <CommandItem
                          key={po.id}
                          value={`${po.po_number} ${po.customer?.name || po.customer?.company || ""}`}
                          onSelect={() => {
                            setForm({ ...form, purchase_order_id: String(po.id) });
                            setPoOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              String(po.id) === form.purchase_order_id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {po.po_number} - {po.customer?.name || po.customer?.company} (₱
                          {po.total.toFixed(2)})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference_number">Cheque/Reference Number</Label>
              <Input
                id="reference_number"
                value={form.reference_number}
                onChange={(e) =>
                  setForm({ ...form, reference_number: e.target.value })
                }
                placeholder="e.g., CHQ-123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select
                value={form.payment_method}
                onValueChange={(value: any) =>
                  setForm({ ...form, payment_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_received">Date Received *</Label>
              <Input
                id="date_received"
                type="date"
                value={form.date_received}
                onChange={(e) =>
                  setForm({ ...form, date_received: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_deposited"
                checked={form.is_deposited}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    is_deposited: checked as boolean,
                    date_deposited: checked ? form.date_deposited : null,
                  })
                }
              />
              <Label htmlFor="is_deposited" className="font-normal cursor-pointer">
                Payment has been deposited
              </Label>
            </div>

            {form.is_deposited && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="date_deposited">Date Deposited</Label>
                <Input
                  id="date_deposited"
                  type="date"
                  value={form.date_deposited || ""}
                  onChange={(e) =>
                    setForm({ ...form, date_deposited: e.target.value })
                  }
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes about this payment..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : isEditing
                ? "Update Payment"
                : "Create Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
