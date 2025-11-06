"use client";

import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/src/components/site-header";
import { InventoryStats } from "@/src/app/(authenticated)/inventory/InventoryStats";
import { InventoryTable } from "@/src/app/(authenticated)/inventory/InventoryTable";
import { AddProductModal } from "@/src/components/add-product-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";
import { fetchProductCategories, fetchProducts, createProduct } from "@/src/lib/api/products";
import type { InventoryItem, NewInventoryItem } from "@/src/types/inventory";
import type { Category } from "@/src/lib/api/products";
import { Skeleton } from "@/src/components/ui/skeleton";
import { toast } from "sonner";
// TODO Add a component for the new product button
export default function InventoryPage() {
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetchProducts({ per_page: 100 }),
        fetchProductCategories(),
      ]);
      setProducts(productsResponse.data);
      setCategories(categoriesResponse);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load inventory data.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const handleCreateProduct = async (payload: NewInventoryItem) => {
    setIsSaving(true);
    try {
      const product = await createProduct(payload);
      setProducts((prev) => [product, ...prev]);
      toast.success(`Added ${product.name} to inventory.`);
      setIsModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create product. Please try again.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col">
      <SiteHeader
        title="Inventory management"
        subtitle="Track product availability, valuation, and stocking actions."
        actions={
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New product
          </Button>
        }
      />

      <div className="space-y-6 p-4 lg:p-6">
        {isLoading ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : (
          <InventoryStats items={products} />
        )}

        <Card>
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold">
                Inventory catalogue
              </CardTitle>
              <CardDescription>
                Manage stock levels, pricing, and category assignments for all
                products synced from Laravel.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add product
            </Button>
          </CardHeader>
          <CardContent>
            <InventoryTable
              items={products}
              categories={categories}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      <AddProductModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateProduct}
        categories={categories}
        isSaving={isSaving}
      />
    </div>
  );
}
