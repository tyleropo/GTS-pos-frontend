import React from "react";
import { InventoryItem } from "@/src/types/inventory";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

const InventoryStats = ({ items }: { items: InventoryItem[] }) => {
  const totalItems = items.length;
  const lowStockItems = items.filter(
    (i) => i.stock <= i.reorderLevel && i.stock > 0
  ).length;
  const outOfStockItems = items.filter((i) => i.stock === 0).length;
  const inventoryValue = items.reduce((sum, i) => sum + i.stock * i.cost, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalItems}</div>
          <p className="text-xs text-muted-foreground">
            Across {new Set(items.map((item) => item.category)).size} categories
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${inventoryValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Based on cost price</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0"> 
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{lowStockItems}</div>
          <p className="text-xs text-muted-foreground">
            Items below reorder level
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{outOfStockItems}</div>
          <p className="text-xs text-muted-foreground">Items to reorder</p>{" "}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryStats;
