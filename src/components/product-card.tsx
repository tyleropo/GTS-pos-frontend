import type { Product } from "@/src/lib/api/products";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { ShoppingCart } from "lucide-react";

type ProductCardProps = {
  product: Product;
  onAdd: (product: Product) => void;
};

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const inStock = product.stock_quantity > 0;
  const badgeVariant = inStock ? "outline" : "destructive";
  const badgeLabel = inStock
    ? `${product.stock_quantity} on hand`
    : "Out of stock";

  return (
    <Card className="flex h-full flex-col justify-between">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <Badge variant={badgeVariant}>{badgeLabel}</Badge>
          {product.brand ? (
            <Badge variant="secondary">{product.brand}</Badge>
          ) : null}
        </div>
        <CardTitle className="line-clamp-2 text-base font-semibold leading-snug">
          {product.name}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          SKU {product.sku}
          {product.barcode ? ` · Barcode ${product.barcode}` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-lg font-semibold tracking-tight text-primary">
          {currency.format(product.selling_price)}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {product.description ?? "Ready for checkout"}
        </p>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => onAdd(product)}
          disabled={!inStock}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to cart
        </Button>
      </CardFooter>
    </Card>
  );
}
