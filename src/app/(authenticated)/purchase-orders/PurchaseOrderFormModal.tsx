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
} from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this component, or use Input if not
import { Button } from "@/src/components/ui/button";
import { Loader2, Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
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
    createPurchaseOrder,
    updatePurchaseOrder,
    type CreatePurchaseOrderPayload,
    type PurchaseOrder,
} from "@/src/lib/api/purchase-orders";
import { fetchProducts, type Product } from "@/src/lib/api/products";
import { fetchCustomers, type Customer } from "@/src/lib/api/customers";

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
    payment_status: z.string().optional(),
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
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [customerOpen, setCustomerOpen] = useState(false);
    const [productOpenStates, setProductOpenStates] = useState<Record<number, boolean>>({});
    const isEditing = !!purchaseOrder;

    const form = useForm<PurchaseOrderFormValues>({
        resolver: zodResolver(purchaseOrderFormSchema),
        defaultValues: {
            supplier_id: purchaseOrder?.supplier_id || "",
            delivery_date: purchaseOrder?.expected_at || "",
            status: (purchaseOrder?.status as any) || "draft",
            payment_status: "pending",
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

    // Load products and suppliers
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingData(true);
                const [productsRes, customersRes] = await Promise.all([
                   fetchProducts({ per_page: 1000 }),
                   fetchCustomers({ per_page: 1000 })
                ]);
                setProducts(productsRes.data);
                setCustomers(customersRes.data);
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

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            form.reset({
                supplier_id: purchaseOrder?.supplier_id || "",
                delivery_date: purchaseOrder?.expected_at || "",
                status: (purchaseOrder?.status as any) || "draft",
                payment_status: "pending",
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
        }
    }, [open, purchaseOrder, form]);

    // Calculate totals
    const items = form.watch("items");
    const subtotal = items.reduce(
        (sum, item) => sum + (item.quantity_ordered || 0) * (item.unit_cost || 0),
        0
    );
    const tax = subtotal * 0.12; // 12% tax
    const total = subtotal + tax;

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
                subtotal,
                tax,
                total,
                notes: values.notes || undefined,
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
                                                        )?.name
                                                        : "Select customer"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[200]">
                                            <Command>
                                                <CommandInput placeholder="Search customer..." autoFocus />
                                                <CommandList>
                                                    <CommandEmpty>No customer found.</CommandEmpty>
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

                            {/* Payment Status */}
                            <FormField
                                control={form.control}
                                name="payment_status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Payment Status</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select payment status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="paid">Paid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                                                        )?.name
                                                                        : "Select product"}
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[200]">
                                                            <Command>
                                                                <CommandInput placeholder="Search product..." autoFocus />
                                                                <CommandList>
                                                                    <CommandEmpty>No product found.</CommandEmpty>
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
                                <span className="font-medium">₱{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Tax (12%):</span>
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
    );
}
