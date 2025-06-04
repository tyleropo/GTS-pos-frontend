export type Customer = {
  id: number
  name: string
  email: string
  phone: string
  address: string
  totalSpent: number
  orders: number
  lastPurchase: string // could be Date, but string is fine for now
  status: "Active" | "Inactive"
  type: "Regular" | "VIP"
}