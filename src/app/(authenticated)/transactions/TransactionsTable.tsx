import React, { useState } from "react";
import { Transaction } from "@/src/types/transactions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/src/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import {
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Download,
  CreditCard,
  DollarSign,
  Eye,
  Printer,
  FileText,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";

const TransactionsTable = ({
  transactions,
}: {
  transactions: Transaction[];
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter transactions based on search query and filters
  const filteredTransactions = transactions.filter((transaction) => {
    // Search filter
    const matchesSearch =
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.customer.toLowerCase().includes(searchQuery.toLowerCase());

    // Date filter
    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "today" && transaction.date === "2023-04-15") ||
      (dateFilter === "yesterday" && transaction.date === "2023-04-14") ||
      (dateFilter === "this-week" &&
        [
          "2023-04-10",
          "2023-04-11",
          "2023-04-12",
          "2023-04-13",
          "2023-04-14",
          "2023-04-15",
        ].includes(transaction.date));

    // Payment method filter
    const matchesPayment =
      paymentFilter === "all" ||
      transaction.paymentMethod.toLowerCase().replace(" ", "-") ===
        paymentFilter.toLowerCase();

    // Status filter
    const matchesStatus =
      statusFilter === "all" ||
      transaction.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesDate && matchesPayment && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <Tabs defaultValue="all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="low-stock">Completed</TabsTrigger>
            <TabsTrigger value="out-of-stock">Refunded </TabsTrigger>
          </TabsList>
          <div className="flex flex-1 items-center gap-2 max-w-md ml-auto">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by ID or customer..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <p className="text-sm font-medium mb-2">Date</p>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <p className="text-sm font-medium mb-2">Payment Method</p>
                  <Select
                    value={paymentFilter}
                    onValueChange={setPaymentFilter}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit-card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <p className="text-sm font-medium mb-2">Status</p>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon">
              <Calendar className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-bold">
                      {transaction.id}
                    </TableCell>
                    <TableCell>{transaction.date}
                        <p className="">{transaction.time}</p>
                    </TableCell>
                    <TableCell>{transaction.customer}</TableCell>
                    <TableCell className="text-right">{transaction.items}</TableCell>
                   
                    <TableCell className="text-right font-bold">
                      ${transaction.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {transaction.paymentMethod === "Credit Card" ? (
                          <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                        ) : (
                          <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                        )}
                        {transaction.paymentMethod}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.status === "Completed"
                            ? "outline"
                            : "secondary"
                        }
                        className={
                          transaction.status == "Refunded"
                            ? "text-amber-600"
                            : ""
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Printer className="h-4 w-4 mr-2" />
                                Print Receipt
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                Export Invoice
                              </DropdownMenuItem>
                              {transaction.status === "Completed" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-amber-600">Process Refund</DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Tabs>
    </div>
  );
};

export default TransactionsTable;
