"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { ProductFilterTabs } from "@/src/components/product-filter-tabs";
import { ProductCard } from "@/src/components/product-card";
import { CartPanel, CartLineItem } from "@/src/components/cart-panel";
import { BarcodeInput } from "@/src/components/barcode-input";
import { SiteHeader } from "@/src/components/site-header";
import { fetchProductByBarcode, type Product } from "@/src/lib/api/products";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { RefreshCcw, ShoppingBag, QrCode } from "lucide-react";
import { useDebounce } from "@/src/hooks/use-debounce";
import {
  useProductCategoriesList,
  useProductsQuery,
} from "@/src/hooks/use-products-data";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/src/components/ui/drawer";
import { CameraBarcodeScanner } from "@/src/components/camera-barcode-scanner";

type CartAction =
  | { type: "add"; product: Product }
  | { type: "clear" };

function cartReducer(state: CartLineItem[], action: CartAction) {
  switch (action.type) {
    case "add": {
      const existing = state.find((item) => item.id === action.product.id);
      if (existing) {
        return state.map((item) =>
          item.id === action.product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...state,
        {
          id: action.product.id,
          name: action.product.name,
          price: action.product.selling_price,
          quantity: 1,
        },
      ];
    }
    case "clear":
      return [];
    default:
      return state;
  }
}

export default function POSPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cartItems, dispatchCart] = useReducer(cartReducer, []);
  const debouncedSearch = useDebounce(searchQuery, 350);

  const filters = useMemo(
    () => ({
      per_page: 24,
      category_id: selectedCategoryId === "all" ? undefined : selectedCategoryId,
      search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
    }),
    [debouncedSearch, selectedCategoryId]
  );

  const {
    categories,
    isLoading: isLoadingCategories,
    error: categoriesError,
    refresh: refreshCategories,
  } = useProductCategoriesList();

  const {
    products,
    isLoading: isLoadingProducts,
    error: productsError,
    refresh: refreshProducts,
  } = useProductsQuery(filters, {
    enabled: !isLoadingCategories,
  });

  useEffect(() => {
    if (categoriesError) {
      toast.error(categoriesError.message);
    }
  }, [categoriesError]);

  useEffect(() => {
    if (productsError) {
      toast.error(productsError.message);
    }
  }, [productsError]);

  const addProductToCart = useCallback((product: Product) => {
    dispatchCart({ type: "add", product });
  }, []);

  const handleScan = useCallback(
    async (barcode: string) => {
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
    },
    [addProductToCart]
  );

  const cartTotals = useMemo(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const taxRate = 0.12;
    const tax = subtotal * taxRate;
    return {
      subtotal,
      tax,
      total: subtotal + tax,
    };
  }, [cartItems]);

  const hasCartItems = cartItems.length > 0;

  const handleCheckout = useCallback(
    (method: "cash" | "card" | "gcash") => {
      if (cartItems.length === 0) {
        toast.error("Cart is empty.");
        return;
      }
      toast.success(
        `Checkout via ${method.toUpperCase()} for ₱${cartTotals.total.toFixed(
          2
        )}`
      );
      dispatchCart({ type: "clear" });
      setIsCartDrawerOpen(false);
    },
    [cartItems.length, cartTotals.total]
  );

  const handleClearCart = useCallback(() => {
    dispatchCart({ type: "clear" });
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshCategories(), refreshProducts()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshCategories, refreshProducts]);

  const cartCountLabel =
    cartItems.length === 0
      ? "Cart is empty"
      : `${cartItems.length} item${cartItems.length > 1 ? "s" : ""}`;

  return (
    <div className="flex min-h-svh flex-col bg-background pb-24 lg:pb-0">
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

      <div className="flex-1 space-y-6 px-4 py-4 lg:p-6">
        <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm lg:shadow-none">
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex-1">
                <BarcodeInput
                  onScan={handleScan}
                  placeholder="Enter or paste a barcode, then press Enter"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => setIsScannerOpen(true)}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Scan with camera
              </Button>
            </div>
            <Input
              placeholder="Search by name, SKU, or keyword"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full"
              aria-label="Search products"
            />
          </div>
          <div className="overflow-x-auto">
            <ProductFilterTabs
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
            />
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-sm lg:p-6">
          {isLoadingProducts ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              No products match the selected filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addProductToCart}
                />
              ))}
            </div>
          )}
        </section>

        <div className="hidden lg:block">
          <CartPanel
            items={cartItems}
            onClear={handleClearCart}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      <div className="lg:hidden">
        <div className="fixed bottom-4 left-0 right-0 z-20 px-4">
          <Button
            size="lg"
            className="w-full shadow-lg"
            onClick={() => setIsCartDrawerOpen(true)}
            variant={hasCartItems ? "default" : "outline"}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            {hasCartItems ? `View cart · ${cartCountLabel}` : "Add items to cart"}
          </Button>
        </div>
      </div>

      <Drawer open={isCartDrawerOpen} onOpenChange={setIsCartDrawerOpen}>
        <DrawerContent className="max-h-[85vh] rounded-t-3xl border-t">
          <DrawerHeader className="pb-0">
            <DrawerTitle>Current cart</DrawerTitle>
            <DrawerDescription>
              Review line items and complete the checkout.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pt-0">
            <CartPanel
              items={cartItems}
              onClear={handleClearCart}
              onCheckout={handleCheckout}
            />
          </div>
        </DrawerContent>
      </Drawer>
      <CameraBarcodeScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onDetected={(code) => {
          setIsScannerOpen(false);
          void handleScan(code);
        }}
        title="Scan product barcode"
        description="Use your device camera to capture a barcode or QR code and add the product instantly."
      />
    </div>
  );
}
