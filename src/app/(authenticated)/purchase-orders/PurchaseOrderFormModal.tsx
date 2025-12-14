"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
    createPurchaseOrder,
    updatePurchaseOrder,
    type CreatePurchaseOrderPayload,
} from "@/src/lib/api/purchase-orders";
import { fetchProducts, type Product } from "@/src/lib/api/products";

const purchaseOrderItemSchema = z.object({
    product_id: z.string().min(1, "Product is required"),
    product_name: z.string().optional(),
    quantity_ordered: z.coerce.number().min(1, "Quantity must be at least 1"),
    unit_cost: z.coerce.number().min(0, "Unit cost must be positive"),
});

const purchaseOrderFormSchema = z.object({
    customer_name: z.string().min(1, "Customer name is required"),
    delivery_date: z.string().optional(),
    status: z.enum(["draft", "submitted", "received", "cancelled"]),
    payment_status: z.enum(["pending", "paid"]).optional(),
    items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required"),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

interface PurchaseOrderFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purchaseOrder?: any;
    onSuccess?: () => void;
}

export function PurchaseOrderFormModal({
    open,
    onOpenChange,
    purchaseOrder,
    onSuccess,
}: PurchaseOrderFormModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const isEditing = !!purchaseOrder;

    const form = useForm<PurchaseOrderFormValues>({
        resolver: zodResolver(purchaseOrderFormSchema),
        defaultValues: {
            customer_name: purchaseOrder?.customer || "",
            delivery_date: purchaseOrder?.deliveryDate || "",
            status: "draft",
            payment_status: "pending",
            items: purchaseOrder?.items
                ? [{ product_id: "", product_name: "", quantity_ordered: 1, unit_cost: 0 }]
                : [{ product_id: "", product_name: "", quantity_ordered: 1, unit_cost: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    // Load products
    useEffect(() => {
        const loadProducts = async () => {
            try {
                setLoadingProducts(true);
                const response = await fetchProducts({ per_page: 1000 });
                setProducts(response.data);
            } catch (error) {
                console.error("Error loading products:", error);
                toast.error("Failed to load products");
            } finally {
                setLoadingProducts(false);
            }
        };

        if (open) {
            loadProducts();
        }
    }, [open]);

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            form.reset({
                customer_name: purchaseOrder?.customer || "",
                delivery_date: purchaseOrder?.deliveryDate || "",
                status: "draft",
                payment_status: "pending",
                items: [{ product_id: "", product_name: "", quantity_ordered: 1, unit_cost: 0 }],
            });
        }
    }, [open, purchaseOrder, form]);

    // Calculate totals
    const items = form.watch("items");
    const subtotal = items.reduce(
        (sum, item) => sum + (item.quantity_ordered || 0) * (item.unit_cost || 0),
        0
    );
    const tax = subtotal * 0.12; // 12% tax
    const total = subtotal + tax;

    const onSubmit = async (values: PurchaseOrderFormValues) => {
        try {
            setIsSubmitting(true);

            // Using customer_name as supplier_id (API field) since backend uses supplier_id
            // but in our context it represents the customer
            const payload: CreatePurchaseOrderPayload = {
                supplier_id: values.customer_name, // Maps to customer in our context
                items: values.items.map(item => ({
                    product_id: item.product_id,
                    quantity_ordered: item.quantity_ordered,
                    unit_cost: item.unit_cost,
                })),
                expected_at: values.delivery_date || undefined,
                status: values.status,
                subtotal,
                tax,
                total,
            };

            if (isEditing) {
                await updatePurchaseOrder(String(purchaseOrder.id), payload);
                toast.success("Customer order updated successfully");
            } else {
                await createPurchaseOrder(payload);
                toast.success("Customer order created successfully");
            }

            form.reset();
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error("Error saving purchase order:", error);
            toast.error(
                isEditing
                    ? "Failed to update customer order"
                    : "Failed to create customer order"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update unit cost when product is selected
    const handleProductChange = (index: number, productId: string) => {
        const product = products.find(p => String(p.id) === productId);
        if (product) {
            form.setValue(`items.${index}.product_id`, productId);
            form.setValue(`items.${index}.product_name`, product.name);
            form.setValue(`items.${index}.unit_cost`, product.cost_price);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Customer Order" : "New Customer Order"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update customer order information below."
                            : "Create a new order from your customer."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Customer Name */}
                        <FormField
                            control={form.control}
                            name="customer_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Customer Name <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter customer name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Delivery Date */}
                            <FormField
                                control={form.control}
                                name="delivery_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Delivery Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Status */}
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Order Status</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="draft">Pending</SelectItem>
                                                <SelectItem value="submitted">Processing</SelectItem>
                                                <SelectItem value="received">Delivered</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Payment Status */}
                            <FormField
                                control={form.control}
                                name="payment_status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Status</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select payment status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="paid">Paid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Line Items */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <FormLabel>
                                    Order Items <span className="text-destructive">*</span>
                                </FormLabel>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        append({
                                            product_id: "",
                                            product_name: "",
                                            quantity_ordered: 1,
                                            unit_cost: 0,
                                        })
                                    }
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Item
                                </Button>
                            </div>

                            {fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="grid grid-cols-12 gap-2 items-start border p-3 rounded-lg"
                                >
                                    {/* Product Selection */}
                                    <div className="col-span-5">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.product_id`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Product</FormLabel>
                                                    <Select
                                                        onValueChange={(value) =>
                                                            handleProductChange(index, value)
                                                        }
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select product" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {loadingProducts ? (
                                                                <SelectItem value="loading" disabled>
                                                                    Loading products...
                                                                </SelectItem>
                                                            ) : (
                                                                products.map((product) => (
                                                                    <SelectItem
                                                                        key={product.id}
                                                                        value={String(product.id)}
                                                                    >
                                                                        {product.name} ({product.sku})
                                                                    </SelectItem>
                                                                ))
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Quantity */}
                                    <div className="col-span-3">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity_ordered`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Quantity</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Unit Cost */}
                                    <div className="col-span-3">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.unit_cost`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Unit Cost</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Remove Button */}
                                    <div className="col-span-1 flex items-end pb-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals Summary */}
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span className="font-medium">₱{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Tax (12%):</span>
                                <span className="font-medium">₱{tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold border-t pt-2">
                                <span>Total:</span>
                                <span>₱{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {isEditing ? "Update" : "Create"} Order
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
