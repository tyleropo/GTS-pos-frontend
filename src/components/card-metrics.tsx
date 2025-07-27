import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/src/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

type CardMetricProps = {
  title: string
  value: string
  percentage: string
  trend: "up" | "down"
  hint: string
}

export function CardMetric({ title, value, percentage, trend, hint }: CardMetricProps) {
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight
  const color = trend === "up" ? "text-green-600" : "text-red-500"

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className={`flex items-center gap-1 ${color}`}>
          <TrendIcon className="w-4 h-4" />
          {percentage}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-sm text-muted-foreground mt-1">{hint}</p>
      </CardContent>
    </Card>
  )
}
