"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPayments,
  deletePayment,
  type Payment,
} from "@/src/lib/api/payments";
import type { CustomerOrder } from "@/src/lib/api/customer-orders";
import type { PurchaseOrder } from "@/src/lib/api/purchase-orders";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { format } from "date-fns";
import { Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Search, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/src/components/ui/select";
import { DateRangePicker } from "@/src/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ConsolidatedPaymentDetailsModal } from "./ConsolidatedPaymentDetailsModal";

export default function PaymentsTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedConsolidatedPayment, setSelectedConsolidatedPayment] = useState<Payment | null>(null);
  const [isConsolidatedDetailsOpen, setIsConsolidatedDetailsOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["payments", page],
    queryFn: () => fetchPayments({ page, per_page: 15 }),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete payment");
    },
  });

  if (isLoading) return <div className="p-8 text-center">Loading payments...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error loading payments</div>;

  const payments = data?.data || [];
  const meta = data?.meta;

  // Client-side filtering
  const filteredPayments = payments.filter((payment) => {
    // Define completed statuses
    const completedStatuses = ['deposited', 'cleared', 'verified', 'confirmed', 'settled', 'transferred', 'sent', 'charged', 'received', 'paid'];
    
    // Search filter - include payment ID, ref number, customer/supplier names
    const customerName = payment.type === 'inbound' 
      ? ((payment.payable as CustomerOrder)?.customer?.name || (payment.payable as CustomerOrder)?.customer?.company || "")
      : "";
    const supplierName = payment.type === 'outbound'
      ? ((payment.payable as PurchaseOrder)?.supplier?.company_name || (payment.payable as PurchaseOrder)?.supplier?.contact_person || "")
      : "";
    
    const matchesSearch =
      payment.payment_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(payment.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplierName.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    const matchesType = typeFilter === "all" || payment.type === typeFilter;

    // Status filter (completed vs pending based on status field)
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "completed" && payment.status && completedStatuses.includes(payment.status)) ||
      (statusFilter === "pending" && payment.status && !completedStatuses.includes(payment.status));

    // Payment method filter
    const matchesMethod = methodFilter === "all" || payment.payment_method === methodFilter;

    // Date range filter
    let matchesDate = true;
    if (dateRange?.from) {
      const paymentDate = new Date(payment.date_received);
      if (dateRange.to) {
        matchesDate = isWithinInterval(paymentDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to),
        });
      } else {
        matchesDate = isWithinInterval(paymentDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.from),
        });
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesMethod && matchesDate;
  });

  return (
    <>
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-3 mb-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by ID, ref, customer or supplier..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Date Range Picker */}
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />

        {/* Filter Dropdown */}
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
              <p className="text-sm font-medium mb-2">Type</p>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="inbound">Receivable</SelectItem>
                  <SelectItem value="outbound">Payable</SelectItem>
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
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DropdownMenuSeparator />
            <div className="p-2">
              <p className="text-sm font-medium mb-2">Payment Method</p>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="paymaya">PayMaya</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Ref Number</TableHead>
            <TableHead>Order Link</TableHead>
            <TableHead>Customer / Supplier</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Date Received</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPayments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                No payments found.
              </TableCell>
            </TableRow>
          ) : (
            filteredPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium text-xs text-muted-foreground whitespace-nowrap">
                  {payment.payment_number || String(payment.id).substring(0, 8)}
                </TableCell>
                 <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className={
                      payment.type === 'inbound' 
                        ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" 
                        : "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"
                    }>
                      {payment.type === 'inbound' ? 'Receivable' : 'Payable'}
                    </Badge>
                    {payment.is_consolidated && (
                      <Badge variant="secondary" className="text-xs">
                        Consolidated
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {payment.reference_number || "-"}
                </TableCell>
                <TableCell>
                  {payment.is_consolidated ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedConsolidatedPayment(payment);
                        setIsConsolidatedDetailsOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      View Orders
                    </Button>
                  ) : (
                    <Link
                      href={payment.type === 'inbound' 
                        ? `/customer-orders/${payment.payable_id}` 
                        : `/purchase-orders/${payment.payable_id}`}
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      View {payment.type === 'inbound' ? 'CO' : 'PO'} <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  {payment.type === 'inbound' 
                    ? ((payment.payable as CustomerOrder)?.customer?.name || (payment.payable as CustomerOrder)?.customer?.company || "-")
                    : ((payment.payable as PurchaseOrder)?.supplier?.company_name || (payment.payable as PurchaseOrder)?.supplier?.contact_person || "-")
                  }
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PHP",
                  }).format(payment.amount)}
                </TableCell>
                <TableCell className="capitalize">
                  {payment.payment_method.replace(/_/g, " ")}
                </TableCell>
                <TableCell>
                  {format(new Date(payment.date_received), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {payment.status && (
                      <Badge 
                        variant="outline" 
                        className={
                          payment.status === 'deposited' || payment.status === 'cleared' || 
                          payment.status === 'verified' || payment.status === 'confirmed' || 
                          payment.status === 'settled' || payment.status === 'transferred' || 
                          payment.status === 'sent' || payment.status === 'charged' || 
                          payment.status === 'received' || payment.status === 'paid'
                            ? "w-fit bg-green-600 text-white border-green-700"
                            : "w-fit bg-amber-100 text-amber-700 border-amber-300"
                        }
                      >
                        {payment.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Badge>
                    )}
                    {payment.status_updated_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(payment.status_updated_at), "MMM dd, yyyy")}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the payment record.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => deleteMutation.mutate(payment.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Simple Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex justify-center items-center gap-2 p-4 border-t">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {meta.last_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === meta.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>

      <ConsolidatedPaymentDetailsModal
        open={isConsolidatedDetailsOpen}
        onOpenChange={setIsConsolidatedDetailsOpen}
        payment={selectedConsolidatedPayment}
      />
    </>
  );
}
