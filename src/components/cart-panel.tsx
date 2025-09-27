import { Button } from "@/src/components/ui/button";

export function CartPanel({ cart, onClear, onCheckout }: {
  cart: { id: string; name: string; price: number; qty: number }[];
  onClear: () => void;
  onCheckout: (method: "cash" | "card") => void;
}) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <aside className="w-[300px] p-4 border-l flex flex-col justify-between h-full">
      <div>
        <h3 className="text-lg font-semibold mb-4">Cart</h3>
        {cart.length === 0 ? (
          <p className="text-muted-foreground text-sm">Your cart is empty</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {cart.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.name} × {item.qty}</span>
                <span>${(item.price * item.qty).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>
      </div>
      <div className="space-y-2 mt-4">
        <Button variant="outline" onClick={() => onCheckout("cash")}>Cash</Button>
        <Button className="bg-green-500" onClick={() => onCheckout("card")}>Card</Button>
      </div>
    </aside>
  );
}
