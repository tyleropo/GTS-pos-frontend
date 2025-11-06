import type { ComponentType, SVGProps } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Trash2, Wallet, CreditCard, Banknote } from "lucide-react";

export type CartLineItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartPanelProps = {
  items: CartLineItem[];
  onClear: () => void;
  onCheckout: (method: "cash" | "card" | "gcash") => void;
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

export function CartPanel({ items, onClear, onCheckout }: CartPanelProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const taxRate = 0.12;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
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
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">× {item.quantity}</Badge>
                      <span>{currency.format(item.price)}</span>
                    </div>
                  </div>
                  <span className="font-medium">
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
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT (12%)</span>
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
            onClick={() => onCheckout(id)}
            disabled={items.length === 0}
            className="w-full justify-start gap-2"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </CardFooter>
    </Card>
  );
}
