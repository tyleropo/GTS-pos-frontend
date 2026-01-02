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
import { Badge } from "@/src/components/ui/badge";
import { Loader2, Plus, Trash2, Check, ChevronsUpDown, PackagePlus } from "lucide-react";
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

import { toast } from "sonner";
import { formatCurrency } from "@/src/lib/format-currency";
import {
    createPurchaseOrder,
    updatePurchaseOrder,
    type CreatePurchaseOrderPayload,
    type PurchaseOrder,
} from "@/src/lib/api/purchase-orders";
import { fetchProducts, type Product } from "@/src/lib/api/products";
import { fetchSuppliers, type Supplier } from "@/src/lib/api/suppliers";
import { useDebounce } from "@/src/hooks/use-debounce";

const purchaseOrderItemSchema = z.object({
    product_id: z.union([z.string(), z.number()]).optional(),
    product_name: z.string().min(1, "Product name is required"),
    quantity_ordered: z.coerce.number().min(1, "Quantity must be at least 1"),
    unit_cost: z.coerce.number().min(0, "Unit cost must be positive"),
    description: z.string().nullable().optional(),
    is_new_product: z.boolean().default(false),
});

const purchaseOrderFormSchema = z.object({
    supplier_id: z.string().min(1, "Supplier is required"),
    delivery_date: z.string().optional(),
    payment_due_date: z.string().optional(),
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

    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [supplierOpen, setSupplierOpen] = useState(false);
    const [productOpenStates, setProductOpenStates] = useState<Record<number, boolean>>({});
    
    // Search states
    const [supplierQuery, setSupplierQuery] = useState("");
    const debouncedSupplierQuery = useDebounce(supplierQuery, 300);
    const [productQuery, setProductQuery] = useState("");
    const debouncedProductQuery = useDebounce(productQuery, 300);
    
    const isEditing = !!purchaseOrder;

    const form = useForm<PurchaseOrderFormValues>({
        resolver: zodResolver(purchaseOrderFormSchema),
        defaultValues: {
            supplier_id: purchaseOrder?.supplier_id || "",
            delivery_date: purchaseOrder?.expected_at || "",
            payment_due_date: purchaseOrder?.payment_due_date || "",
            status: (purchaseOrder?.status as "draft" | "submitted" | "received" | "cancelled") || "draft",
            notes: purchaseOrder?.notes || "",
            items: purchaseOrder?.items
                ? purchaseOrder.items.map(item => {
                    // Check if this is a new product by examining the product_id pattern OR the meta.new_products array
                    const isNewProductFromId = typeof item.product_id === 'string' && item.product_id.startsWith('new_');
                    // Check if this product's name is in the meta.new_products array
                    const meta = purchaseOrder?.meta as Record<string, unknown> | undefined;
                    const newProductsRaw = meta?.new_products;
                    const newProductsArray = Array.isArray(newProductsRaw) 
                        ? newProductsRaw 
                        : (newProductsRaw ? [newProductsRaw] : []);
                    const isNewProductFromMeta = newProductsArray.some( 
                        (np) => (np as { name?: string })?.name === item.product_name
                    );
                    const isNewProduct = isNewProductFromId || isNewProductFromMeta;
                    
                    return {
                        product_id: isNewProduct ? undefined : item.product_id,
                        product_name: item.product_name || "",
                        quantity_ordered: item.quantity_ordered,
                        unit_cost: item.unit_cost,
                        description: item.description || "",
                        is_new_product: isNewProduct,
                    };
                })
                : [{ product_id: "", product_name: "", quantity_ordered: 1, unit_cost: 0, description: "", is_new_product: false }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    // Load suppliers on search
    useEffect(() => {
        const loadSuppliers = async () => {
            if (debouncedSupplierQuery.length < 2 && !purchaseOrder) {
                 setSuppliers([]);
                 return;
            }

            try {
                const suppliersRes = await fetchSuppliers({ 
                    search: debouncedSupplierQuery,
                    per_page: 50 
                });
                setSuppliers(suppliersRes.data);
            } catch (error) {
                console.error("Error loading suppliers:", error);
            } 
        };
        loadSuppliers();
    }, [debouncedSupplierQuery, purchaseOrder]);

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
                    const [productsRes, suppliersRes] = await Promise.all([
                        fetchProducts({ per_page: 50 }),
                        fetchSuppliers({ per_page: 50 })
                    ]);
                    setProducts(productsRes.data);
                    setSuppliers(suppliersRes.data);
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
                delivery_date: purchaseOrder?.expected_at ? purchaseOrder.expected_at.split('T')[0] : "",
                payment_due_date: purchaseOrder?.payment_due_date ? purchaseOrder.payment_due_date.split('T')[0] : "",
                status: (purchaseOrder?.status as any) || "draft",
                notes: purchaseOrder?.notes || "",
                items: purchaseOrder?.items
                ? purchaseOrder.items.map(item => {
                    // Check if this is a new product by examining the product_id pattern OR the meta.new_products array
                    const isNewProductFromId = typeof item.product_id === 'string' && item.product_id.startsWith('new_');
                    // Check if this product's name is in the meta.new_products array
                    const meta = purchaseOrder?.meta as Record<string, unknown> | undefined;
                    const newProductsRaw = meta?.new_products;
                    const newProductsArray = Array.isArray(newProductsRaw) 
                        ? newProductsRaw 
                        : (newProductsRaw ? [newProductsRaw] : []);
                    const isNewProductFromMeta = newProductsArray.some( 
                        (np) => (np as { name?: string })?.name === item.product_name
                    );
                    const isNewProduct = isNewProductFromId || isNewProductFromMeta;
                    
                    return {
                        product_id: isNewProduct ? undefined : item.product_id,
                        product_name: item.product_name || "",
                        quantity_ordered: item.quantity_ordered,
                        unit_cost: item.unit_cost,
                        description: item.description || "",
                        is_new_product: isNewProduct,
                    };
                })
                : [{ product_id: "", product_name: "", quantity_ordered: 1, unit_cost: 0, description: "", is_new_product: false }],
            });
        }
    }, [open, purchaseOrder, form]);

    // Calculations
    const items = form.watch("items");
    
    const total = items.reduce(
        (sum, item) => sum + (item.quantity_ordered || 0) * (item.unit_cost || 0),
        0
    );

    const onSubmit = async (values: PurchaseOrderFormValues) => {
        try {
            setIsSubmitting(true);

            const payload: CreatePurchaseOrderPayload = {
                supplier_id: values.supplier_id,
                items: values.items.map(item => ({
                    product_id: item.product_id || `new_${item.product_name}`,
                    quantity_ordered: item.quantity_ordered,
                    unit_cost: item.unit_cost,
                    line_total: (item.quantity_ordered || 0) * (item.unit_cost || 0),
                    tax: 0,
                    description: item.description,
                })),
                expected_at: values.delivery_date || undefined,
                payment_due_date: values.payment_due_date || undefined,
                status: values.status,
                subtotal: total,
                tax: 0,
                total,
                notes: values.notes || undefined,
                meta: {
                    new_products: values.items.filter(i => i.is_new_product).map(i => ({
                        name: i.product_name,
                        cost: i.unit_cost,
                        description: i.description
                    }))
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
                    ? `Failed to update purchase order: ${error instanceof Error ? error.message : "Unknown error"}`
                    : `Failed to create purchase order: ${error instanceof Error ? error.message : "Unknown error"}`
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
            form.setValue(`items.${index}.is_new_product`, false);
        }
    };

    // Toggle between existing product and new product entry
    const toggleNewProduct = (index: number) => {
        const isNew = form.watch(`items.${index}.is_new_product`);
        form.setValue(`items.${index}.is_new_product`, !isNew);
        if (!isNew) {
            // Switching to new product mode
            form.setValue(`items.${index}.product_id`, undefined);
            form.setValue(`items.${index}.product_name`, "");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Purchases" : "New Purchases"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update purchases information below."
                            : "Create a new purchases for your supplier."}
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
                                        Supplier <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <Popover 
                                        open={supplierOpen} 
                                        onOpenChange={setSupplierOpen} 
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
                                                        ? suppliers.find(
                                                            (s) => String(s.id) === field.value
                                                        )?.company_name || "Selected Supplier"
                                                        : "Select supplier"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[200]">
                                            <Command shouldFilter={false}>
                                                <CommandInput 
                                                    placeholder="Search supplier (min 2 chars)..." 
                                                    autoFocus 
                                                    value={supplierQuery}
                                                    onValueChange={setSupplierQuery}
                                                />
                                                <CommandList>
                                                    {suppliers.length === 0 && (
                                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                                            {debouncedSupplierQuery.length < 2 
                                                                ? "Type at least 2 characters..." 
                                                                : "No supplier found."}
                                                        </div>
                                                    )}
                                                    <CommandGroup>
                                                        {suppliers.map((supplier) => (
                                                            <CommandItem
                                                                value={supplier.company_name}
                                                                key={supplier.id}
                                                                onSelect={() => {
                                                                    form.setValue("supplier_id", String(supplier.id));
                                                                    setSupplierOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        String(supplier.id) === field.value
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {supplier.company_name}
                                                                {supplier.contact_person && (
                                                                    <span className="ml-2 text-muted-foreground text-xs">
                                                                        ({supplier.contact_person})
                                                                    </span>
                                                                )}
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

                        <div className="grid grid-cols-3 gap-4">
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

                            {/* Payment Due Date */}
                            <FormField
                                control={form.control}
                                name="payment_due_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Due Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                        </div>

                        {/* Notes */}
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
                                            is_new_product: false,
                                        })
                                    }
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Item
                                </Button>
                            </div>

                            {fields.map((field, index) => {
                                const isNewProduct = form.watch(`items.${index}.is_new_product`);
                                
                                return (
                                    <div
                                        key={field.id}
                                        className="border p-3 rounded-lg space-y-3"
                                    >
                                        {/* Header with New Product Toggle */}
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                {isNewProduct && (
                                                    <Badge variant="secondary">
                                                        <PackagePlus className="h-3 w-3 mr-1" />
                                                        New Product
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleNewProduct(index)}
                                                >
                                                    {isNewProduct ? "Use Existing" : "Add New Product"}
                                                </Button>
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

                                        <div className="grid grid-cols-12 gap-2">
                                            {/* Product Selection or Name Input */}
                                            <div className="col-span-6">
                                                {isNewProduct ? (
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.product_name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs">Product Name</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        placeholder="Enter new product name..." 
                                                                        {...field} 
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                ) : (
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
                                                                                    "w-full justify-between text-xs h-9",
                                                                                    !field.value && "text-muted-foreground"
                                                                                )}
                                                                            >
                                                                                {field.value
                                                                                    ? products.find(
                                                                                        (product) => String(product.id) === String(field.value)
                                                                                    )?.name || "Selected Product"
                                                                                    : "Select product"}
                                                                                <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
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
                                                )}
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
                                                                    className="h-9"
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
                                                            <FormLabel className="text-xs">Product Cost</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    className="h-9"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
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
                                    </div>
                                );
                            })}
                        </div>

                        {/* Totals Summary */}
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                            <div className="flex justify-between text-base font-bold">
                                <span>Total:</span>
                                <span>₱{formatCurrency(total)}</span>
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
