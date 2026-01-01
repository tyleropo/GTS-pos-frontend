"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/src/components/ui/card";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Wrench,
  ShoppingCart,
  Users,
  Clock
} from "lucide-react";

type CardMetricProps = {
  title: string;
  value: string | number;
  percentage?: string | number | null;
  trend?: "up" | "down" | "neutral";
  hint?: string | null;
  href?: string;
  icon?: "revenue" | "products" | "low-stock" | "repairs" | "orders" | "customers";
};

const iconMap = {
  revenue: DollarSign,
  products: Package,
  "low-stock": AlertTriangle,
  repairs: Wrench,
  orders: ShoppingCart,
  customers: Users,
};

const iconColorMap = {
  revenue: "bg-emerald-100 text-emerald-600",
  products: "bg-blue-100 text-blue-600",
  "low-stock": "bg-amber-100 text-amber-600",
  repairs: "bg-purple-100 text-purple-600",
  orders: "bg-indigo-100 text-indigo-600",
  customers: "bg-pink-100 text-pink-600",
};

export function CardMetric({
  title,
  value,
  percentage,
  trend = "neutral",
  hint,
  href,
  icon,
}: CardMetricProps) {
  const router = useRouter();
  
  const TrendIcon =
    trend === "neutral" ? null : trend === "up" ? ArrowUpRight : ArrowDownRight;
  const color =
    trend === "neutral"
      ? "text-muted-foreground"
      : trend === "up"
        ? "text-emerald-600"
        : "text-red-500";

  const Icon = icon ? iconMap[icon] : null;
  const iconColor = icon ? iconColorMap[icon] : "";

  const handleClick = () => {
    if (href) {
      router.push(href);
    }
  };

  return (
    <Card 
      className={`transition-all duration-200 ${href ? 'cursor-pointer hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5' : ''}`}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && (
            <div className={`p-2 rounded-lg ${iconColor}`}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        {percentage ? (
          <CardDescription className={`flex items-center gap-1 ${color}`}>
            {/* {TrendIcon ? <TrendIcon className="h-4 w-4" /> : null}
            <span className="font-medium">
              {typeof percentage === "number" ? `${percentage}%` : percentage}
            </span>
            <span className="text-muted-foreground text-xs">vs yesterday</span> */}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {hint}
          </p>
        ) : href ? (
          <p className="mt-1 text-xs text-primary flex items-center gap-1">
            Click to view details →
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
