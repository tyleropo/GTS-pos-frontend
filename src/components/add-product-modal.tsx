"use client";

import { useMemo, useState, useTransition } from "react";
import type { Category } from "@/src/lib/api/products";
import type { NewInventoryItem } from "@/src/types/inventory";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/src/components/image-upload";
import { uploadProductImage } from "@/src/lib/api/products";
import { toast } from "sonner";

type AddProductModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: NewInventoryItem) => Promise<void> | void;
  categories: Category[];
  isSaving?: boolean;
};



export function AddProductModal({
  open,
  onClose,
  onCreate,
  categories,
  isSaving = false,
}: AddProductModalProps) {
  // Basic Info
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState<string>("unassigned");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Pricing & Stock
  const [costPrice, setCostPrice] = useState<string>("0");
  const [sellingPrice, setSellingPrice] = useState<string>("0");
  const [markup, setMarkup] = useState<string>("0");
  const [taxRate, setTaxRate] = useState<string>("0");
  const [stockQuantity, setStockQuantity] = useState<string>("0");
  const [reorderLevel, setReorderLevel] = useState<string>("0");
  const [maxStockLevel, setMaxStockLevel] = useState<string>("0");

  const [isPending, startTransition] = useTransition();

  const pending = isPending || isSaving;

  const suggestedMarkup = useMemo(() => {
    const cost = parseFloat(costPrice);
    const price = parseFloat(sellingPrice);
    if (!Number.isFinite(cost) || cost <= 0 || !Number.isFinite(price)) {
      return 0;
    }
    return ((price - cost) / cost) * 100;
  }, [costPrice, sellingPrice]);

  const resetForm = () => {
    setName("");
    setSku("");
    setBarcode("");
    setCategoryId("unassigned");
    setBrand("");
    setModel("");
    setDescription("");
    setImageUrl("");
    setCostPrice("0");
    setSellingPrice("0");
    setMarkup("0");
    setTaxRate("0");
    setStockQuantity("0");
    setReorderLevel("0");
    setMaxStockLevel("0");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const payload: NewInventoryItem = {
        name,
        sku: sku || undefined,
        barcode: barcode || undefined,
        category_id: categoryId === "unassigned" ? undefined : (categoryId as string),
        brand: brand || undefined,
        model: model || undefined,
        description: description || undefined,
        image_url: imageUrl || undefined,
        cost_price: parseFloat(costPrice) || 0,
        selling_price: parseFloat(sellingPrice) || 0,
        markup_percentage: parseFloat(markup) || suggestedMarkup || undefined,
        tax_rate: parseFloat(taxRate) || 0,
        stock_quantity: parseInt(stockQuantity, 10) || 0,
        reorder_level: parseInt(reorderLevel, 10) || 0,
        max_stock_level: parseInt(maxStockLevel, 10) || undefined,
      };

      await onCreate(payload);
      resetForm();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add new product</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Capture the critical product details needed to keep your inventory
            accurate and traceable.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Info Section */}
            <div>
                <h3 className="text-lg font-medium mb-4">General Information</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="name">Product name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g. iPhone 15 Pro Max"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={categoryId} onValueChange={setCategoryId} disabled={pending}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={String(category.id)}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sku">SKU (optional)</Label>
                        <Input
                            id="sku"
                            placeholder="Auto-generated if blank"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            disabled={pending}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="barcode">Barcode</Label>
                        <Input
                            id="barcode"
                            placeholder="e.g. 123456789"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Input
                            id="model"
                            placeholder="e.g. A2849"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="brand">Brand</Label>
                        <Input
                            id="brand"
                            placeholder="e.g. Apple"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Product Image</Label>
                         <ImageUpload
                            value={imageUrl}
                            onChange={async (file) => {
                                if (file) {
                                  try {
                                    const { url } = await uploadProductImage(file);
                                    setImageUrl(url);
                                    toast.success("Image uploaded successfully");
                                  } catch (error) {
                                    console.error("Upload failed", error);
                                    toast.error("Failed to upload image");
                                  }
                                } else {
                                    setImageUrl("");
                                }
                            }}
                            disabled={pending}
                        />
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                     <Label htmlFor="description">Description (optional)</Label>
                     <Input
                        id="description"
                        placeholder="Product description..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={pending}
                     />
                </div>
            </div>

            <div className="h-px bg-border" />

            {/* Pricing Section */}
            <div>
                <h3 className="text-lg font-medium mb-4">Pricing & Inventory</h3>
                 <div className="grid gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                        <Label htmlFor="cost">Cost price *</Label>
                        <Input
                            id="cost"
                            type="number"
                            min={0}
                            step="0.01"
                            value={costPrice}
                            onChange={(e) => setCostPrice(e.target.value)}
                            disabled={pending}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">Selling price *</Label>
                         <Input
                            id="price"
                            type="number"
                            min={0}
                            step="0.01"
                            value={sellingPrice}
                            onChange={(e) => setSellingPrice(e.target.value)}
                            disabled={pending}
                            required
                        />
                         <p className="text-xs text-muted-foreground">
                            Margin: {suggestedMarkup.toFixed(1)}%
                        </p>
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="markup">Markup %</Label>
                         <Input
                            id="markup"
                            type="number"
                            min={0}
                             step="0.1"
                            value={markup}
                            onChange={(e) => setMarkup(e.target.value)}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="tax_rate">Tax Rate %</Label>
                         <Input
                            id="tax_rate"
                            type="number"
                            min={0}
                            step="0.1"
                            value={taxRate}
                             onChange={(e) => setTaxRate(e.target.value)}
                            disabled={pending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="stock">Initial stock *</Label>
                         <Input
                            id="stock"
                            type="number"
                            min={0}
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(e.target.value)}
                            disabled={pending}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="reorder">Reorder level</Label>
                        <Input
                            id="reorder"
                             type="number"
                            min={0}
                             value={reorderLevel}
                            onChange={(e) => setReorderLevel(e.target.value)}
                            disabled={pending}
                        />
                    </div>
                     <div className="space-y-2">
                         <Label htmlFor="max_stock">Max Stock</Label>
                        <Input
                            id="max_stock"
                             type="number"
                            min={0}
                             value={maxStockLevel}
                            onChange={(e) => setMaxStockLevel(e.target.value)}
                            disabled={pending}
                        />
                    </div>
                 </div>
            </div>

            <div className="h-px bg-border" />

          <DialogFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving product…
                </>
              ) : (
                "Create product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
