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
} from "@/src/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Loader2, PackageCheck, AlertCircle, Package } from "lucide-react";
import { toast } from "sonner";
import {
    receivePurchaseOrder,
    type PurchaseOrder as APIPurchaseOrder,
    type ReceivePurchaseOrderPayload,
} from "@/src/lib/api/purchase-orders";
import { fetchProducts, type Product } from "@/src/lib/api/products";

const receiveItemSchema = z.object({
    product_id: z.string(),
    product_name: z.string().optional(),
    quantity_ordered: z.number(),
    quantity_received: z.coerce.number().min(0, "Quantity must be positive"),
    mark_as_delivered: z.boolean().default(false),
    current_stock: z.number().optional(),
    is_draft: z.boolean().optional(),
});

const receiveFormSchema = z.object({
    items: z.array(receiveItemSchema),
});

type ReceiveFormValues = z.infer<typeof receiveFormSchema>;

interface ReceivePurchaseOrderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purchaseOrder: APIPurchaseOrder | null;
    onSuccess?: () => void;
}

export function FulfillPurchaseOrderModal({
    open,
    onOpenChange,
    purchaseOrder,
    onSuccess,
}: ReceivePurchaseOrderModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [products, setProducts] = useState<Map<string, Product>>(new Map());

    const form = useForm<ReceiveFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(receiveFormSchema) as any,
        defaultValues: {
            items: [],
        },
    });

    const { fields } = useFieldArray({
        control: form.control,
       name: "items",
    });

    // Load stock information and detect draft products
    useEffect(() => {
        const loadStockInfo = async () => {
            if (!open || !purchaseOrder?.items) return;

            setIsLoadingStock(true);
            try {
                const { data: productsList } = await fetchProducts({
                    per_page: 100,
                    include_drafts: true, // Include draft products
                });

                const productsMap = new Map<string, Product>();
                productsList.forEach(p => productsMap.set(String(p.id), p));
                setProducts(productsMap);

                const itemsWithStock = purchaseOrder.items.map(item => {
                    const product = productsMap.get(String(item.product_id));
                    return {
                        product_id: String(item.product_id),
                        product_name: item.product_name,
                        quantity_ordered: item.quantity_ordered,
                        quantity_received: item.quantity_ordered, // Default to full quantity
                        mark_as_delivered: false,
                        current_stock: product?.stock_quantity,
                        is_draft: product?.status === 'draft',
                    };
                });

                form.reset({ items: itemsWithStock });
            } catch (error) {
                console.error("Error loading stock info:", error);
                toast.error("Failed to load product stock information");
            } finally {
                setIsLoadingStock(false);
            }
        };

        loadStockInfo();
    }, [open, purchaseOrder, form]);

    const onSubmit = async (values: ReceiveFormValues) => {
        if (!purchaseOrder) return;

        const itemsToReceive = values.items.filter(i => i.mark_as_delivered);

        if (itemsToReceive.length === 0) {
            toast.error("Please mark at least one item as delivered");
            return;
        }

        // Check for draft products - warn user but allow receiving
        const draftsToReceive = itemsToReceive.filter(item => item.is_draft);
        if (draftsToReceive.length > 0) {
            toast.warning("Note: Some items are draft products. Please review them in the Products page after receiving.");
        }

        try {
            setIsSubmitting(true);

            const payload: ReceivePurchaseOrderPayload = {
                items: itemsToReceive.map(item => ({
                    product_id: item.product_id,
                    quantity_received: item.quantity_received,
                })),
            };

            await receivePurchaseOrder(String(purchaseOrder.id), payload);

            toast.success("Purchase order received successfully");
            form.reset();
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error("Error receiving purchase order:", error);
            toast.error(
                `Failed to receive purchase order: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalMarked = form.watch("items").filter(i => i.mark_as_delivered).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Receive Incoming Stock</DialogTitle>
                    <DialogDescription>
                        Mark items as delivered and adjust quantities if needed.
                        {totalMarked > 0 && ` (${totalMarked} item${totalMarked > 1 ? 's' : ''} marked)`}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {isLoadingStock ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                <span className="text-muted-foreground">Loading stock information...</span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {fields.map((field, index) => {
                                    const item = form.watch(`items.${index}`);
                                    const isDraft = item.is_draft;
                                    const newStock = (item.current_stock || 0) + (item.mark_as_delivered ? item.quantity_received : 0);

                                    return (
                                        <div
                                            key={field.id}
                                            className={`border rounded-lg p-4 space-y-3 ${isDraft ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20' : ''}`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.mark_as_delivered`}
                                                            render={({ field: checkField }) => (
                                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={checkField.value}
                                                                            onCheckedChange={checkField.onChange}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="font-semibold cursor-pointer">
                                                                        {item.product_name || `Product ${item.product_id}`}
                                                                    </FormLabel>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="outline">
                                                            <Package className="h-3 w-3 mr-1" />
                                                            Ordered: {item.quantity_ordered}
                                                        </Badge>
                                                        {item.current_stock !== undefined && (
                                                            <Badge variant="secondary">
                                                                Current Stock: {item.current_stock}
                                                            </Badge>
                                                        )}
                                                        {item.mark_as_delivered && (
                                                            <Badge variant="default" className="bg-green-600">
                                                                New Stock: {newStock}
                                                            </Badge>
                                                        )}
                                                        {isDraft && (
                                                            <Badge variant="secondary" className="bg-orange-500 text-white">
                                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                                Draft Product
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.quantity_received`}
                                                    render={({ field: qtyField }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs text-muted-foreground">
                                                                Receiving
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    max={item.quantity_ordered}
                                                                    className="w-24"
                                                                    disabled={!item.mark_as_delivered}
                                                                    {...qtyField}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {isDraft && (
                                                <div className="text-xs text-orange-700 dark:text-orange-400 flex items-start gap-2">
                                                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                                    <span>
                                                        This product is a draft. After receiving, please review and complete the product details in the Products page.
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || isLoadingStock || totalMarked === 0}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <PackageCheck className="mr-2 h-4 w-4" />
                                Receive Marked Items
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
