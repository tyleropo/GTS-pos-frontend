import { useState, useMemo, type ComponentType, type SVGProps } from "react";
import { cn } from "@/src/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Trash2, Wallet, CreditCard, Banknote, Plus, Minus, X, User } from "lucide-react";
import { CustomerSearch } from "@/src/components/customer-search";
import type { Customer } from "@/src/lib/api/customers";
import { CustomerFormModal } from "@/src/app/(authenticated)/customers/CustomerFormModal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";

export type CartLineItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartPanelProps = {
  items: CartLineItem[];
  onClear: () => void;
  onCheckout: (
    method: "cash" | "Bank transfer/Cheque/Card"  | "online_wallet", 
    customer: Customer | null,
    meta?: Record<string, unknown>
  ) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
};

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

const PAYMENT_METHODS: Array<{
  id: "cash" | "Bank transfer/Cheque/Card"  | "online_wallet";
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "Bank transfer/Cheque/Card", label: "Bank transfer/Cheque/Card", icon: CreditCard },
  { id: "online_wallet", label: "Online Wallet", icon: Wallet },
];

export function CartPanel({ items, onClear, onCheckout, onUpdateQuantity, onRemoveItem }: CartPanelProps) {
  const [vatPercentage, setVatPercentage] = useState(12);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cash" | "Bank transfer/Cheque/Card" | "online_wallet" | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const handleCreateCustomer = () => {
    setIsCustomerModalOpen(true);
  };

  const handleCustomerCreated = (customer?: Customer) => {
    if (customer) {
        setSelectedCustomer(customer);
    }
    // If no customer returned (shouldn't happen with our update), we just close which is handled by modal prop
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  /* Discount Logic */
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [discountValue, setDiscountValue] = useState<string>("");

  const discountAmount = useMemo(() => {
     const value = parseFloat(discountValue);
     if (isNaN(value) || value < 0) return 0;

     if (discountType === "percentage") {
        return subtotal * (Math.min(value, 100) / 100);
     } else {
        return Math.min(value, subtotal);
     }
  }, [discountType, discountValue, subtotal]);

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxRate = vatPercentage / 100;
  
  // Tax is inclusive: Total = Net + Tax
  // Total = Net * (1 + Rate)
  // Net = Total / (1 + Rate)
  // Tax = Total - Net
  const total = discountedSubtotal;
  const netOfVat = total / (1 + taxRate);
  const tax = total - netOfVat;

  const handleVatChange = (value: string) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      setVatPercentage(parsed);
    } else if (value === "") {
      setVatPercentage(0);
    }
  };

  const handleIncrement = (id: string, currentQuantity: number) => {
    onUpdateQuantity(id, currentQuantity + 1);
  };

  const handleDecrement = (id: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      onUpdateQuantity(id, currentQuantity - 1);
    }
  };

  const [amountTendered, setAmountTendered] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [bankName, setBankName] = useState("");

  const handlePaymentMethodClick = (method: "cash" | "Bank transfer/Cheque/Card" | "online_wallet") => {
    setSelectedPaymentMethod(method);
    setAmountTendered(""); // Reset tendered amount
    setDiscountValue(""); // Reset discount
    setReferenceNumber(""); // Reset reference number
    setBankName(""); // Reset bank name
    setIsConfirmModalOpen(true);
  };

  const change = selectedPaymentMethod === "cash" 
    ? Math.max(0, parseFloat(amountTendered || "0") - total) 
    : 0;

  const isValidTender = selectedPaymentMethod !== "cash" || parseFloat(amountTendered || "0") >= total;

  const handleConfirmCheckout = () => {
    if (selectedPaymentMethod && isValidTender) {
      onCheckout(selectedPaymentMethod, selectedCustomer, {
        amount_tendered: selectedPaymentMethod === "cash" ? parseFloat(amountTendered) : undefined,
        change: selectedPaymentMethod === "cash" ? change : undefined,
        discount_type: discountAmount > 0 ? discountType : undefined,
        discount_value: discountAmount > 0 ? parseFloat(discountValue) : undefined,
        discount_amount: discountAmount > 0 ? discountAmount : undefined,
        reference_number: referenceNumber || undefined,
        bank_name: selectedPaymentMethod !== "cash" ? bankName : undefined,
      });
      setIsConfirmModalOpen(false);
      setSelectedPaymentMethod(null);
      setAmountTendered("");
      setDiscountValue(""); 
      setBankName("");
    }
  };

  const handleCancelCheckout = () => {
    setIsConfirmModalOpen(false);
    setSelectedPaymentMethod(null);
    setAmountTendered("");
    setBankName("");
  };

  const selectedPaymentMethodLabel = PAYMENT_METHODS.find(
    (method) => method.id === selectedPaymentMethod
  )?.label || "";

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between">
            <CardTitle>Current cart</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              disabled={items.length === 0}
              aria-label="Clear cart"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <CustomerSearch
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setSelectedCustomer}
            onCreate={handleCreateCustomer}
          />
        </CardHeader>
        <CustomerFormModal
            open={isCustomerModalOpen}
            onOpenChange={setIsCustomerModalOpen}
            onSuccess={handleCustomerCreated}
        />
        <CardContent className="flex-1 space-y-4">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              Scan a barcode or tap on a product to populate the cart.
            </div>
          ) : (
            <ScrollArea className="h-[280px] rounded-md border border-border/60">
              <div className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{item.name}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => onRemoveItem(item.id)}
                          aria-label="Remove item"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDecrement(item.id, item.quantity)}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="min-w-[2rem] text-center text-xs font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleIncrement(item.id, item.quantity)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {currency.format(item.price)} each
                        </span>
                      </div>
                    </div>
                    <span className="font-medium whitespace-nowrap">
                      {currency.format(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{currency.format(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
               <div className="flex justify-between text-sm text-emerald-600">
                 <span>Discount ({discountType === "percentage" ? `${discountValue}%` : "Fixed"})</span>
                 <span>-{currency.format(discountAmount)}</span>
               </div>
            )}

            <div className="my-2 border-t border-dashed" />

            <div className="space-y-1">
               <div className="flex justify-between text-sm">
                 <span className="font-medium">Total Sales (VAT Inclusive)</span>
                 <span className="font-medium">{currency.format(total)}</span>
               </div>
               <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Less: VAT</span>
                    <div className="flex items-center gap-1 scale-75 origin-left">
                      <Input
                        type="number"
                        value={vatPercentage}
                        onChange={(e) => handleVatChange(e.target.value)}
                        className="h-6 w-16 px-2 text-xs"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span className="text-xs">%</span>
                    </div>
                  </div>
                  <span>{currency.format(tax)}</span>
               </div>
               <div className="flex justify-between text-xs text-muted-foreground">
                 <span>Net of VAT</span>
                 <span>{currency.format(netOfVat)}</span>
               </div>
            </div>

            <div className="flex justify-between text-base font-semibold">
              <span>TOTAL</span>
              <span>{currency.format(total)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="grid gap-2">
          {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={id === "cash" ? "default" : "outline"}
              onClick={() => handlePaymentMethodClick(id)}
              disabled={items.length === 0}
              className="w-full justify-start gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </CardFooter>
      </Card>

      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Checkout</DialogTitle>
            <DialogDescription>
              Review your order summary before completing the transaction.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col text-sm">
                <span className="font-medium">
                  {selectedCustomer ? selectedCustomer.name : "Walk-in Customer"}
                </span>
                {selectedCustomer?.email && (
                  <span className="text-xs text-muted-foreground">{selectedCustomer.email}</span>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Order Items</h4>
              <ScrollArea className="max-h-[200px] rounded-md border">
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-4 px-4 py-2 text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {currency.format(item.price)}
                        </p>
                      </div>
                      <span className="font-medium whitespace-nowrap">
                        {currency.format(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Discount Section */}
            <div className="rounded-lg border px-3">
              <Accordion type="single" collapsible>
                 <AccordionItem value="discount" className="border-b-0">
                    <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                       Discount <span className="ml-2 text-xs font-normal text-muted-foreground">(Optional)</span>
                    </AccordionTrigger>
                    <AccordionContent>
                       <div className="flex flex-col gap-3 pt-2">
                          <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Type</span>
                              <div className="flex items-center rounded-lg border bg-muted p-1">
                                 <button
                                    type="button"
                                    className={cn(
                                      "flex h-7 items-center rounded-md px-3 text-xs font-medium transition-all",
                                      discountType === "percentage" 
                                        ? "bg-background text-foreground shadow-sm" 
                                        : "text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => {
                                       setDiscountType("percentage");
                                       setDiscountValue("");
                                    }}
                                 >
                                    Percentage (%)
                                 </button>
                                 <button
                                    type="button"
                                    className={cn(
                                      "flex h-7 items-center rounded-md px-3 text-xs font-medium transition-all",
                                      discountType === "amount" 
                                        ? "bg-background text-foreground shadow-sm" 
                                        : "text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => {
                                       setDiscountType("amount");
                                       setDiscountValue("");
                                    }}
                                 >
                                    Fixed Amount (₱)
                                 </button>
                              </div>
                           </div>
                           <div className="relative">
                              {discountType === "amount" && (
                                 <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">₱</span>
                              )}
                              <Input
                                 type="number"
                                 className={discountType === "amount" ? "pl-7" : ""}
                                 placeholder={discountType === "percentage" ? "Enter percentage (0-100)" : "Enter amount"}
                                 value={discountValue}
                                 onChange={(e) => setDiscountValue(e.target.value)}
                                 min="0"
                                 max={discountType === "percentage" ? "100" : undefined}
                              />
                              {discountType === "percentage" && (
                                 <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                              )}
                           </div>
                       </div>
                    </AccordionContent>
                 </AccordionItem>
              </Accordion>
            </div>

            {/* Summary */}
            <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{currency.format(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                 <div className="flex justify-between text-sm text-emerald-600">
                   <span>Discount ({discountType === "percentage" ? `${discountValue}%` : "Fixed"})</span>
                   <span>-{currency.format(discountAmount)}</span>
                 </div>
              )}
              
              <div className="my-2 border-t border-dashed" />

              <div className="space-y-1">
                 <div className="flex justify-between text-sm">
                   <span className="font-medium">Total Sales (VAT Inclusive)</span>
                   <span className="font-medium">{currency.format(total)}</span>
                 </div>
                 <div className="flex justify-between text-xs text-muted-foreground">
                   <span>Less: {vatPercentage}% VAT</span>
                   <span>{currency.format(tax)}</span>
                 </div>
                 <div className="flex justify-between text-xs text-muted-foreground">
                   <span>Net of VAT</span>
                   <span>{currency.format(netOfVat)}</span>
                 </div>
              </div>

              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>TOTAL</span>
                <span>{currency.format(total)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-3 rounded-lg border bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                {selectedPaymentMethod === "cash" && <Banknote className="h-4 w-4" />}
                {selectedPaymentMethod === "Bank transfer/Cheque/Card" && <CreditCard className="h-4 w-4" />}
                {selectedPaymentMethod === "online_wallet" && <Wallet className="h-4 w-4" />}
                <span>Payment via {selectedPaymentMethodLabel}</span>
              </div>

              {selectedPaymentMethod !== "cash" && (
                <div className="space-y-3 pt-2 border-t border-primary/10">
                   {/* Bank/Wallet Name Input */}
                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">
                        {selectedPaymentMethod === "online_wallet" ? "Wallet Name (e.g. GCash/Maya)" : "Bank Name"}
                      </label>
                      <Input 
                        placeholder={selectedPaymentMethod === "online_wallet" ? "e.g. GCash" : "e.g. BDO"}
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        autoFocus
                      />
                   </div>

                   <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium">Reference Number</label>
                      <Input 
                        placeholder="Transaction/Reference number"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                      />
                   </div>
                </div>
              )}

              {selectedPaymentMethod === "cash" && (
                <div className="space-y-2 pt-2 border-t border-primary/10">
                   <div className="flex items-center justify-between gap-4">
                      <label className="text-sm font-medium whitespace-nowrap">Amount Tendered</label>
                      <div className="relative w-32">
                         <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">₱</span>
                         <Input 
                            type="number" 
                            className="pl-6 h-9" 
                            placeholder="0.00"
                            value={amountTendered}
                            onChange={(e) => setAmountTendered(e.target.value)}
                            autoFocus
                         />
                      </div>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Change</span>
                      <span className={change < 0 ? "text-destructive" : "font-medium"}>
                        {currency.format(change)}
                      </span>
                   </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelCheckout}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCheckout}
              disabled={!isValidTender}
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
