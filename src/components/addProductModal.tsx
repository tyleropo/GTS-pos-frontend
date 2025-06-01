"use client"

import React, { useState, FormEvent } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog"
import { Label } from "@/src/components/ui/label"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"

// Now matches your NewInventoryItem exactly:
export interface NewInventoryItem {
  name: string
  sku: string
  category: string
  stock: number
  price: number
  cost: number
  status: string
  supplier: string
  reorderLevel: number
}

interface AddProductModalProps {
  open: boolean
  onClose: () => void
  onAdd: (product: NewInventoryItem) => void
}

export function AddProductModal({ open, onClose, onAdd }: AddProductModalProps) {
  // Local state for each form field (all keys from NewInventoryItem):
  const [name, setName] = useState<string>("")
  const [sku, setSku] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  const [stock, setStock] = useState<number>(0)
  const [price, setPrice] = useState<number>(0)
  const [cost, setCost] = useState<number>(0)
  const [status, setStatus] = useState<string>("")
  const [supplier, setSupplier] = useState<string>("")
  const [reorderLevel, setReorderLevel] = useState<number>(0)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const newProduct: NewInventoryItem = {
      name,
      sku,
      category,
      stock,
      price,
      cost,
      status,
      supplier,
      reorderLevel,
    }
    onAdd(newProduct)

    // Clear inputs (optional)
    setName("")
    setSku("")
    setCategory("")
    setStock(0)
    setPrice(0)
    setCost(0)
    setStatus("")
    setSupplier("")
    setReorderLevel(0)

    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
          <DialogDescription>
            Fill in all fields below, then click “Add Item.”
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Name */}
          <div>
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. iPhone Screen"
              required
            />
          </div>

          {/* SKU */}
          <div>
            <Label htmlFor="item-sku">SKU</Label>
            <Input
              id="item-sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. IPHN-SCRN-001"
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="item-category">Category</Label>
            <Input
              id="item-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Electronics"
              required
            />
          </div>

          {/* Stock */}
          <div>
            <Label htmlFor="item-stock">Stock</Label>
            <Input
              id="item-stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(parseInt(e.target.value, 10))}
              min={0}
              placeholder="0"
              required
            />
          </div>

          {/* Price */}
          <div>
            <Label htmlFor="item-price">Price</Label>
            <Input
              id="item-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              min={0}
              step={0.01}
              placeholder="0.00"
              required
            />
          </div>

          {/* Cost */}
          <div>
            <Label htmlFor="item-cost">Cost</Label>
            <Input
              id="item-cost"
              type="number"
              value={cost}
              onChange={(e) => setCost(parseFloat(e.target.value))}
              min={0}
              step={0.01}
              placeholder="0.00"
              required
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="item-status">Status</Label>
            <Input
              id="item-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="e.g. Active, Discontinued"
              required
            />
          </div>

          {/* Supplier */}
          <div>
            <Label htmlFor="item-supplier">Supplier</Label>
            <Input
              id="item-supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Acme Corp"
              required
            />
          </div>

          {/* Reorder Level */}
          <div>
            <Label htmlFor="item-reorder-level">Reorder Level</Label>
            <Input
              id="item-reorder-level"
              type="number"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(parseInt(e.target.value, 10))}
              min={0}
              placeholder="0"
              required
            />
          </div>

          <DialogFooter className="flex justify-end space-x-2 pt-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


export default AddProductModal