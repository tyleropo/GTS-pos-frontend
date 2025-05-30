export type InventoryItem = {
  id: number
  name: string
  sku: string
  category: string
  stock: number
  price: number
  cost: number
  status: string
  supplier: string
  reorderLevel: number
  lastUpdated: string
}

export type NewInventoryItem = Omit<InventoryItem, "id" | "lastUpdated">