import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/src/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

type CardMetricProps = {
  title: string;
  value: string | number;
  percentage?: string | number | null;
  trend?: "up" | "down" | "neutral";
  hint?: string | null;
};

export function CardMetric({
  title,
  value,
  percentage,
  trend = "neutral",
  hint,
}: CardMetricProps) {
  const TrendIcon =
    trend === "neutral" ? null : trend === "up" ? ArrowUpRight : ArrowDownRight;
  const color =
    trend === "neutral"
      ? "text-muted-foreground"
      : trend === "up"
        ? "text-emerald-600"
        : "text-red-500";

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {percentage ? (
          <CardDescription className={`flex items-center gap-1 ${color}`}>
            {TrendIcon ? <TrendIcon className="h-4 w-4" /> : null}
            <span className="font-medium">
              {typeof percentage === "number" ? `${percentage}%` : percentage}
            </span>
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {hint ? (
          <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
