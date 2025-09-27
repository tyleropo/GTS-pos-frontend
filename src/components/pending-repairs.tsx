import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Wrench } from "lucide-react"

type Repair = {
  id: string
  customer: string
  status?: string
}

type PendingRepairsProps = {
  repairs: Repair[]
}

export function PendingRepairs({ repairs }: PendingRepairsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Repairs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {repairs.map((item, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Repair {item.id}</p>
                <p className="text-xs text-muted-foreground">Customer: {item.customer}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-100">
              {item.status || "In Progress"}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
