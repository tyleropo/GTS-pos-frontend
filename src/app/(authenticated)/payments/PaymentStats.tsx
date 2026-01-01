"use client";

import { Payment } from "@/src/lib/api/payments";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { DollarSign, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

interface PaymentStatsProps {
  payments: Payment[];
}

export default function PaymentStats({ payments }: PaymentStatsProps) {
  // Define completed statuses
  const completedStatuses = ['deposited', 'cleared', 'verified', 'confirmed', 'settled', 'transferred', 'sent', 'charged', 'received', 'paid'];
  
  const stats = {
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    completedAmount: payments
      .filter((p) => p.status && completedStatuses.includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payments
      .filter((p) => p.status && !completedStatuses.includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0),
    payablesAmount: payments
      .filter((p) => p.type === 'outbound')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPayments}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(stats.totalAmount)} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.completedAmount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {payments.filter((p) => p.status && completedStatuses.includes(p.status)).length} payments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {formatCurrency(stats.pendingAmount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {payments.filter((p) => p.status && !completedStatuses.includes(p.status)).length} payments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payables</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(stats.payablesAmount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {payments.filter((p) => p.type === 'outbound').length} payments
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
