"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCustomerOrder, convertLineToCash, revertLineToCash } from "@/src/lib/api/customer-orders";
import { formatCurrency } from "@/src/lib/format-currency";
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
  Banknote,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { PaymentFormModal } from "@/src/app/(authenticated)/payments/PaymentFormModal";
import { CustomerOrderFormModal } from "@/src/app/(authenticated)/customer-orders/CustomerOrderFormModal";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";

export default function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConvertingToCash, setIsConvertingToCash] = useState(false);

  const { data: customerOrder, isLoading, isError } = useQuery({
    queryKey: ["customer-order", id],
    queryFn: () => fetchCustomerOrder(id),
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["customer-order", id] });
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

  const handleConvertToCash = async (productId: string) => {
    if (!customerOrder) return;
    
    try {
      setIsConvertingToCash(true);
      await convertLineToCash(String(customerOrder.id), String(productId));
      toast.success("Product line converted to cash successfully");
      handleRefresh();
    } catch (error) {
      console.error("Error converting to cash:", error);
      toast.error("Failed to convert to cash");
    } finally {
      setIsConvertingToCash(false);
    }
  };

  const handleRevertToCash = async (productId: string) => {
    if (!customerOrder) return;
    
    try {
      setIsConvertingToCash(true);
      await revertLineToCash(String(customerOrder.id), String(productId));
      toast.success("Product line reverted successfully");
      handleRefresh();
    } catch (error) {
      console.error("Error reverting:", error);
      toast.error("Failed to revert");
    } finally {
      setIsConvertingToCash(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading purchases details...</p>
        </div>
      </div>
    );
  }

  if (isError || !customerOrder) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-red-500">Failed to load purchases details</p>
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerOrder.items && customerOrder.items.length > 0 ? (
                  customerOrder.items.map((item, index) => (
                    <TableRow key={index} className={item.is_voided ? "bg-muted/50" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className={item.is_voided ? "line-through text-muted-foreground" : ""}>
                            <div>{item.product_name || item.product_id}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {item.description}
                              </div>
                            )}
                          </div>
                          {item.is_voided && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Voided
                            </Badge>
                          )}
                        </div>
                        {item.void_reason && (
                          <div className="text-xs text-muted-foreground mt-1">Reason: {item.void_reason}</div>
                        )}
                      </TableCell>
                      <TableCell className={`text-right ${item.is_voided ? 'line-through text-muted-foreground' : ''}`}>
                        {item.quantity_ordered}
                      </TableCell>
                      <TableCell className={`text-right ${item.is_voided ? 'line-through text-muted-foreground' : ''}`}>
                        {item.quantity_fulfilled || 0}
                      </TableCell>
                      <TableCell className={`text-right ${item.is_voided ? 'line-through text-muted-foreground' : ''}`}>
                        ₱{formatCurrency(item.unit_cost)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${item.is_voided ? 'line-through text-muted-foreground' : ''}`}>
                        ₱{formatCurrency(item.line_total)}
                      </TableCell>
                      <TableCell className="text-right">
                        {!item.is_voided && customerOrder.status !== "fulfilled" && customerOrder.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConvertToCash(String(item.product_id))}
                            disabled={isConvertingToCash}
                          >
                            <Banknote className="h-4 w-4 mr-1" />
                            Convert
                          </Button>
                        )}
                        {item.is_voided && customerOrder.status !== "fulfilled" && customerOrder.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevertToCash(String(item.product_id))}
                            disabled={isConvertingToCash}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Revert
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
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
              ₱{formatCurrency(customerOrder.subtotal)}
            </span>
          </div>
          {customerOrder.adjustments && customerOrder.adjustments.length > 0 && (
            <div className="ml-4 space-y-1">
              {customerOrder.adjustments.map((adj) => (
                <div key={adj.id} className="flex justify-between text-sm text-orange-600">
                  <span className="flex items-center gap-1">
                    <Banknote className="h-3 w-3" />
                    {adj.description || adj.type}
                  </span>
                  <span>₱{formatCurrency(adj.amount)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax:</span>
            <span className="font-medium">₱{formatCurrency(customerOrder.tax)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Total:</span>
            <span>₱{formatCurrency(customerOrder.total)}</span>
          </div>
        </div>

        <Separator />

        {/* Payment Summary */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payment Status
          </h3>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Total:</span>
              <span className="font-medium">
                ₱{formatCurrency(customerOrder.total)}
              </span>
            </div>
            
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center gap-1">
                <span className="text-xs border rounded px-1 border-green-200 bg-green-50">-</span> Less: Total Paid
              </span>
              <span>
                (₱{formatCurrency(customerOrder.total_paid || 0)})
              </span>
            </div>

            <Separator className="my-2" />
            
            <div className="flex justify-between text-base font-bold">
              <span>Outstanding Balance:</span>
              <span className={cn(
                (customerOrder.outstanding_balance || 0) > 0 ? "text-amber-600" : "text-green-600"
              )}>
                ₱{formatCurrency(customerOrder.outstanding_balance || 0)}
              </span>
            </div>
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
                              ₱{formatCurrency(payment.amount)}
                            </p>
                            {payment.status && (
                              <Badge 
                                variant="outline" 
                                className={
                                  ['deposited', 'cleared', 'verified', 'confirmed', 'settled', 'transferred', 'sent', 'charged', 'received', 'paid'].includes(payment.status)
                                    ? "bg-green-600 text-white border-green-700"
                                    : "bg-amber-100 text-amber-700 border-amber-300"
                                }
                              >
                                {payment.status === 'deposited' || payment.status === 'cleared' || payment.status === 'verified' || payment.status === 'confirmed' || payment.status === 'settled' || payment.status === 'transferred' || payment.status === 'sent' || payment.status === 'charged' || payment.status === 'received' || payment.status === 'paid' ? (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                ) : (
                                  <Clock className="h-3 w-3 mr-1" />
                                )}
                                {payment.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
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
        defaultPayableId={String(customerOrder.id)}
        defaultPayableType="customer_order"
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
