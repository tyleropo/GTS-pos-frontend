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
import { ShoppingCart, Package } from "lucide-react";
import Image from "next/image";

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
    <Card className="flex h-full flex-col justify-between overflow-hidden">
      <div className="relative aspect-video w-full bg-muted">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Package className="h-8 w-8 opacity-20" />
          </div>
        )}
      </div>
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
