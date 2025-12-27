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
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/src/lib/utils";
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
import { toast } from "sonner";
import {
    createRepair,
    updateRepair,
    type Repair,
} from "@/src/lib/api/repairs";
import { fetchCustomers, type Customer } from "@/src/lib/api/customers";

const repairFormSchema = z.object({
    customer_id: z.string().optional(),
    device: z.string().min(1, "Device type is required"),
    device_model: z.string().optional(),
    serial_number: z.string().optional(),
    issue_description: z.string().min(1, "Issue description is required"),
    cost: z.coerce.number().min(0, "Cost must be positive").optional(),
    technician: z.string().optional(),
    promised_at: z.string().optional(),
    status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
    resolution: z.string().optional(),
});

type RepairFormValues = z.infer<typeof repairFormSchema>;

interface RepairFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    repair?: Repair | null;
    onSuccess?: () => void;
}

const DEVICE_TYPES = [
    "Smartphone",
    "Laptop",
    "Tablet",
    "Smartwatch",
    "Headphones",
    "Desktop",
    "Other",
];

export function RepairFormModal({
    open,
    onOpenChange,
    repair,
    onSuccess,
}: RepairFormModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [customerOpen, setCustomerOpen] = useState(false);
    const isEditing = !!repair;

    const form = useForm<RepairFormValues>({
        resolver: zodResolver(repairFormSchema),
        defaultValues: {
            customer_id: "",
            device: "",
            device_model: "",
            serial_number: "",
            issue_description: "",
            cost: 0,
            technician: "",
            promised_at: "",
            status: "pending",
            resolution: "",
        },
    });

    // Load customers when modal opens
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingData(true);
                const customersRes = await fetchCustomers({ per_page: 1000 });
                setCustomers(customersRes.data);
            } catch (error) {
                console.error("Error loading form data:", error);
                toast.error("Failed to load customers");
            } finally {
                setLoadingData(false);
            }
        };

        if (open) {
            loadData();
        }
    }, [open]);

    // Reset form when modal opens or repair changes
    useEffect(() => {
        if (open) {
            if (repair) {
                form.reset({
                    customer_id: repair.customer_id ? String(repair.customer_id) : "",
                    device: repair.device || "",
                    device_model: repair.device_model || "",
                    serial_number: repair.serial_number || "",
                    issue_description: repair.issue_description || "",
                    cost: repair.cost || 0,
                    technician: repair.technician || "",
                    promised_at: repair.promised_at?.split("T")[0] || "",
                    status: repair.status || "pending",
                    resolution: repair.resolution || "",
                });
            } else {
                form.reset({
                    customer_id: "",
                    device: "",
                    device_model: "",
                    serial_number: "",
                    issue_description: "",
                    cost: 0,
                    technician: "",
                    promised_at: "",
                    status: "pending",
                    resolution: "",
                });
            }
        }
    }, [open, repair, form]);

    const onSubmit = async (values: RepairFormValues) => {
        try {
            setIsSubmitting(true);

            const payload = {
                customer_id: values.customer_id || null,
                device: values.device,
                device_model: values.device_model || null,
                serial_number: values.serial_number || null,
                issue_description: values.issue_description,
                cost: values.cost || 0,
                technician: values.technician || null,
                promised_at: values.promised_at || null,
                ...(isEditing && {
                    status: values.status,
                    resolution: values.resolution || null,
                }),
            };

            if (isEditing && repair) {
                await updateRepair(String(repair.id), payload);
                toast.success("Repair ticket updated successfully");
            } else {
                await createRepair(payload);
                toast.success("Repair ticket created successfully");
            }

            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error("Error saving repair:", error);
            toast.error(
                isEditing
                    ? "Failed to update repair ticket"
                    : "Failed to create repair ticket"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Repair Ticket" : "New Repair Ticket"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update repair ticket information below."
                            : "Create a new repair ticket for a customer device."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Customer Selection */}
                        <FormField
                            control={form.control}
                            name="customer_id"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Customer (Optional)</FormLabel>
                                    <Popover 
                                        open={customerOpen} 
                                        onOpenChange={setCustomerOpen} 
                                        modal={true}
                                    >
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value
                                                        ? customers.find(
                                                            (c) => String(c.id) === field.value
                                                        )?.name || "Walk-in Customer"
                                                        : "Walk-in Customer"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[200]">
                                            <Command>
                                                <CommandInput 
                                                    placeholder="Search customer..." 
                                                    autoFocus 
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>No customer found.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="walk-in"
                                                            onSelect={() => {
                                                                form.setValue("customer_id", "");
                                                                setCustomerOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    !field.value ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            Walk-in Customer
                                                        </CommandItem>
                                                        {customers.map((customer) => (
                                                            <CommandItem
                                                                value={customer.name + " " + (customer.company || "")}
                                                                key={customer.id}
                                                                onSelect={() => {
                                                                    form.setValue("customer_id", String(customer.id));
                                                                    setCustomerOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        String(customer.id) === field.value
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {customer.name}
                                                                {customer.phone && ` (${customer.phone})`}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Device Type */}
                            <FormField
                                control={form.control}
                                name="device"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Device Type <span className="text-destructive">*</span>
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select device type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {DEVICE_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Device Model */}
                            <FormField
                                control={form.control}
                                name="device_model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Device Model</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., iPhone 15 Pro" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Serial Number */}
                        <FormField
                            control={form.control}
                            name="serial_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Serial Number / IMEI</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Device serial number or IMEI" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Issue Description */}
                        <FormField
                            control={form.control}
                            name="issue_description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Issue Description <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe the issue or problem with the device..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Technician */}
                            <FormField
                                control={form.control}
                                name="technician"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assigned Technician</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Technician name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Estimated Cost */}
                            <FormField
                                control={form.control}
                                name="cost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estimated Cost</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Promised Date */}
                            <FormField
                                control={form.control}
                                name="promised_at"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estimated Completion</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Status (only for editing) */}
                            {isEditing && (
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        {/* Resolution (only for editing) */}
                        {isEditing && (
                            <FormField
                                control={form.control}
                                name="resolution"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Resolution Notes</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Notes about what was done to fix the issue..."
                                                className="min-h-[80px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {isEditing ? "Update Ticket" : "Create Ticket"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
