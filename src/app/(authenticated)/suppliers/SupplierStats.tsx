"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { Package, FileText, Clock, TrendingUp } from "lucide-react";
import type { Supplier } from "@/src/lib/api/suppliers";

interface SupplierStatsProps {
  suppliers: Supplier[];
}

export default function SupplierStats({ suppliers }: SupplierStatsProps) {
  const totalSuppliers = suppliers.length;

  // Calculate stats
  const activeSuppliers = suppliers.filter(s => 
    // Assume active if they have contact info
    s.email || s.phone
  ).length;

  const stats = [
    {
      name: "Total Suppliers",
      value: totalSuppliers.toString(),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Active Suppliers",
      value: activeSuppliers.toString(),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "With Contact Info",
      value: activeSuppliers.toString(),
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      name: "Pending Contact",
      value: (totalSuppliers - activeSuppliers).toString(),
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
