import { Button } from "@/src/components/ui/button";

export function ProductCard({ product, onAdd }: {
  product: { id: string; name: string; price: number };
  onAdd: (productId: string) => void;
}) {
  return (
    <div className="border p-4 rounded-md shadow-sm flex flex-col justify-between">
      <div>
        <h4 className="font-medium">{product.name}</h4>
        <p className="text-muted-foreground">${product.price.toFixed(2)}</p>
      </div>
      <Button className="mt-4 bg-green-500" onClick={() => onAdd(product.id)}>
        Add to Cart
      </Button>
    </div>
  );
}
