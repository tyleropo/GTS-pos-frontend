"use client";
import React, { useState } from "react";
import mockInventory from "@/src/data/mockInventory";
import { SiteHeader } from "@/src/components/site-header";
import { InventoryItem, NewInventoryItem } from "@/src/types/inventory";
import InventoryTable from "@/src/app/(authenticated)/inventory/InventoryTable";
import InventoryStats from "@/src/app/(authenticated)/inventory/InventoryStats";
import AddProductModal from "@/src/components/addProductModal";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";

const Page = () => {
  const [items, setItems] = useState<InventoryItem[]>(mockInventory);
  const [showModal, setShowModal] = useState(false);

  const addProduct = (product: NewInventoryItem) => {
    const newItem: InventoryItem = {
      ...product,
      id: Date.now(),
      lastUpdated: new Date().toISOString(),
    };
    setItems((prev) => [...prev, newItem]);
    setShowModal(false);
  };
  return (
    <div>
      <SiteHeader title="Inventory Management" />
      <div className="p-4">
      <InventoryStats items={items} />
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex justify-between">
            Inventory List
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
            {/* 2) Modal also lives on its own (sibling), controlled by `showModal` */}
            <AddProductModal
              open={showModal}
              onClose={() => setShowModal(false)}
              onAdd={addProduct}
            />
          </CardTitle>
          <CardDescription>
            Manage your product inventory, stock levels, and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryTable items={items} />
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Page;
