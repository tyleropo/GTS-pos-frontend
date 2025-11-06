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
import { Checkbox } from "@/src/components/ui/checkbox";
import { Loader2 } from "lucide-react";

type AddProductModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: NewInventoryItem) => Promise<void> | void;
  categories: Category[];
  isSaving?: boolean;
};

const numberFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export function AddProductModal({
  open,
  onClose,
  onCreate,
  categories,
  isSaving = false,
}: AddProductModalProps) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("unassigned");
  const [costPrice, setCostPrice] = useState<string>("0");
  const [sellingPrice, setSellingPrice] = useState<string>("0");
  const [stockQuantity, setStockQuantity] = useState<string>("0");
  const [reorderLevel, setReorderLevel] = useState<string>("0");
  const [isSerialized, setIsSerialized] = useState(false);
  const [brand, setBrand] = useState("");
  const [markup, setMarkup] = useState<string>("0");
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
    setSku("");
    setName("");
    setCategoryId("unassigned");
    setCostPrice("0");
    setSellingPrice("0");
    setStockQuantity("0");
    setReorderLevel("0");
    setIsSerialized(false);
    setBrand("");
    setMarkup("0");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const payload: NewInventoryItem = {
        name,
        sku: sku || undefined,
        category_id:
          categoryId === "unassigned" ? undefined : (categoryId as string),
        cost_price: parseFloat(costPrice) || 0,
        selling_price: parseFloat(sellingPrice) || 0,
        stock_quantity: parseInt(stockQuantity, 10) || 0,
        reorder_level: parseInt(reorderLevel, 10) || 0,
        is_serialized: isSerialized,
        brand: brand || undefined,
        markup_percentage: parseFloat(markup) || suggestedMarkup || undefined,
      };

      await onCreate(payload);
      resetForm();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add new product</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Capture the critical product details needed to keep your inventory
            accurate and traceable.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product name</Label>
              <Input
                id="name"
                placeholder="e.g. iPhone 15 Pro Max"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU (optional)</Label>
              <Input
                id="sku"
                placeholder="Auto-generated if blank"
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                disabled={pending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={pending}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand (optional)</Label>
              <Input
                id="brand"
                placeholder="e.g. Apple"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                disabled={pending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost price</Label>
              <Input
                id="cost"
                type="number"
                min={0}
                step="0.01"
                value={costPrice}
                onChange={(event) => setCostPrice(event.target.value)}
                disabled={pending}
                required
              />
              <p className="text-xs text-muted-foreground">
                Landed cost: {numberFormatter.format(parseFloat(costPrice) || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Selling price</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                value={sellingPrice}
                onChange={(event) => setSellingPrice(event.target.value)}
                disabled={pending}
                required
              />
              <p className="text-xs text-muted-foreground">
                Suggested markup: {suggestedMarkup.toFixed(1)}%
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="markup">Markup % (optional)</Label>
              <Input
                id="markup"
                type="number"
                min={0}
                step="0.1"
                value={markup}
                onChange={(event) => setMarkup(event.target.value)}
                disabled={pending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="stock">Initial stock</Label>
              <Input
                id="stock"
                type="number"
                min={0}
                value={stockQuantity}
                onChange={(event) => setStockQuantity(event.target.value)}
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
                onChange={(event) => setReorderLevel(event.target.value)}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                Serialized tracking
              </Label>
              <label className="flex h-10 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm">
                <Checkbox
                  checked={isSerialized}
                  onCheckedChange={(checked) =>
                    setIsSerialized(Boolean(checked))
                  }
                  disabled={pending}
                  aria-label="Serialized inventory"
                />
                <span className="text-muted-foreground">
                  Requires serial numbers
                </span>
              </label>
            </div>
          </div>

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
