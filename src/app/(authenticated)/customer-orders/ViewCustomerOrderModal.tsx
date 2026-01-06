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
import { Calendar, Package, User, FileText, Download, PhilippinePesoIcon, CheckCircle2, Clock, Plus, Banknote, AlertTriangle, RotateCcw } from "lucide-react";
import { CustomerOrder as APICustomerOrder, convertLineToCash, revertLineToCash } from "@/src/lib/api/customer-orders";
import { PaymentFormModal } from "@/src/app/(authenticated)/payments/PaymentFormModal";
import { useState } from "react";
import { toast } from "sonner";

interface ViewCustomerOrderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customerOrder: APICustomerOrder | null;
    onEdit?: () => void;
    onDownloadPDF?: () => void;
    onRefresh?: () => void; // Add refresh callback
}

export function ViewCustomerOrderModal({
    open,
    onOpenChange,
    customerOrder,
    onEdit,
    onDownloadPDF,
    onRefresh,
}: ViewCustomerOrderModalProps) {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isConvertingToCash, setIsConvertingToCash] = useState(false);
    
    if (!customerOrder) return null;

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
            onRefresh?.();
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
            onRefresh?.();
        } catch (error) {
            console.error("Error reverting:", error);
            toast.error("Failed to revert");
        } finally {
            setIsConvertingToCash(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Customer Order Details</span>
                        <Badge variant="outline" className={getStatusColor(customerOrder.status)}>
                            {customerOrder.status === "draft" ? "Pending" :
                             customerOrder.status === "submitted" ? "Processing" :
                             customerOrder.status === "fulfilled" ? "Delivered" :
                             customerOrder.status.charAt(0).toUpperCase() +
                                customerOrder.status.slice(1)}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        PO Number: {customerOrder.co_number}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
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
                                                                <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
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
                                                    ₱{item.unit_cost.toFixed(2)}
                                                </TableCell>
                                                <TableCell className={`text-right font-medium ${item.is_voided ? 'line-through text-muted-foreground' : ''}`}>
                                                    ₱{item.line_total.toFixed(2)}
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
                                            <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                            <span className="font-medium">₱{customerOrder.subtotal.toFixed(2)}</span>
                        </div>
                        {customerOrder.adjustments && customerOrder.adjustments.length > 0 && (
                            <div className="ml-4 space-y-1">
                                {customerOrder.adjustments.map((adj) => (
                                    <div key={adj.id} className="flex justify-between text-sm text-orange-600">
                                        <span className="flex items-center gap-1">
                                            <Banknote className="h-3 w-3" />
                                            {adj.description || adj.type}
                                        </span>
                                        <span>₱{adj.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
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
                    {customerOrder.payments && customerOrder.payments.length > 0 && (
                        <>
                            <Separator />
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="payments">
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-2">
                                            <PhilippinePesoIcon className="h-4 w-4" />
                                            <span>Payments ({customerOrder.payments.length})</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3">
                                            {customerOrder.payments.map((payment) => (
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
                        {onEdit && customerOrder.status !== "fulfilled" && (
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
                defaultCustomerOrderId={String(customerOrder.id)}
                onSuccess={() => {
                    // Refresh the PO data to show new payment
                    onRefresh?.();
                }}
            />
        </Dialog>
    );
}
