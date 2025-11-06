import type { InventoryItem } from "@/src/types/inventory";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export function InventoryStats({ items }: { items: InventoryItem[] }) {
  const totalProducts = items.length;
  const lowStockItems = items.filter(
    (item) =>
      item.stock_quantity <= item.reorder_level && item.stock_quantity > 0
  ).length;
  const outOfStockItems = items.filter(
    (item) => item.stock_quantity === 0
  ).length;
  const inventoryValue = items.reduce(
    (sum, item) => sum + item.cost_price * item.stock_quantity,
    0
  );
  const uniqueCategories = new Set(
    items.map((item) => item.category?.name ?? "Uncategorized")
  ).size;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{totalProducts}</div>
          <p className="text-xs text-muted-foreground">
            Across {uniqueCategories} categories
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Inventory Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {currency.format(inventoryValue)}
          </div>
          <p className="text-xs text-muted-foreground">
            Based on landed cost price
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Low Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold text-amber-600">
            {lowStockItems}
          </div>
          <p className="text-xs text-muted-foreground">
            Items below reorder point
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Out of Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold text-red-600">
            {outOfStockItems}
          </div>
          <p className="text-xs text-muted-foreground">
            Items that require replenishment
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
