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
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import {
    createCustomer,
    updateCustomer,
    type CreateCustomerPayload,
    type Customer,
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
        status?: string | null;
        type?: string | null;
    };
    onSuccess?: (customer?: Customer) => void;
    customerTypes?: string[];
    onRefreshTypes?: () => void;
}

export function CustomerFormModal({
    open,
    onOpenChange,
    customer,
    onSuccess,
    customerTypes = [],
    onRefreshTypes,
}: CustomerFormModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!customer;
    
    // Combobox state
    const [typeOpen, setTypeOpen] = useState(false);
    const [typeSearch, setTypeSearch] = useState("");
    
    // Default types plus any fetched types, deduplicated
    const availableTypes = Array.from(new Set(["Regular", "VIP", "Government", ...customerTypes])).sort();

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
    useEffect(() => {
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
        }
    }, [open, customer, form]);

    const onSubmit = async (values: CustomerFormValues) => {
        try {
            setIsSubmitting(true);

            // Prepare payload - convert empty strings to null (or undefined)
            const payload: CreateCustomerPayload = {
                name: values.name,
                email: values.email || undefined,
                phone: values.phone || undefined,
                address: values.address || undefined,
                company: values.company || undefined,
                status: values.status || undefined, // Send undefined if empty to let backend use default
                type: values.type || undefined,     // Send undefined if empty to let backend use default
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
            onRefreshTypes?.();
        } catch (error: any) {
            console.error("Error saving customer:", error);
            if (error.response && error.response.status === 422) {
                const errors = error.response.data.errors;
                if (errors.email) {
                    form.setError("email", { message: errors.email[0] });
                }
                // Handle generic error if no specific field error matches
                if (!errors.email) {
                    toast.error("Validation failed. Please check the form.");
                }
            } else {
                toast.error(
                    isEditing ? "Failed to update customer" : "Failed to create customer"
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
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Type</FormLabel>
                                        <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={typeOpen}
                                                        className={cn(
                                                            "w-full justify-between",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value
                                                            ? field.value
                                                            : "Select type"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Search type..."
                                                        value={typeSearch}
                                                        onValueChange={setTypeSearch}
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            <div className="p-2">
                                                                <p className="text-sm text-muted-foreground mb-2">
                                                                    No type found.
                                                                </p>
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full justify-start h-auto py-1.5 px-2 text-sm"
                                                                    onClick={() => {
                                                                        if (!typeSearch.trim()) return;
                                                                        form.setValue("type", typeSearch);
                                                                        setTypeSearch("");
                                                                        setTypeOpen(false);
                                                                    }}
                                                                >
                                                                    <Plus className="mr-2 h-4 w-4" />
                                                                    Create &quot;{typeSearch}&quot;
                                                                </Button>
                                                            </div>
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {availableTypes.map((type) => (
                                                                <CommandItem
                                                                    value={type}
                                                                    key={type}
                                                                    onSelect={() => {
                                                                        form.setValue("type", type);
                                                                        setTypeOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            field.value === type
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {type}
                                                                </CommandItem>
                                                            ))}
                                                            {/* If current value is not in availableTypes, show it as selected too? */}
                                                            {field.value && !availableTypes.includes(field.value) && (
                                                                <CommandItem
                                                                    value={field.value}
                                                                    onSelect={() => {
                                                                        form.setValue("type", field.value || "");
                                                                        setTypeOpen(false);
                                                                    }}
                                                                >
                                                                    <Check className="mr-2 h-4 w-4 opacity-100" />
                                                                    {field.value}
                                                                </CommandItem>
                                                            )}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
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
