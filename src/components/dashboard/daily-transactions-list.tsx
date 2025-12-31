"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import type { DailyTransaction } from "@/src/lib/api/dashboard";
import { Receipt } from "lucide-react";

interface DailyTransactionsListProps {
  transactions: DailyTransaction[];
}

export function DailyTransactionsList({ transactions }: DailyTransactionsListProps) {
  const totalSales = transactions.reduce((sum, t) => sum + Number(t.total), 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-500" />
            Today's Transactions
          </CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {transactions.length} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-[400px]">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground animate-in fade-in-50">
              <div className="bg-muted/50 p-3 rounded-full mb-3">
                <Receipt className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">Sales made today will appear here</p>
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">
                        {transaction.invoice_number}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {transaction.time}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                       {transaction.customer}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-sm tracking-tight">
                      ₱{Number(transaction.total).toLocaleString()}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] px-2 py-0 h-5 font-normal capitalize ${
                        transaction.status === 'paid' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t bg-muted/50">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm font-medium text-muted-foreground">Total Sales</span>
          <span className="text-lg font-bold">₱{totalSales.toLocaleString()}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
