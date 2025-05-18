"use client"

import { useState } from "react"
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Printer, ReceiptText } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Separator } from "@/src/components/ui/separator"
import { Badge } from "@/src/components/ui/badge"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { SiteHeader } from "@/src/components/site-header"

// Sample product data
const products = [
  { id: 1, name: "Smartphone X", price: 799.99, category: "Electronics", image: "/placeholder.svg" },
  { id: 2, name: "Wireless Earbuds", price: 129.99, category: "Electronics", image: "/placeholder.svg" },
  { id: 3, name: "Smart Watch", price: 249.99, category: "Electronics", image: "/placeholder.svg" },
  { id: 4, name: "Bluetooth Speaker", price: 89.99, category: "Electronics", image: "/placeholder.svg" },
  { id: 5, name: "Laptop Pro", price: 1299.99, category: "Computers", image: "/placeholder.svg" },
  { id: 6, name: "Tablet Mini", price: 399.99, category: "Computers", image: "/placeholder.svg" },
  { id: 7, name: "External Hard Drive", price: 119.99, category: "Accessories", image: "/placeholder.svg" },
  { id: 8, name: "USB-C Hub", price: 49.99, category: "Accessories", image: "/placeholder.svg" },
  { id: 9, name: "Wireless Mouse", price: 29.99, category: "Accessories", image: "/placeholder.svg" },
  { id: 10, name: "Keyboard", price: 59.99, category: "Accessories", image: "/placeholder.svg" },
  { id: 11, name: "Phone Case", price: 19.99, category: "Accessories", image: "/placeholder.svg" },
  { id: 12, name: "Screen Protector", price: 9.99, category: "Accessories", image: "/placeholder.svg" },
]

// Cart item type
type CartItem = {
  id: number
  name: string
  price: number
  quantity: number
  image: string
}

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Add product to cart
  const addToCart = (product: (typeof products)[0]) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)

      if (existingItem) {
        return prevCart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      } else {
        return [...prevCart, { ...product, quantity: 1 }]
      }
    })
  }

  // Update item quantity
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }

    setCart((prevCart) => prevCart.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  // Remove item from cart
  const removeFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  // Calculate subtotal
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Calculate tax (assuming 8%)
  const tax = subtotal * 0.08

  // Calculate total
  const total = subtotal + tax

  // Clear cart
  const clearCart = () => {
    setCart([])
  }

  // Process payment (placeholder)
  const processPayment = (paymentMethod: string) => {
    alert(`Processing ${paymentMethod} payment for $${total.toFixed(2)}`)
    clearCart()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)]">
      <div className="flex items-center justify-between mb-4">
        <SiteHeader title="Point of Sales"/>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Cashier: Admin User</span>
        </div>
      </div>

      <div className="grid flex-1 gap-4 ml-5 md:grid-cols-3 lg:grid-cols-4 overflow-hidden">
        {/* Product Catalog */}
        <div className="md:col-span-2 lg:col-span-3 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs defaultValue="all" className="w-auto">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="electronics">Electronics</TabsTrigger>
                <TabsTrigger value="computers">Computers</TabsTrigger>
                <TabsTrigger value="accessories">Accessories</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pb-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                {/* <div className="aspect-square relative bg-muted">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="object-cover w-full h-full"
                    width={200}
                    height={200}
                  />
                </div> */}
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm truncate">{product.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold">${product.price.toFixed(2)}</span>
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="p-3 pt-0">
                  <Button onClick={() => addToCart(product)} className="w-full text-xs h-8" size="sm">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Shopping Cart */}
        <Card className="flex flex-col h-full">
          <CardHeader className="px-4 py-3 flex flex-row items-center">
            <CardTitle className="text-lg flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart
              {cart.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </Badge>
              )}
            </CardTitle>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="ml-auto h-8 px-2">
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </CardHeader>

          <ScrollArea className="flex-1 px-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-2" />
                <h3 className="font-medium text-muted-foreground">Your cart is empty</h3>
                <p className="text-sm text-muted-foreground mt-1">Add products to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="object-cover w-full h-full"
                        width={48}
                        height={48}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{item.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm">${item.price.toFixed(2)}</span>
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <CardFooter className="flex flex-col p-4 pt-0">
            <Separator className="my-4" />
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between">
                <span className="text-sm">Subtotal</span>
                <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tax (8%)</span>
                <span className="text-sm font-medium">${tax.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">Total</span>
                <span className="text-base font-bold">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 w-full">
              <Button
                variant="outline"
                className="w-full"
                disabled={cart.length === 0}
                onClick={() => processPayment("Cash")}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Cash
              </Button>
              <Button className="w-full" disabled={cart.length === 0} onClick={() => processPayment("Card")}>
                <CreditCard className="h-4 w-4 mr-1" />
                Card
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 w-full">
              <Button variant="secondary" className="w-full" disabled={cart.length === 0}>
                <ReceiptText className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button variant="secondary" className="w-full" disabled={cart.length === 0}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
