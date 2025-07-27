import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card"

type LowStockItem = {
  name: string
  sku: string
  stock: number
}

type LowStockListProps = {
  items: LowStockItem[]
}

export function LowStockList({ items }: LowStockListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Low Stock Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between">
            <div>
              <div className="text-sm font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">{item.sku}</div>
            </div>
            <span className="text-sm text-red-600">{item.stock} left</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
