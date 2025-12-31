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
    fulfillCustomerOrder,
    type CustomerOrder as APICustomerOrder,
    type FulfillCustomerOrderPayload,
} from "@/src/lib/api/customer-orders";

const fulfillItemSchema = z.object({
    product_id: z.string(),
    product_name: z.string().optional(),
    quantity_ordered: z.number(),
    quantity_fulfilled: z.coerce.number().min(0, "Quantity must be positive"),
});

const fulfillFormSchema = z.object({
    items: z.array(fulfillItemSchema),
});

type FulfillFormValues = z.infer<typeof fulfillFormSchema>;

interface FulfillCustomerOrderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customerOrder: APICustomerOrder | null;
    onSuccess?: () => void;
}

export function FulfillCustomerOrderModal({
    open,
    onOpenChange,
    customerOrder,
    onSuccess,
}: FulfillCustomerOrderModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FulfillFormValues>({
        resolver: zodResolver(fulfillFormSchema),
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
        if (open && customerOrder?.items) {
            form.reset({
                items: customerOrder.items.map((item) => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity_ordered: item.quantity_ordered,
                    quantity_fulfilled: item.quantity_ordered, // Default to full quantity
                })),
            });
        }
    }, [open, customerOrder, form]);

    const onSubmit = async (values: FulfillFormValues) => {
        if (!customerOrder) return;

        try {
            setIsSubmitting(true);

            const payload: FulfillCustomerOrderPayload = {
                items: values.items.map((item) => ({
                    product_id: item.product_id,
                    quantity_fulfilled: item.quantity_fulfilled,
                })),
            };

            await fulfillCustomerOrder(String(customerOrder.id), payload);
            toast.success("Customer order fulfilled successfully");
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

    if (!customerOrder) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PackageCheck className="h-5 w-5" />
                        Fulfill Customer Order
                    </DialogTitle>
                    <DialogDescription>
                        Enter the quantity shipped for each item. CO: {customerOrder.co_number}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Fulfill Items */}
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
                                            name={`items.${index}.quantity_fulfilled`}
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
