"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCustomerOrder } from "@/src/lib/api/customer-orders";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Calendar,
  Package,
  User,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  Plus,
  ArrowLeft,
  Edit,
} from "lucide-react";
import { PaymentFormModal } from "@/src/app/(authenticated)/payments/PaymentFormModal";
import { CustomerOrderFormModal } from "@/src/app/(authenticated)/customer-orders/CustomerOrderFormModal";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: customerOrder, isLoading, isError } = useQuery({
    queryKey: ["customer-order", params.id],
    queryFn: () => fetchCustomerOrder(params.id),
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["customer-order", params.id] });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "fulfilled":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
      case "submitted":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "draft":
        return "bg-amber-100 text-amber-700 hover:bg-amber-100";
      case "cancelled":
        return "bg-rose-100 text-rose-700 hover:bg-rose-100";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading purchase order details...</p>
        </div>
      </div>
    );
  }

  if (isError || !customerOrder) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-red-500">Failed to load purchase order details</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">Customer Order Details</h1>
            <Badge variant="outline" className={getStatusColor(customerOrder.status)}>
              {customerOrder.status === "draft"
                ? "Pending"
                : customerOrder.status === "submitted"
                  ? "Processing"
                  : customerOrder.status === "fulfilled"
                    ? "Delivered"
                    : customerOrder.status.charAt(0).toUpperCase() +
                      customerOrder.status.slice(1)}
            </Badge>
          </div>
          <p className="text-muted-foreground">PO Number: {customerOrder.co_number}</p>
        </div>
        {customerOrder.status !== "fulfilled" && (
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Order
          </Button>
        )}
      </div>

      <div className="bg-card rounded-lg border p-6 space-y-6">
        {/* Order Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="h-4 w-4 mr-2" />
              Customer
            </div>
            <p className="font-medium">
              {customerOrder.customer?.company ||
                customerOrder.customer?.name ||
                "Unknown Customer"}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              Delivery Date
            </div>
            <p className="font-medium">
              {customerOrder.expected_at
                ? new Date(customerOrder.expected_at).toLocaleDateString()
                : "Not specified"}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Created Date
            </div>
            <p className="font-medium">
              {customerOrder.created_at
                ? new Date(customerOrder.created_at).toLocaleDateString()
                : "N/A"}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <Package className="h-4 w-4 mr-2" />
              Total Items
            </div>
            <p className="font-medium">{customerOrder.items?.length || 0}</p>
          </div>
          <div className="space-y-1 col-span-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Notes
            </div>
            <p className="font-medium whitespace-pre-wrap">
              {customerOrder.notes || "No notes"}
            </p>
          </div>
        </div>

        <Separator />

        {/* Line Items */}
        <div>
          <h3 className="font-semibold mb-3">Order Items</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty Ordered</TableHead>
                  <TableHead className="text-right">Qty Shipped</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerOrder.items && customerOrder.items.length > 0 ? (
                  customerOrder.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div>{item.product_name || item.product_id}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity_ordered}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity_fulfilled || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{item.unit_cost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₱{item.line_total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      No items
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator />

        {/* Order Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">
              ₱{customerOrder.subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax:</span>
            <span className="font-medium">₱{customerOrder.tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Total:</span>
            <span>₱{customerOrder.total.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        {/* Payment Summary */}
        <div className="space-y-2">
          <h3 className="font-semibold">Payment Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Paid:</span>
            <span className="font-medium text-green-600">
              ₱{(customerOrder.total_paid || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Outstanding Balance:</span>
            <span className="font-medium text-amber-600">
              ₱{(customerOrder.outstanding_balance || customerOrder.total).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Button */}
        <div className="flex justify-end">
          {(customerOrder.outstanding_balance || customerOrder.total) > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaymentModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
            >
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
              Fully Paid
            </Button>
          )}
        </div>

        {/* Payments Section */}
        {customerOrder.payments && customerOrder.payments.length > 0 && (
          <>
            <Separator />
            <Accordion type="single" collapsible defaultValue="payments" className="w-full">
              <AccordionItem value="payments">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Payments ({customerOrder.payments.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {customerOrder.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              ₱{payment.amount.toFixed(2)}
                            </p>
                            {payment.is_deposited ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Deposited
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending Deposit
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {payment.reference_number && (
                              <span className="mr-2">
                                Ref: {payment.reference_number}
                              </span>
                            )}
                            <span className="capitalize">
                              {payment.payment_method.replace(/_/g, " ")}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Received:{" "}
                            {new Date(payment.date_received).toLocaleDateString()}
                            {payment.date_deposited && (
                              <span className="ml-2">
                                • Deposited:{" "}
                                {new Date(
                                  payment.date_deposited
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
      </div>

      {/* Payment Form Modal */}
      <PaymentFormModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        payment={null}
        defaultPurchaseOrderId={String(customerOrder.id)}
        onSuccess={() => {
          handleRefresh();
        }}
      />

      {/* Edit Purchase Order Modal */}
      <CustomerOrderFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        customerOrder={customerOrder}
        onSuccess={() => {
          handleRefresh();
          setIsEditModalOpen(false);
        }}
      />
    </div>
  );
}
