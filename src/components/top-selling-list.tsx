import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card"
import { Package, TrendingUp } from "lucide-react"

type TopProduct = {
  name: string
  sku: string
  sold: number
}

type TopSellingListProps = {
  products: TopProduct[]
}

export function TopSellingList({ products }: TopSellingListProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Top Selling</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground h-[200px]">
             <Package className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No sales data yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((item, i) => (
              <div key={i} className="flex justify-between items-center group">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                    {item.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.sku}</div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {item.sold}
                  <span className="text-xs text-muted-foreground font-normal">sold</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
