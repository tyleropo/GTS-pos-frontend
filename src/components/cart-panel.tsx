import { useState, type ComponentType, type SVGProps } from "react";
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

export type CartLineItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartPanelProps = {
  items: CartLineItem[];
  onClear: () => void;
  onCheckout: (method: "cash" | "card" | "gcash", customer: Customer | null) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
};

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

const PAYMENT_METHODS: Array<{
  id: "cash" | "card" | "gcash";
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "gcash", label: "GCash", icon: Wallet },
];

export function CartPanel({ items, onClear, onCheckout, onUpdateQuantity, onRemoveItem }: CartPanelProps) {
  const [vatPercentage, setVatPercentage] = useState(12);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cash" | "card" | "gcash" | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const taxRate = vatPercentage / 100;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

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

  const handlePaymentMethodClick = (method: "cash" | "card" | "gcash") => {
    setSelectedPaymentMethod(method);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmCheckout = () => {
    if (selectedPaymentMethod) {
      onCheckout(selectedPaymentMethod, selectedCustomer);
      setIsConfirmModalOpen(false);
      setSelectedPaymentMethod(null);
      // Optional: Reset customer after checkout? 
      // setSelectedCustomer(null);
    }
  };

  const handleCancelCheckout = () => {
    setIsConfirmModalOpen(false);
    setSelectedPaymentMethod(null);
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
          />
        </CardHeader>
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
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">VAT</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={vatPercentage}
                    onChange={(e) => handleVatChange(e.target.value)}
                    className="h-6 w-16 px-2 text-xs"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="text-muted-foreground text-xs">%</span>
                </div>
              </div>
              <span className="font-medium">{currency.format(tax)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total due</span>
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

            {/* Summary */}
            <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{currency.format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT ({vatPercentage}%)</span>
                <span className="font-medium">{currency.format(tax)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{currency.format(total)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-center gap-2 rounded-lg border bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                {selectedPaymentMethod === "cash" && <Banknote className="h-4 w-4" />}
                {selectedPaymentMethod === "card" && <CreditCard className="h-4 w-4" />}
                {selectedPaymentMethod === "gcash" && <Wallet className="h-4 w-4" />}
                <span>Payment via {selectedPaymentMethodLabel}</span>
              </div>
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
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
