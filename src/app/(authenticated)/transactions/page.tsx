"use client";

import { SiteHeader } from "@/src/components/site-header";
import TransactionStats from "./TransactionStats";
import TransactionsTable from "./TransactionsTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { fetchTransactions } from "@/src/lib/api/transactions";
import { useEffect, useState } from "react";
import type { Transaction } from "@/src/types/transactions";
import { adaptTransaction } from "@/src/lib/adapters";

function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{
    last_page?: number;
    total?: number;
  }>({});

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchTransactions({ page, per_page: 10 });
        const adapted = response.data.map(adaptTransaction);
        setTransactions(adapted);
        if (response.meta) {
          setMeta(response.meta);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load transactions");
        console.error("Error loading transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [page]);

  if (loading) {
    return (
      <div className="flex flex-col">
        <SiteHeader
          title="Transactions"
          subtitle="Audit historical sales activity and reconcile tender sources."
        />
        <div className="p-4">
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <SiteHeader
          title="Transactions"
          subtitle="Audit historical sales activity and reconcile tender sources."
        />
        <div className="p-4">
          <p className="text-destructive">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <SiteHeader
        title="Transactions"
        subtitle="Audit historical sales activity and reconcile tender sources."
      />
      <div className="p-4">
        <TransactionStats transactions={transactions} />
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
              <TransactionsTable 
                transactions={transactions} 
                page={page}
                totalPages={meta.last_page || 1}
                onPageChange={setPage}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TransactionsPage;
