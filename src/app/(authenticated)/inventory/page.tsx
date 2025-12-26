"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/src/components/site-header";
import { InventoryStats } from "@/src/app/(authenticated)/inventory/InventoryStats";
import { InventoryTable } from "@/src/app/(authenticated)/inventory/InventoryTable";
import { AddProductModal } from "@/src/components/add-product-modal";
import { ProductFormModal } from "@/src/app/(authenticated)/inventory/ProductFormModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Plus, RefreshCcw } from "lucide-react";
import { createProduct } from "@/src/lib/api/products";
import type { InventoryItem, NewInventoryItem } from "@/src/types/inventory";
import { Skeleton } from "@/src/components/ui/skeleton";
import { toast } from "sonner";
import {
  useProductCategoriesList,
  useProductsQuery,
} from "@/src/hooks/use-products-data";

export default function InventoryPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(false);
  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);

  const {
    categories,
    isLoading: isLoadingCategories,
    error: categoriesError,
    refresh: refreshCategories,
  } = useProductCategoriesList();

  const productQuery = useMemo(
    () => ({
      per_page: 100,
    }),
    []
  );

  const {
    products,
    isLoading: isLoadingProducts,
    error: productsError,
    refresh: refreshProducts,
    setProducts: setFetchedProducts,
  } = useProductsQuery(productQuery, { enabled: true });

  useEffect(() => {
    if (productsError) {
      toast.error(productsError.message);
    }
  }, [productsError]);

  useEffect(() => {
    if (categoriesError) {
      toast.error(categoriesError.message);
    }
  }, [categoriesError]);

  const isLoading = isLoadingProducts || isLoadingCategories;

  const handleSyncInventory = useCallback(async () => {
    setIsSyncing(true);
    try {
      await Promise.all([refreshProducts(), refreshCategories()]);
    } finally {
      setIsSyncing(false);
    }
  }, [refreshCategories, refreshProducts]);

  const handleCreateProduct = useCallback(
    async (payload: NewInventoryItem) => {
      setIsSaving(true);
      try {
        const product = await createProduct(payload);
        setFetchedProducts((prev) => [product, ...prev]);
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
    },
    [setFetchedProducts]
  );

  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

  const handleEditProduct = useCallback((product: InventoryItem) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  }, []);

  const handleProductUpdated = useCallback(() => {
    refreshProducts();
    setIsEditModalOpen(false);
    setSelectedProduct(undefined);
    toast.success("Product updated successfully");
  }, [refreshProducts]);

  const headerActions = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleSyncInventory}
          disabled={isSyncing}
          aria-label="Refresh inventory"
        >
          <RefreshCcw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
        </Button>
        <Button size="sm" onClick={handleOpenModal}>
          <Plus className="mr-2 h-4 w-4" />
          New product
        </Button>
      </div>
    ),
    [handleOpenModal, handleSyncInventory, isSyncing]
  );

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader
        title="Inventory management"
        subtitle="Track product availability, valuation, and stocking actions."
        actions={headerActions}
      />

      <div className="flex-1 space-y-6 px-4 py-4 lg:p-6">
        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          {isLoading ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : (
        <InventoryStats items={products} />
          )}
        </section>

        <Card className="border-none shadow-none lg:border lg:shadow-sm">
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">
                Inventory catalogue
              </CardTitle>
              <CardDescription>
                Manage stock levels, pricing, and category assignments for every
                listed product.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={handleOpenModal}>
                <Plus className="mr-2 h-4 w-4" />
                Add product
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <InventoryTable
              items={products}
              categories={categories}
              isLoading={isLoading}
              onProductUpdated={refreshProducts}
              onEdit={handleEditProduct}
            />
          </CardContent>
        </Card>
      </div>

      <AddProductModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onCreate={handleCreateProduct}
        categories={categories}
        isSaving={isSaving}
      />
      
      <ProductFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        product={selectedProduct}
        categories={categories}
        onSuccess={handleProductUpdated}
      />
    </div>
  );
}
