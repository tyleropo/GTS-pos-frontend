"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/src/components/ui/dialog";
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
    TableRow 
} from "@/src/components/ui/table";
import { Calendar, Package, User, FileText, Download, DollarSign, CheckCircle2, Clock, Plus } from "lucide-react";
import { PurchaseOrder as APIPurchaseOrder } from "@/src/lib/api/purchase-orders";
import { PaymentFormModal } from "@/src/app/(authenticated)/payments/PaymentFormModal";
import { useState } from "react";

interface ViewPurchaseOrderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purchaseOrder: APIPurchaseOrder | null;
    onEdit?: () => void;
    onDownloadPDF?: () => void;
    onRefresh?: () => void; // Add refresh callback
}

export function ViewPurchaseOrderModal({
    open,
    onOpenChange,
    purchaseOrder,
    onEdit,
    onDownloadPDF,
    onRefresh,
}: ViewPurchaseOrderModalProps) {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
    if (!purchaseOrder) return null;

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "received":
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Supplier Order Details</span>
                        <Badge variant="outline" className={getStatusColor(purchaseOrder.status)}>
                            {purchaseOrder.status === "draft" ? "Pending" :
                             purchaseOrder.status === "submitted" ? "Processing" :
                             purchaseOrder.status === "received" ? "Delivered" :
                             purchaseOrder.status.charAt(0).toUpperCase() +
                                purchaseOrder.status.slice(1)}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        PO Number: {purchaseOrder.po_number}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Order Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <User className="h-4 w-4 mr-2" />
                                Supplier
                            </div>
                            <p className="font-medium">
                                {purchaseOrder.supplier?.company_name ||
                                    purchaseOrder.supplier?.contact_person ||
                                    "Unknown Supplier"}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-2" />
                                Delivery Date
                            </div>
                            <p className="font-medium">
                                {purchaseOrder.expected_at
                                    ? new Date(purchaseOrder.expected_at).toLocaleDateString()
                                    : "Not specified"}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <FileText className="h-4 w-4 mr-2" />
                                Created Date
                            </div>
                            <p className="font-medium">
                                {purchaseOrder.created_at
                                    ? new Date(purchaseOrder.created_at).toLocaleDateString()
                                    : "N/A"}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Package className="h-4 w-4 mr-2" />
                                Total Items
                            </div>
                            <p className="font-medium">{purchaseOrder.items?.length || 0}</p>
                        </div>
                        <div className="space-y-1 col-span-2">
                             <div className="flex items-center text-sm text-muted-foreground">
                                <FileText className="h-4 w-4 mr-2" />
                                Notes
                            </div>
                            <p className="font-medium whitespace-pre-wrap">
                                {purchaseOrder.notes || "No notes"}
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
                                    {purchaseOrder.items && purchaseOrder.items.length > 0 ? (
                                        purchaseOrder.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">
                                                    <div>{item.product_name || item.product_id}</div>
                                                    {item.description && (
                                                        <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.quantity_ordered}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.quantity_received || 0}
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
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
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
                            <span className="font-medium">₱{purchaseOrder.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tax:</span>
                            <span className="font-medium">₱{purchaseOrder.tax.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-base font-bold">
                            <span>Total:</span>
                            <span>₱{purchaseOrder.total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Add Payment Button - Always Visible */}
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsPaymentModalOpen(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Payment
                        </Button>
                    </div>

                    {/* Payments Section */}
                    {purchaseOrder.payments && purchaseOrder.payments.length > 0 && (
                        <>
                            <Separator />
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="payments">
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            <span>Payments ({purchaseOrder.payments.length})</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3">
                                            {purchaseOrder.payments.map((payment) => (
                                                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium">₱{payment.amount.toFixed(2)}</p>
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
                                                                <span className="mr-2">Ref: {payment.reference_number}</span>
                                                            )}
                                                            <span className="capitalize">{payment.payment_method.replace(/_/g, ' ')}</span>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Received: {new Date(payment.date_received).toLocaleDateString()}
                                                            {payment.date_deposited && (
                                                                <span className="ml-2">• Deposited: {new Date(payment.date_deposited).toLocaleDateString()}</span>
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

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                        {onDownloadPDF && (
                            <Button variant="outline" onClick={onDownloadPDF}>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                            </Button>
                        )}
                        {onEdit && purchaseOrder.status !== "received" && (
                            <Button onClick={onEdit}>
                                Edit Order
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
            
            {/* Payment Form Modal */}
            <PaymentFormModal
                open={isPaymentModalOpen}
                onOpenChange={setIsPaymentModalOpen}
                defaultPurchaseOrderId={String(purchaseOrder.id)}
                onSuccess={() => {
                    // Refresh the PO data to show new payment
                    onRefresh?.();
                }}
            />
        </Dialog>
    );
}
