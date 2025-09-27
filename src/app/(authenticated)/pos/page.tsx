'use client';

import { useState } from "react";
import { ProductFilterTabs } from "@/src/components/product-filter-tabs";
import { ProductCard } from "@/src/components/product-card";
import { CartPanel } from "@/src/components/cart-panel";
import { BarcodeInput } from "@/src/components/barcode-input";
import { SiteHeader } from "@/src/components/site-header";

const sampleProducts = [
  { id: '1', name: 'Samsung Galaxy S23 Ultra', price: 1199.99, category: 'All-in-One PCs' },
  { id: '2', name: 'ASUS ROG Zephyrus G14 Laptop', price: 1599.99, category: 'All-in-One PCs' },
  { id: '3', name: 'Sony WH-1000XM5 Headphones', price: 349.99, category: 'Audio Equipment' },
  { id: '4', name: 'Logitech MX Master 3S Mouse', price: 99.99, category: 'Audio Equipment' },
];

const categories = [
  'All-in-One PCs',
  'Anti-Static Equipment',
  'Audio Equipment',
  'Bags & Sleeves',
  'Bluetooth & Smart Accessories',
  'Cable Management Tools',
  'Cameras & Camcorders',
  'Chargers & Adapters',
];

export default function POSPage() {
  const [selectedCat, setSelectedCat] = useState(categories[0]);
  const [cart, setCart] = useState<any[]>([]);

  const filtered = selectedCat === categories[0]
    ? sampleProducts
    : sampleProducts.filter((p) => p.category === selectedCat);

  const addToCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      const product = sampleProducts.find((p) => p.id === id)!;
      return [...prev, { ...product, qty: 1 }];
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-[100dvh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <SiteHeader title="Point of Sales" />
        <span className="text-sm text-muted-foreground sm:text-right">Cashier: Admin User</span>
      </div>

      {/* Barcode Scanner */}
      <div>
        <BarcodeInput onScan={(code) => alert(`Scanned: ${code}`)} />
      </div>

      {/* Category Tabs */}
      <div className="overflow-x-auto -mx-1">
        <ProductFilterTabs
          categories={categories}
          selected={selectedCat}
          onSelect={setSelectedCat}
        />
      </div>

      {/* Product + Cart Panel (mobile first: vertical, then grid on sm+) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Products */}
        <div className="lg:col-span-8 xl:col-span-9 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addToCart} />
          ))}
        </div>

        {/* Cart */}
        <div className="lg:col-span-4 xl:col-span-3">
          <CartPanel
            cart={cart}
            onClear={() => setCart([])}
            onCheckout={(method) => alert(`Paid by ${method}`)}
          />
        </div>
      </div>
    </div>
  );
}
