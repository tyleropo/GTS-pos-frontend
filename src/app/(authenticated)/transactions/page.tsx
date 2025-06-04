"use client";
import { SiteHeader } from "@/src/components/site-header";
import React, { useState } from "react";
import TransactionStats from "./TransactionStats";
import mockTransactions from "@/src/data/mockTransactions";
import type { Transaction } from "@/src/types/transactions";
import TransactionsTable from "./TransactionsTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

const Page = () => {
  const [transactions, setTransactions] =
    useState<Transaction[]>(mockTransactions);
  return (
    <div>
      <SiteHeader title="Transactions" />
      <div className="p-4">
        <TransactionStats transactions={transactions} />
        <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex justify-between">Transaction List
            </CardTitle>
            <CardDescription>View and Manage all sales transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
          <TransactionsTable transactions={transactions} />
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Page;
