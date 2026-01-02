"use client";

import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    createSupplier,
    updateSupplier,
    type CreateSupplierPayload,
    type Supplier,
} from "@/src/lib/api/suppliers";

const supplierFormSchema = z.object({
    company_name: z.string().min(1, "Company name is required").max(255, "Company name is too long"),
    supplier_code: z.string().optional().or(z.literal("")),
    contact_person: z.string().optional().or(z.literal("")),
    email: z
        .string()
        .email("Invalid email address")
        .optional()
        .or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

interface SupplierFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplier?: Supplier;
    onSuccess?: () => void;
}

export function SupplierFormModal({
    open,
    onOpenChange,
    supplier,
    onSuccess,
}: SupplierFormModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!supplier;

    const form = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierFormSchema),
        defaultValues: {
            company_name: supplier?.company_name || "",
            supplier_code: supplier?.supplier_code || "",
            contact_person: supplier?.contact_person || "",
            email: supplier?.email || "",
            phone: supplier?.phone || "",
            address: supplier?.address || "",
        },
    });

    // Reset form when supplier changes or modal opens
    useEffect(() => {
        if (open) {
            form.reset({
                company_name: supplier?.company_name || "",
                supplier_code: supplier?.supplier_code || "",
                contact_person: supplier?.contact_person || "",
                email: supplier?.email || "",
                phone: supplier?.phone || "",
                address: supplier?.address || "",
            });
        }
    }, [open, supplier, form]);

    const onSubmit = async (values: SupplierFormValues) => {
        try {
            setIsSubmitting(true);

            const payload: CreateSupplierPayload = {
                company_name: values.company_name,
                supplier_code: values.supplier_code || undefined,
                contact_person: values.contact_person || undefined,
                email: values.email || undefined,
                phone: values.phone || undefined,
                address: values.address || undefined,
            };

            if (isEditing) {
                await updateSupplier(String(supplier.id), payload);
                toast.success("Supplier updated successfully");
            } else {
                await createSupplier(payload);
                toast.success("Supplier created successfully");
            }

            form.reset();
            onOpenChange(false);
            onSuccess?.();
        } catch (error: any) {
            console.error("Error saving supplier:", error);
            if (error.response && error.response.status === 422) {
                const errors = error.response.data.errors;
                if (errors.email) {
                    form.setError("email", { message: errors.email[0] });
                }
                if (errors.company_name) {
                    form.setError("company_name", { message: errors.company_name[0] });
                }
                if (!errors.email && !errors.company_name) {
                    toast.error("Validation failed. Please check the form.");
                }
            } else {
                toast.error(
                    isEditing ? "Failed to update supplier" : "Failed to create supplier"
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Supplier" : "Add New Supplier"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update supplier information below."
                            : "Fill in the supplier details below."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="company_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Company Name <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Corporation" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="supplier_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Supplier Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="SUP-001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="contact_person"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Person</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="contact@acme.com"
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
                        </div>

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="123 Business Ave, City, State" 
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
