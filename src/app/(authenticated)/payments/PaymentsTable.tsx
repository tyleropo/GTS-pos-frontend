"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPayments,
  deletePayment,
} from "@/src/lib/api/payments";
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

export default function PaymentsTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

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

  return (
    <div className="relative w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ref Number</TableHead>
            <TableHead>PO Link</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Date Received</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No payments found.
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">
                  {payment.reference_number || "-"}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/purchase-orders/${payment.purchase_order_id}`}
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    View PO <ExternalLink className="h-3 w-3" />
                  </Link>
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
                    {payment.is_deposited ? (
                      <Badge variant="default" className="w-fit bg-green-600">Deposited</Badge>
                    ) : (
                      <Badge variant="outline" className="w-fit">Pending Deposit</Badge>
                    )}
                    {payment.is_deposited && payment.date_deposited && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(payment.date_deposited), "MMM dd, yyyy")}
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
  );
}
