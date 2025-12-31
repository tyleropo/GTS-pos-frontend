import { useState, useEffect, useMemo } from "react";
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
    DialogTrigger,
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
}
from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this component, or use Input if not
import { Button } from "@/src/components/ui/button";
import { Loader2, Plus, Trash2, Check, ChevronsUpDown, Pencil, Percent, Coins } from "lucide-react";
import { Switch } from "@/src/components/ui/switch";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/src/components/ui/accordion";
import { cn } from "@/src/lib/utils";
import {
    Command,
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
import { PaymentFormModal } from "@/src/app/(authenticated)/payments/PaymentFormModal";
import { toast } from "sonner";
import {
    createPurchaseOrder,
    updatePurchaseOrder,
    type CreatePurchaseOrderPayload,
    type PurchaseOrder,
} from "@/src/lib/api/purchase-orders";
import { fetchProducts, type Product } from "@/src/lib/api/products";
import { fetchCustomers, type Customer } from "@/src/lib/api/customers";
import { useDebounce } from "@/src/hooks/use-debounce";

const purchaseOrderItemSchema = z.object({
    product_id: z.union([z.string(), z.number()]).refine((val) => val !== "", {
        message: "Product is required",
    }),
    product_name: z.string().optional(),
    quantity_ordered: z.coerce.number().min(1, "Quantity must be at least 1"),
    unit_cost: z.coerce.number().min(0, "Unit cost must be positive"),
    description: z.string().nullable().optional(),
});

const purchaseOrderFormSchema = z.object({
    supplier_id: z.string().min(1, "Supplier is required"),
    delivery_date: z.string().optional(),
    status: z.enum(["draft", "submitted", "received", "cancelled"]),
    items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required"),
    notes: z.string().optional(),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

interface PurchaseOrderFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purchaseOrder?: PurchaseOrder;
    onSuccess?: () => void;
}

export function PurchaseOrderFormModal({
    open,
    onOpenChange,
    purchaseOrder,
    onSuccess,
}: PurchaseOrderFormModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerOpen, setCustomerOpen] = useState(false);
    const [productOpenStates, setProductOpenStates] = useState<Record<number, boolean>>({});
    
    // Search states
    const [customerQuery, setCustomerQuery] = useState("");
    const debouncedCustomerQuery = useDebounce(customerQuery, 300);
    const [productQuery, setProductQuery] = useState("");
    const debouncedProductQuery = useDebounce(productQuery, 300);

    // Tax & Discount States
    const [taxRate, setTaxRate] = useState<number>(12);
    const [taxType, setTaxType] = useState<"inclusive" | "exclusive">("inclusive"); // inclusive = VAT included in price, exclusive = Markup
    const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
    const [discountValue, setDiscountValue] = useState<string>("");
    
    const isEditing = !!purchaseOrder;

    const form = useForm<PurchaseOrderFormValues>({
        resolver: zodResolver(purchaseOrderFormSchema),
        defaultValues: {
            supplier_id: purchaseOrder?.supplier_id || "",
            delivery_date: purchaseOrder?.expected_at || "",
            status: (purchaseOrder?.status as "draft" | "submitted" | "received" | "cancelled") || "draft",
            notes: purchaseOrder?.notes || "",
            items: purchaseOrder?.items
                ? purchaseOrder.items.map(item => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity_ordered: item.quantity_ordered,
                    unit_cost: item.unit_cost,
                    description: item.description || "",
                }))
                : [{ product_id: "", product_name: "", quantity_ordered: 1, unit_cost: 0, description: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    // Load customers on search
    useEffect(() => {
        const loadCustomers = async () => {
            if (debouncedCustomerQuery.length < 2 && !purchaseOrder) {
                 setCustomers([]);
                 return;
            }

            try {
                const customersRes = await fetchCustomers({ 
                    search: debouncedCustomerQuery,
                    per_page: 50 
                });
                setCustomers(customersRes.data);
            } catch (error) {
                console.error("Error loading customers:", error);
            } 
        };
        loadCustomers();
    }, [debouncedCustomerQuery, purchaseOrder]);

    // Load products on search
    useEffect(() => {
        const loadProducts = async () => {
             if (debouncedProductQuery.length < 2 && !purchaseOrder) {
                 setProducts([]);
                 return;
            }

            try {
                const productsRes = await fetchProducts({ 
                    search: debouncedProductQuery,
                    per_page: 50 
                });
                setProducts(productsRes.data);
            } catch (error) {
                console.error("Error loading products:", error);
            }
        };
        loadProducts();
    }, [debouncedProductQuery, purchaseOrder]);
    
    // Initial load for editing
     useEffect(() => {
        const loadInitialData = async () => {
            if (purchaseOrder) {
                try {
                     // Load the specific supplier
                     // Assuming we have an ID, we might need to search by it or load all if API doesn't support getById in search endpoint easily
                     // For now, load default set or search by name if available, but ID is safest. 
                     // Since we don't have getById exposed here easily, let's load a small batch or if we have the supplier name in the order object use that.
                     // A better approach if the API supports it: fetchCustomers({ ids: [purchaseOrder.supplier_id] })
                     // Creating a workaround: fetch customers without filter to get initial list, or if we have the name, search it.
                     // Just loading initial batch for now so the form isn't empty-looking.
                     
                    const [productsRes, customersRes] = await Promise.all([
                        fetchProducts({ per_page: 50 }),
                        fetchCustomers({ per_page: 50 })
                    ]);
                    setProducts(productsRes.data);
                    setCustomers(customersRes.data);
                } catch(e) {
                    console.error(e);
                }
            }
        };
        if (open && purchaseOrder) {
             loadInitialData();
        }
    }, [open, purchaseOrder]);

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            form.reset({
                supplier_id: purchaseOrder?.supplier_id || "",
                delivery_date: purchaseOrder?.expected_at || "",
                status: (purchaseOrder?.status as any) || "draft",
                notes: purchaseOrder?.notes || "",
                items: purchaseOrder?.items
                ? purchaseOrder.items.map(item => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity_ordered: item.quantity_ordered,
                    unit_cost: item.unit_cost,
                    description: item.description || "",
                }))
                : [{ product_id: "", product_name: "", quantity_ordered: 1, unit_cost: 0, description: "" }],
            });

            // Initialize Tax & Discount from saved meta or defaults
            if (purchaseOrder && purchaseOrder.meta) {
                 const meta = purchaseOrder.meta as any;
                 if (meta.taxRate !== undefined) setTaxRate(Number(meta.taxRate));
                 if (meta.taxType) setTaxType(meta.taxType);
                 if (meta.discountType) setDiscountType(meta.discountType);
                 if (meta.discountValue) setDiscountValue(String(meta.discountValue));
            } else {
                // Reset to defaults if new
                setTaxRate(12);
                setTaxType("inclusive");
                setDiscountType("percentage");
                setDiscountValue("");
            }
        }
    }, [open, purchaseOrder, form]);

    // Auto-set tax logic based on customer type
    useEffect(() => {
        const supplierId = form.getValues("supplier_id");
        if (!supplierId || isEditing && purchaseOrder) return; // Don't override if editing existing order unless explicitly changed? 
        // Logic: If user changes customer, we might want to update defaults. 
        // But let's only do it if it's a new order or explicit change. Use a ref or simple check?
        // For now, let's reactive to supplier_id change only if not editing potentially.
        // Actually, if I change customer in Edit mode, I probably want new defaults too.

        const customer = customers.find(c => String(c.id) === supplierId);
        if (customer) {
            if (customer.type === "Government") {
                setTaxRate(30);
                setTaxType("exclusive");
            } else {
                setTaxRate(12);
                setTaxType("inclusive");
            }
        }
    }, [form.watch("supplier_id"), customers, isEditing, purchaseOrder]);

    // Calculations
    const items = form.watch("items");
    
    const rawSubtotal = items.reduce(
        (sum, item) => sum + (item.quantity_ordered || 0) * (item.unit_cost || 0),
        0
    );

    // Discount Calculation
    const discountAmount = useMemo(() => {
        const value = parseFloat(discountValue);
        if (isNaN(value) || value < 0) return 0;
   
        if (discountType === "percentage") {
           return rawSubtotal * (Math.min(value, 100) / 100);
        } else {
           return Math.min(value, rawSubtotal);
        }
     }, [discountType, discountValue, rawSubtotal]);
    
    const discountedSubtotal = Math.max(0, rawSubtotal - discountAmount);

    // Tax Calculation
    const taxRateDecimal = taxRate / 100;
    let tax = 0;
    let total = 0;
    let subtotalDisplay = 0; // The base amount to show

    if (taxType === "inclusive") {
        // POS Style: Price includes Tax. 
        // Total = Discounted Subtotal
        // Net = Total / (1 + Rate)
        // Tax = Total - Net
        total = discountedSubtotal;
        const netOfTax = total / (1 + taxRateDecimal);
        tax = total - netOfTax;
        subtotalDisplay = total; // In inclusive, subtotal usually means the full amount before tax separation
    } else {
        // Exclusive/Markup: Tax is added on top
        // Total = Discounted Subtotal * (1 + Rate)
        // Tax = Total - Discounted Subtotal
        subtotalDisplay = discountedSubtotal;
        total = discountedSubtotal * (1 + taxRateDecimal);
        tax = total - discountedSubtotal;
    }

    const onSubmit = async (values: PurchaseOrderFormValues) => {
        try {
            setIsSubmitting(true);

            const payload: CreatePurchaseOrderPayload = {
                supplier_id: values.supplier_id,
                items: values.items.map(item => ({
                    product_id: item.product_id,
                    quantity_ordered: item.quantity_ordered,
                    unit_cost: item.unit_cost,
                    line_total: (item.quantity_ordered || 0) * (item.unit_cost || 0),
                    tax: 0, // Assuming 0 for now as tax is calculated globally or handled by backend if per-item is needed
                    description: item.description,
                })),
                expected_at: values.delivery_date || undefined,
                status: values.status,
                subtotal: subtotalDisplay, 
                tax,
                total,
                notes: values.notes || undefined,
                meta: {
                    taxRate,
                    taxType,
                    discountType: discountAmount > 0 ? discountType : undefined,
                    discountValue: discountAmount > 0 ? Number(discountValue) : undefined,
                    discountAmount
                }
            };

            if (isEditing && purchaseOrder) {
                await updatePurchaseOrder(String(purchaseOrder.id), payload);
                toast.success("Purchase order updated successfully");
            } else {
                await createPurchaseOrder(payload);
                toast.success("Purchase order created successfully");
            }

            form.reset();
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error("Error saving purchase order:", error);
            toast.error(
                isEditing
                    ? "Failed to update purchase order"
                    : "Failed to create purchase order"
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
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Purchase Order" : "New Purchase Order"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update purchase order information below."
                            : "Create a new purchase order for your customer."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Supplier Selection */}
                        <FormField
                            control={form.control}
                            name="supplier_id"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>
                                        Customer <span className="text-destructive">*</span>
                                    </FormLabel>
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
                                                            (customer) => String(customer.id) === field.value
                                                        )?.company || customers.find(
                                                            (customer) => String(customer.id) === field.value
                                                        )?.name || "Selected Customer" // Fallback if not in loaded list
                                                        : "Select customer"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[200]">
                                            <Command shouldFilter={false}>
                                                <CommandInput 
                                                    placeholder="Search customer (min 2 chars)..." 
                                                    autoFocus 
                                                    value={customerQuery}
                                                    onValueChange={setCustomerQuery}
                                                />
                                                <CommandList>
                                                    {customers.length === 0 && (
                                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                                            {debouncedCustomerQuery.length < 2 
                                                                ? "Type at least 2 characters..." 
                                                                : "No customer found."}
                                                        </div>
                                                    )}
                                                    <CommandGroup>
                                                        {customers.map((customer) => (
                                                            <CommandItem
                                                                value={customer.name + " " + (customer.company || "")}
                                                                key={customer.id}
                                                                onSelect={() => {
                                                                    form.setValue("supplier_id", String(customer.id));
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
                                                                {customer.company ? `${customer.company} (${customer.name})` : customer.name}
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

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Additional notes..." {...field} />
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

                            {/* Add Payment Button */}
                            {isEditing && (
                                <FormItem>
                                    <FormLabel>Payment</FormLabel>
                                    {purchaseOrder?.payments && purchaseOrder.payments.length > 0 ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => setIsPaymentModalOpen(true)}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit Payment
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => setIsPaymentModalOpen(true)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Payment
                                        </Button>
                                    )}
                                </FormItem>
                            )}
                        </div>

                        {/* Tax & Discount Configuration */}
                        <div className="rounded-lg border p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-base font-semibold">Tax Settings</FormLabel>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={taxType === "inclusive"}
                                        onCheckedChange={(checked) => setTaxType(checked ? "inclusive" : "exclusive")}
                                        id="tax-mode"
                                    />
                                    <FormLabel htmlFor="tax-mode" className="cursor-pointer">
                                        {taxType === "inclusive" ? "Tax Inclusive (VAT)" : "Tax Exclusive (Markup)"}
                                    </FormLabel>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormItem>
                                    <FormLabel>Tax Rate (%)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={taxRate}
                                                onChange={(e) => setTaxRate(Number(e.target.value))}
                                                className="pl-8"
                                            />
                                            <Percent className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                                        </div>
                                    </FormControl>
                                </FormItem>
                            </div>
                            
                             <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="discount" className="border-b-0">
                                    <AccordionTrigger className="py-2 hover:no-underline text-sm font-medium">
                                        Discount Options
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="flex gap-4 items-end pt-2">
                                             <div className="w-1/3">
                                                <FormLabel className="text-xs">Type</FormLabel>
                                                <Select
                                                    value={discountType}
                                                    onValueChange={(val: any) => setDiscountType(val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                        <SelectItem value="amount">Fixed Amount (₱)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                             </div>
                                             <div className="flex-1">
                                                 <FormLabel className="text-xs">Value</FormLabel>
                                                 <Input
                                                    type="number"
                                                    min="0"
                                                    value={discountValue}
                                                    onChange={(e) => setDiscountValue(e.target.value)}
                                                    placeholder={discountType === "percentage" ? "10" : "100.00"}
                                                 />
                                             </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                             </Accordion>
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
                                            description: "",
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
                                                <FormItem className="flex flex-col">
                                                    <FormLabel className="text-xs">Product</FormLabel>
                                                    <Popover 
                                                        open={productOpenStates[index] || false} 
                                                        onOpenChange={(open) => setProductOpenStates(prev => ({...prev, [index]: open}))} 
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
                                                                        ? products.find(
                                                                            (product) => String(product.id) === String(field.value)
                                                                        )?.name || "Selected Product"
                                                                        : "Select product"}
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[200]">
                                                            <Command shouldFilter={false}>
                                                                <CommandInput 
                                                                    placeholder="Search product (min 2 chars)..." 
                                                                    autoFocus 
                                                                    value={productQuery}
                                                                    onValueChange={setProductQuery}
                                                                />
                                                                <CommandList>
                                                                    {products.length === 0 && (
                                                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                                                            {debouncedProductQuery.length < 2 
                                                                                ? "Type at least 2 characters..." 
                                                                                : "No product found."}
                                                                        </div>
                                                                    )}
                                                                    <CommandGroup>
                                                                        {products.map((product) => (
                                                                            <CommandItem
                                                                                value={product.name + " " + product.sku}
                                                                                key={product.id}
                                                                                onSelect={() => {
                                                                                    handleProductChange(index, String(product.id));
                                                                                    setProductOpenStates(prev => ({...prev, [index]: false}));
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        String(product.id) === String(field.value)
                                                                                            ? "opacity-100"
                                                                                            : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {product.name} ({product.sku})
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

                                    {/* Description (Full Width) */}
                                    <div className="col-span-12">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Description (optional)"
                                                            {...field}
                                                            value={field.value ?? ""}
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

                        {/* Totals Summary */}
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span className="font-medium">₱{rawSubtotal.toFixed(2)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span>Discount ({discountType === "percentage" ? `${discountValue}%` : "Fixed"}):</span>
                                    <span>-₱{discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Tax Base:</span>
                                <span>₱{discountedSubtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Tax ({taxRate}% {taxType === "inclusive" ? "Incl." : "Excl."}):</span>
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

        {/* Payment Modal */}
        {purchaseOrder && (
            <PaymentFormModal
                open={isPaymentModalOpen}
                onOpenChange={setIsPaymentModalOpen}
                defaultPurchaseOrderId={String(purchaseOrder.id)}
                payment={
                    purchaseOrder.payments && purchaseOrder.payments.length > 0
                        ? { ...purchaseOrder.payments[0], purchase_order_id: purchaseOrder.id } as any
                        : undefined
                }
                onSuccess={() => {
                    setIsPaymentModalOpen(false);
                    onSuccess?.();
                }}
            />
        )}
        </>
    );
}
