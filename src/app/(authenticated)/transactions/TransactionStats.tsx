import React from "react";
import { Transaction } from "@/src/types/transactions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

const TransactionStats = ({ transactions }: { transactions: Transaction[] }) => {
  const totalTransactions = transactions.length;
  const totalSales = transactions.reduce(
    (sum, transactions) => sum + transactions.total,
    0
  );
  const cashPayments = transactions.filter(
    (cashPay) => cashPay.paymentMethod === "Cash"
  ).length;
  const cardPayments = transactions.filter(
    (cardPay) => cardPay.paymentMethod === "Credit Card"
  ).length;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalTransactions}</div>
          <p className="text-xs text-muted-foreground">
          In the last 7 days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${totalSales.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">In the last 7 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{cashPayments}</div>
          <p className="text-xs text-muted-foreground">
           {((cashPayments / totalTransactions) * 100).toFixed(1)}% of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium">Card Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{cardPayments}</div>
          <p className="text-xs text-muted-foreground"> {((cardPayments / totalTransactions) * 100).toFixed(1)}% of total</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionStats;
