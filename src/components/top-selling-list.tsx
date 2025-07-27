import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card"

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
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Products</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {products.map((item, i) => (
          <div key={i} className="flex justify-between">
            <div>
              <div className="text-sm font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">{item.sku}</div>
            </div>
            <span className="text-sm">{item.sold} sold</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
