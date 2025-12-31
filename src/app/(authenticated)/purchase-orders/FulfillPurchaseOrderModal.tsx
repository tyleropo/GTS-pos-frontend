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
import { Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import {
    receivePurchaseOrder,
    type PurchaseOrder as APIPurchaseOrder,
    type ReceivePurchaseOrderPayload,
} from "@/src/lib/api/purchase-orders";

const receiveItemSchema = z.object({
    product_id: z.string(),
    product_name: z.string().optional(),
    quantity_ordered: z.number(),
    quantity_received: z.coerce.number().min(0, "Quantity must be positive"),
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

    const form = useForm<ReceiveFormValues>({
        resolver: zodResolver(receiveFormSchema),
        defaultValues: {
            items: [],
        },
    });

    const { fields } = useFieldArray({
        control: form.control,
        name: "items",
    });

    // Initialize form when purchase order changes
    useEffect(() => {
        if (open && purchaseOrder?.items) {
            form.reset({
                items: purchaseOrder.items.map((item) => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity_ordered: item.quantity_ordered,
                    quantity_received: item.quantity_ordered, // Default to full quantity
                })),
            });
        }
    }, [open, purchaseOrder, form]);

    const onSubmit = async (values: ReceiveFormValues) => {
        if (!purchaseOrder) return;

        try {
            setIsSubmitting(true);

            const payload: ReceivePurchaseOrderPayload = {
                items: values.items.map((item) => ({
                    product_id: item.product_id,
                    quantity_received: item.quantity_received,
                })),
            };

            await receivePurchaseOrder(String(purchaseOrder.id), payload);
            toast.success("Supplier order fulfilled successfully");
            form.reset();
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error("Error fulfilling customer order:", error);
            toast.error("Failed to fulfill customer order");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!purchaseOrder) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PackageCheck className="h-5 w-5" />
                        Fulfill Supplier Order
                    </DialogTitle>
                    <DialogDescription>
                        Enter the quantity shipped for each item. PO: {purchaseOrder.po_number}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Receive Items */}
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="grid grid-cols-12 gap-3 items-center border p-3 rounded-lg"
                                >
                                    {/* Product Name */}
                                    <div className="col-span-6">
                                        <p className="text-sm font-medium">
                                            {form.getValues(`items.${index}.product_name`) ||
                                                form.getValues(`items.${index}.product_id`)}
                                        </p>
                                    </div>

                                    {/* Ordered Quantity */}
                                    <div className="col-span-3 text-center">
                                        <p className="text-xs text-muted-foreground mb-1">Ordered</p>
                                        <p className="font-semibold">
                                            {form.getValues(`items.${index}.quantity_ordered`)}
                                        </p>
                                    </div>

                                    {/* Shipped Quantity Input */}
                                    <div className="col-span-3">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity_received`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Shipped</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max={form.getValues(
                                                                `items.${index}.quantity_ordered`
                                                            )}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
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
                                Confirm Shipment
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
