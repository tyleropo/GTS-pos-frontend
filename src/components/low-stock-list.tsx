import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Badge } from "@/src/components/ui/badge"

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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Low Stock Items</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground h-[200px]">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2 opacity-50" />
            <p className="text-sm font-medium text-emerald-600">Stock levels healthy</p>
            <p className="text-xs">No items below reorder level</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-center group">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                    {item.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.sku}</div>
                </div>
                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                  {item.stock} left
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
