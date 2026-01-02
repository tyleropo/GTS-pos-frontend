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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import { Loader2, Check, ChevronsUpDown, Plus, X, Package } from "lucide-react";
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
import { formatCurrency } from "@/src/lib/format-currency";
import { toast } from "sonner";
import {
    createRepair,
    updateRepair,
    type Repair,
} from "@/src/lib/api/repairs";
import { fetchCustomers, type Customer } from "@/src/lib/api/customers";
import { fetchUsers, type User } from "@/src/lib/api/users";
import { fetchProducts, type Product } from "@/src/lib/api/products";
import { CustomerFormModal } from "..//customers/CustomerFormModal";
import { Badge } from "@/src/components/ui/badge";

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
    const [technicians, setTechnicians] = useState<User[]>([]);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<
        Array<{ product: Product; quantity: number; unit_price: number }>
    >([]);
    const [loadingData, setLoadingData] = useState(false);
    const [customerOpen, setCustomerOpen] = useState(false);
    const [technicianOpen, setTechnicianOpen] = useState(false);
    const [productOpen, setProductOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
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

    // Load customers, technicians, and products
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingData(true);
                const [customersRes, techniciansRes, productsRes] = await Promise.all([
                    fetchCustomers({ per_page: 1000 }),
                    fetchUsers({ per_page: 1000 }),
                    fetchProducts({ per_page: 1000, status: 'active' })
                ]);
                setCustomers(customersRes.data);
                // Filter users who have technician role
                const techUsers = techniciansRes.data.filter(user => 
                    user.roles?.includes("technician")
                );
                setTechnicians(techUsers);
                setAvailableProducts(productsRes.data);
            } catch (error) {
                console.error("Error loading form data:", error);
                toast.error("Failed to load form data");
            } finally {
                setLoadingData(false);
            }
        };

        if (open) {
            loadData();
        }
    }, [open]);

    const refreshCustomers = async () => {
        try {
            const customersRes = await fetchCustomers({ per_page: 1000 });
            setCustomers(customersRes.data);
        } catch (error) {
            console.error("Error refreshing customers:", error);
        }
    };

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
                
                // Initialize selected products
                if (repair.products) {
                    setSelectedProducts(repair.products.map(p => ({
                        product: p,
                        quantity: p.pivot?.quantity || 1,
                        unit_price: p.pivot?.unit_price || p.selling_price
                    })));
                } else {
                    setSelectedProducts([]);
                }
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
                setSelectedProducts([]);
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
                products: selectedProducts.map(sp => ({
                    id: String(sp.product.id),
                    quantity: sp.quantity,
                    unit_price: sp.unit_price
                })),
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
                    ? `Failed to update repair ticket: ${(error as any).response?.data?.message || (error as any).message}`
                    : `Failed to create repair ticket: ${(error as any).response?.data?.message || (error as any).message}`
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const addProduct = (product: Product) => {
        if (selectedProducts.some(p => p.product.id === product.id)) {
            setSelectedProducts(prev => prev.map(p => 
                p.product.id === product.id 
                    ? { ...p, quantity: p.quantity + 1 }
                    : p
            ));
        } else {
            setSelectedProducts(prev => [...prev, {
                product,
                quantity: 1,
                unit_price: product.selling_price
            }]);
        }
        setProductOpen(false);
    };

    const removeProduct = (productId: string | number) => {
        setSelectedProducts(prev => prev.filter(p => p.product.id !== productId));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                                    <Badge variant="outline">Step 1</Badge>
                                    Customer & Device
                                </h3>
                                
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
                                                <PopoverContent className="w-[300px] p-0 z-[200]">
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
                                                                <CommandItem
                                                                    value="__create_new__"
                                                                    onSelect={() => {
                                                                        setCustomerOpen(false);
                                                                        setIsCustomerModalOpen(true);
                                                                    }}
                                                                    className="text-primary border-t"
                                                                >
                                                                    + Create New Customer
                                                                </CommandItem>
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
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                                     <Badge variant="outline">Step 2</Badge>
                                     Service & Parts
                                </h3>
                                
                                <div className="space-y-2">
                                    <FormLabel>Parts Used (Inventory)</FormLabel>
                                    <Popover open={productOpen} onOpenChange={setProductOpen} modal={true}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                                <span>+ Add Part from Inventory</span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[350px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search parts..." />
                                                <CommandList>
                                                    <CommandEmpty>No parts found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {availableProducts.map(product => (
                                                            <CommandItem 
                                                                key={product.id} 
                                                                onSelect={() => addProduct(product)}
                                                                value={product.name}
                                                            >
                                                                <Check className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedProducts.some(p => p.product.id === product.id) 
                                                                        ? "opacity-100" 
                                                                        : "opacity-0"
                                                                )} />
                                                                <div className="flex flex-col">
                                                                    <span>{product.name}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        ₱{product.selling_price} • Stock: {product.stock_quantity}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    
                                    {selectedProducts.length > 0 && (
                                        <div className="border rounded-md p-2 space-y-2 bg-muted/20">
                                            {selectedProducts.map((item, index) => (
                                                <div key={item.product.id} className="flex items-center justify-between gap-2 text-sm">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium truncate">{item.product.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Input 
                                                            type="number" 
                                                            min="1" 
                                                            className="h-8 w-16 px-2 text-center"
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const qty = parseInt(e.target.value) || 1;
                                                                setSelectedProducts(prev => 
                                                                    prev.map((p, i) => i === index ? { ...p, quantity: qty } : p)
                                                                );
                                                            }}
                                                        />
                                                        <span className="w-16 text-right">₱{formatCurrency(item.quantity * item.unit_price)}</span>
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-destructive"
                                                            onClick={() => removeProduct(item.product.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-center pt-2 border-t font-medium">
                                                <span>Total Parts Cost:</span>
                                                <span>₱{formatCurrency(selectedProducts.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0))}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <FormField
                                    control={form.control}
                                    name="technician"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Assigned Technician</FormLabel>
                                            <Popover 
                                                open={technicianOpen} 
                                                onOpenChange={setTechnicianOpen}
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
                                                            disabled={loadingData}
                                                        >
                                                            {field.value || "Unassigned"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0 z-[200]">
                                                    <Command>
                                                        <CommandInput 
                                                            placeholder="Search technician..." 
                                                            autoFocus 
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                        />
                                                        <CommandList>
                                                            <CommandEmpty>No technician found.</CommandEmpty>
                                                            <CommandGroup>
                                                                <CommandItem
                                                                    value="unassigned"
                                                                    onSelect={() => {
                                                                        form.setValue("technician", "");
                                                                        setTechnicianOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            !field.value ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    Unassigned
                                                                </CommandItem>
                                                                {technicians.map((tech) => {
                                                                    const fullName = `${tech.first_name} ${tech.last_name}`;
                                                                    return (
                                                                        <CommandItem
                                                                            value={fullName}
                                                                            key={tech.id}
                                                                            onSelect={() => {
                                                                                form.setValue("technician", fullName);
                                                                                setTechnicianOpen(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    fullName === field.value
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {fullName}
                                                                            {tech.email && ` (${tech.email})`}
                                                                        </CommandItem>
                                                                    );
                                                                })}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="cost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Labor / Service Cost (Excl. Parts)</FormLabel>
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

                                {isEditing && (
                                    <>
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
                                    </>
                                )}
                            </div>
                        </div>

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

            <CustomerFormModal
                open={isCustomerModalOpen}
                onOpenChange={setIsCustomerModalOpen}
                onSuccess={(newCustomer) => {
                    refreshCustomers();
                    if (newCustomer) {
                        form.setValue("customer_id", String(newCustomer.id));
                    }
                }}
            />
        </Dialog>
    );
}
