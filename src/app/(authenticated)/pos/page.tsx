"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductFilterTabs } from "@/src/components/product-filter-tabs";
import { ProductCard } from "@/src/components/product-card";
import { CartPanel, CartLineItem } from "@/src/components/cart-panel";
import { BarcodeInput } from "@/src/components/barcode-input";
import { SiteHeader } from "@/src/components/site-header";
import {
  fetchProductByBarcode,
  fetchProductCategories,
  fetchProducts,
  type Product,
  type Category,
} from "@/src/lib/api/products";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useDebounce } from "@/src/hooks/use-debounce";

export default function POSPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cartItems, setCartItems] = useState<CartLineItem[]>([]);
  const [isCatalogueReady, setIsCatalogueReady] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 350);

  const loadProducts = useCallback(
    async (categoryId: string, search?: string) => {
      setIsLoadingProducts(true);
      try {
        const { data } = await fetchProducts({
          per_page: 24,
          category_id: categoryId === "all" ? undefined : categoryId,
          search: search?.trim() ? search.trim() : undefined,
        });
        setProducts(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load product catalogue.";
        toast.error(message);
      } finally {
        setIsLoadingProducts(false);
      }
    },
    []
  );

  useEffect(() => {
    async function bootstrap() {
      try {
        const categoriesPayload = await fetchProductCategories();
        setCategories(categoriesPayload);
        setIsCatalogueReady(true);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to initialize POS catalogue.";
        toast.error(message);
        setIsCatalogueReady(false);
        setIsLoadingProducts(false);
      }
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!isCatalogueReady) return;
    void loadProducts(selectedCategoryId, debouncedSearch);
  }, [debouncedSearch, isCatalogueReady, loadProducts, selectedCategoryId]);

  const handleScan = async (barcode: string) => {
    if (!barcode) return;
    try {
      const product = await fetchProductByBarcode(barcode);
      addProductToCart(product);
      toast.success(`Added ${product.name} via barcode scan.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Product not found.";
      toast.error(message);
    }
  };

  const addProductToCart = (product: Product) => {
    setCartItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: product.selling_price,
          quantity: 1,
        },
      ];
    });
  };

  const handleCheckout = (method: "cash" | "card" | "gcash") => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty.");
      return;
    }
    toast.success(`Checkout initiated via ${method.toUpperCase()}.`);
    setCartItems([]);
  };

  const filteredProducts = useMemo(() => products, [products]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProducts(selectedCategoryId, debouncedSearch);
    setIsRefreshing(false);
  };

  return (
    <div className="flex flex-col">
      <SiteHeader
        title="Point of sale"
        subtitle="Add products to the cart, scan barcodes, and complete transactions."
        actions={
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh catalogue"
          >
            <RefreshCcw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        }
      />

      <div className="space-y-6 p-4 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <BarcodeInput onScan={handleScan} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                placeholder="Search products or scan a barcode…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full sm:max-w-xs"
              />
              <ProductFilterTabs
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
              />
            </div>

            {isLoadingProducts ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                    No products match the selected filters.
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={addProductToCart}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          <CartPanel
            items={cartItems}
            onClear={() => setCartItems([])}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
}
