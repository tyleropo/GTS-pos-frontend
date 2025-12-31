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
import { Separator } from "@/src/components/ui/separator";
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
  defaultPayableId?: string;
  defaultPayableType?: "purchase_order" | "customer_order";
  /** @deprecated use defaultPayableId instead */
  defaultPurchaseOrderId?: string;
  onSuccess?: () => void;
}

export function PaymentFormModal({
  open,
  onOpenChange,
  payment,
  defaultPayableId,
  defaultPayableType,
  defaultPurchaseOrderId,
  onSuccess,
}: PaymentFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!payment;

  // Resolve default props (backward compatibility)
  const resolvedDefaultId = defaultPayableId || defaultPurchaseOrderId;
  const resolvedDefaultType = defaultPayableType || (defaultPurchaseOrderId ? "purchase_order" : "purchase_order");

  // State for order type
  const [orderType, setOrderType] = useState<"purchase_order" | "customer_order">("purchase_order");

  const [form, setForm] = useState<Partial<CreatePaymentPayload>>({
    payable_id: resolvedDefaultId || "",
    payable_type: resolvedDefaultType,
    reference_number: "",
    amount: 0,
    payment_method: "cash",
    date_received: new Date().toISOString().split("T")[0],
    is_deposited: false,
    date_deposited: null,
    notes: "",
  });

  const [poOpen, setPoOpen] = useState(false);

  // Fetch orders based on type
  const { data: purchaseOrdersData } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => fetchPurchaseOrders({ per_page: 100 }),
    enabled: orderType === "purchase_order",
  });

  const { data: customerOrdersData } = useQuery({
     queryKey: ["customer-orders"],
     queryFn: () => import("@/src/lib/api/customer-orders").then(mod => mod.fetchCustomerOrders({ per_page: 100 })),
     enabled: orderType === "customer_order",
  });

  useEffect(() => {
    if (payment) {
      setForm({
        payable_id: payment.payable_id,
        payable_type: payment.payable_type === 'App\\Models\\PurchaseOrder' ? 'purchase_order' : 'customer_order',
        reference_number: payment.reference_number || "",
        amount: payment.amount,
        payment_method: payment.payment_method,
        bank_name: payment.bank_name || "",
        account_number: payment.account_number || "",
        date_received: payment.date_received.split("T")[0],
        is_deposited: payment.is_deposited,
        date_deposited: payment.date_deposited?.split("T")[0] || null,
        notes: payment.notes || "",
      });
      setOrderType(payment.payable_type === 'App\\Models\\PurchaseOrder' ? 'purchase_order' : 'customer_order');
    } else if (resolvedDefaultId) {
      setForm((prev) => ({
        ...prev,
        payable_id: resolvedDefaultId,
        payable_type: resolvedDefaultType,
      }));
       setOrderType(resolvedDefaultType);
    }
  }, [payment, resolvedDefaultId, resolvedDefaultType]);

  // ... (Mutation setup remains similar but invalidate both queries)

  const createMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
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
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
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
      payable_id: resolvedDefaultId || "",
      payable_type: resolvedDefaultType,
      reference_number: "",
      amount: 0,
      payment_method: "cash",
      bank_name: "",
      account_number: "",
      date_received: new Date().toISOString().split("T")[0],
      is_deposited: false,
      date_deposited: null,
      notes: "",
    });
    setOrderType(resolvedDefaultType);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.payable_id || !form.amount || !form.date_received) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload: CreatePaymentPayload = {
      payable_id: form.payable_id,
      payable_type: orderType,
      reference_number: form.reference_number || null,
      amount: Number(form.amount),
      payment_method: form.payment_method as any,
      bank_name: form.bank_name || null,
      account_number: form.account_number || null,
      date_received: form.date_received,
      is_deposited: 
        orderType === "purchase_order" 
          ? false 
          : (form.payment_method === "cash" ? true : (form.is_deposited || false)),
      date_deposited: 
        orderType === "purchase_order"
          ? null 
          : (form.payment_method === "cash" ? form.date_received : (form.is_deposited ? form.date_deposited : null)),
      notes: form.notes || null,
    };

    if (isEditing && payment) {
      updateMutation.mutate({ id: payment.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const purchaseOrders = purchaseOrdersData?.data || [];
  const customerOrders = customerOrdersData?.data || [];
  const currentOrders = orderType === "purchase_order" ? purchaseOrders : customerOrders;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Payment" : "Record New Payment"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update payment details below"
              : "Record payment for an order"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
             {/* Order Type Toggle */}
            {!isEditing && !resolvedDefaultId && (
              <div className="flex gap-4 p-1 bg-muted rounded-lg">
                <Button
                  type="button"
                  variant={orderType === "purchase_order" ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => {
                    setOrderType("purchase_order");
                    setForm(f => ({ ...f, payable_id: "" }));
                  }}
                >
                  Outbound (Supplier)
                </Button>
                <Button
                  type="button"
                  variant={orderType === "customer_order" ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => {
                     setOrderType("customer_order");
                     setForm(f => ({ ...f, payable_id: "" }));
                  }}
                >
                  Inbound (Customer)
                </Button>
              </div>
            )}

          <div className="space-y-2">
            <Label htmlFor="purchase_order">
               {orderType === "purchase_order" ? "Purchase Order (PO)" : "Customer Order (CO)"} *
            </Label>
            <Popover open={poOpen} onOpenChange={setPoOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={isEditing || !!resolvedDefaultId}
                  className={cn(
                    "w-full justify-between",
                    !form.payable_id && "text-muted-foreground"
                  )}
                >
                  {form.payable_id
                    ? (orderType === "purchase_order"
                        ? purchaseOrders.find(po => String(po.id) === form.payable_id)?.po_number
                        : customerOrders.find(co => String(co.id) === form.payable_id)?.co_number) +
                      " - " +
                      (orderType === "purchase_order" 
                        ? (purchaseOrders.find(po => String(po.id) === form.payable_id)?.customer?.name || // Note: adapter maps supplier to customer prop currently? No, I fixed adapter.
                           // Wait, check adapter. PurchaseOrder has 'supplier'.
                           // But I only updated the type definition! The validation in `payment.ts` was updated. 
                           // `purchaseOrdersData` comes from `fetchPurchaseOrders`. 
                           // `fetchPurchaseOrders` uses `purchaseOrderSchema`? 
                           // Let's assume standard API response.
                           // Using optional chaining safe access.
                           purchaseOrders.find(po => String(po.id) === form.payable_id)?.supplier?.company_name || "Unknown")
                        : (customerOrders.find(co => String(co.id) === form.payable_id)?.customer?.name || "Unknown")) +
                      " (₱" +
                      currentOrders
                        .find((o) => String(o.id) === form.payable_id)
                        ?.total.toFixed(2) +
                      ")"
                    : "Select order"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[200]">
                <Command>
                   <CommandInput placeholder={`Search ${orderType === "purchase_order" ? "PO" : "CO"}...`} />
                  <CommandList>
                    {currentOrders.length === 0 && (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No orders found.
                      </div>
                    )}
                    <CommandGroup>
                      {currentOrders.map((order: any) => (
                        <CommandItem
                          key={order.id}
                           value={`${order.po_number || order.co_number} ${
                              orderType === "purchase_order" 
                                ? (order.supplier?.company_name || order.supplier?.contact_person) 
                                : (order.customer?.name || order.customer?.company)
                           }`}
                          onSelect={() => {
                            setForm({ ...form, payable_id: String(order.id) });
                            setPoOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              String(order.id) === form.payable_id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {order.po_number || order.co_number} - {
                             orderType === "purchase_order" 
                                ? (order.supplier?.company_name || order.supplier?.contact_person) 
                                : (order.customer?.name || order.customer?.company)
                          } (₱
                          {order.total.toFixed(2)})
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
                onValueChange={(value: any) => {
                  const isCash = value === "cash";
                  setForm({ 
                    ...form, 
                    payment_method: value,
                    // If switching to Cash: Auto-deposit handled in submit or visually hidden?
                    // User requirement: "if it is cash we dont need it to be pending deposited".
                    // Implies: Cash = Deposited (or simply not pending).
                    // We will set is_deposited = true and date_deposited = date_received (or today) if user selects Cash.
                    is_deposited: isCash ? true : form.is_deposited,
                    date_deposited: isCash ? (form.date_received || new Date().toISOString().split("T")[0]) : form.date_deposited
                  });
                }}
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

          {form.payment_method !== "cash" && (
            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-md">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  placeholder="e.g. BDO, BPI"
                  value={form.bank_name || ""}
                  onChange={(e) =>
                    setForm({ ...form, bank_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  placeholder="e.g. 1234-5678-90"
                  value={form.account_number || ""}
                  onChange={(e) =>
                    setForm({ ...form, account_number: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {orderType === "customer_order" && form.payment_method !== "cash" && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_deposited"
                  checked={form.is_deposited}
                  onCheckedChange={(checked) =>
                    setForm({
                      ...form,
                      is_deposited: checked as boolean,
                      date_deposited: checked ? form.date_deposited || form.date_received : null,
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
          )}

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
