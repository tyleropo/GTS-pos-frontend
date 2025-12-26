"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
    createCustomer,
    updateCustomer,
    type CreateCustomerPayload,
} from "@/src/lib/api/customers";

const customerFormSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    email: z
        .string()
        .email("Invalid email address")
        .optional()
        .or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    company: z.string().optional().or(z.literal("")),
    status: z.string().optional(),
    type: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer?: {
        id: string | number;
        name: string;
        email?: string | null;
        phone?: string | null;
        address?: string | null;
        company?: string | null;
        status?: string;
        type?: string;
    };
    onSuccess?: () => void;
}

export function CustomerFormModal({
    open,
    onOpenChange,
    customer,
    onSuccess,
}: CustomerFormModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!customer;
    const [isCustomType, setIsCustomType] = useState(() => {
        if (!customer?.type) return false;
        return !["Regular", "VIP"].includes(customer.type);
    });

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerFormSchema),
        defaultValues: {
            name: customer?.name || "",
            email: customer?.email || "",
            phone: customer?.phone || "",
            address: customer?.address || "",
            company: customer?.company || "",
            status: customer?.status || "Active",
            type: customer?.type || "Regular",
        },
    });

    // Reset form when customer changes or modal opens
    useState(() => {
        if (open) {
            form.reset({
                name: customer?.name || "",
                email: customer?.email || "",
                phone: customer?.phone || "",
                address: customer?.address || "",
                company: customer?.company || "",
                status: customer?.status || "Active",
                type: customer?.type || "Regular",
            });
            setIsCustomType(
                customer?.type ? !["Regular", "VIP"].includes(customer.type) : false
            );
        }
    });

    const onSubmit = async (values: CustomerFormValues) => {
        try {
            setIsSubmitting(true);

            // Prepare payload - convert empty strings to undefined
            const payload: CreateCustomerPayload = {
                name: values.name,
                email: values.email || undefined,
                phone: values.phone || undefined,
                address: values.address || undefined,
                company: values.company || undefined,
                status: values.status,
                type: values.type,
            };

            if (isEditing) {
                await updateCustomer(String(customer.id), payload);
                toast.success("Customer updated successfully");
            } else {
                await createCustomer(payload);
                toast.success("Customer created successfully");
            }

            form.reset();
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error("Error saving customer:", error);
            toast.error(
                isEditing ? "Failed to update customer" : "Failed to create customer"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Customer" : "Add New Customer"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update customer information below."
                            : "Fill in the customer details below."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Name <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="john@example.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+1 (555) 123-4567" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123 Main St, City, State" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="company"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Company Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Active">Active</SelectItem>
                                                <SelectItem value="Inactive">Inactive</SelectItem>
                                                <SelectItem value="Archived">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Type</FormLabel>
                                            {!isCustomType && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 text-xs"
                                                    onClick={() => {
                                                        setIsCustomType(true);
                                                        field.onChange(""); // Clear value when switching to custom
                                                    }}
                                                >
                                                    <Plus className="mr-1 h-3 w-3" />
                                                    New
                                                </Button>
                                            )}
                                        </div>
                                        <FormControl>
                                            {isCustomType ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        placeholder="Custom Type"
                                                        {...field}
                                                        autoFocus
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 w-9 p-0"
                                                        onClick={() => {
                                                            setIsCustomType(false);
                                                            field.onChange("Regular"); // Default back to Regular
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Regular">Regular</SelectItem>
                                                        <SelectItem value="VIP">VIP</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                {isEditing ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
