"use client";

import { SiteHeader } from "@/src/components/site-header";
import TransactionStats from "./TransactionStats";
import mockTransactions from "@/src/data/mockTransactions";
import TransactionsTable from "./TransactionsTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

function TransactionsPage() {
  return (
    <div className="flex flex-col">
      <SiteHeader
        title="Transactions"
        subtitle="Audit historical sales activity and reconcile tender sources."
      />
      <div className="p-4">
        <TransactionStats transactions={mockTransactions} />
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between text-2xl font-bold">
                Transaction list
              </CardTitle>
              <CardDescription>
                View and manage all sales transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionsTable transactions={mockTransactions} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TransactionsPage;
