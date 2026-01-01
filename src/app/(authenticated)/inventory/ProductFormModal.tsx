"use client";

import { useEffect } from "react";
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
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import { Loader2, Plus, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { updateProduct, createProduct, uploadProductImage, createCategory, createSupplier, approveProduct, type Product, type Category, type Supplier } from "@/src/lib/api/products";
import { useState } from "react";
import { ImageUpload } from "@/src/components/image-upload";
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
import { ChevronsUpDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255, "Name is too long"),
  sku: z.string().max(100, "SKU is too long").optional().or(z.literal("")),
  barcode: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  category_id: z.string().optional().or(z.literal("")).or(z.literal("none")),
  supplier_id: z.string().optional().or(z.literal("")).or(z.literal("none")),
  brand: z.string().optional().or(z.literal("")),
  model: z.string().optional().or(z.literal("")),
  image_url: z.string().optional().or(z.literal("")),
  cost_price: z.coerce.number().min(0, "Cost price must be at least 0"),
  selling_price: z.coerce.number().min(0, "Selling price must be at least 0"),
  stock_quantity: z.coerce.number().int().min(0, "Stock quantity must be at least 0"),
  reorder_level: z.coerce.number().int().min(0, "Reorder level must be at least 0"),
  markup_percentage: z.coerce.number().optional().nullable(),
  tax_rate: z.coerce.number().min(0).default(0),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  categories: Category[];
  suppliers: Supplier[];
  onSuccess?: () => void;
  onRefreshCategories?: () => Promise<void>;
  onRefreshSuppliers?: () => Promise<void>;
}

export function ProductFormModal({
  open,
  onOpenChange,
  product,
  categories,
  suppliers,
  onSuccess,
  onRefreshCategories,
  onRefreshSuppliers,
}: ProductFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!product;
  const isDraft = product?.status === 'draft';


  const [categoryOpen, setCategoryOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");

  const form = useForm<ProductFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      description: "",
      category_id: "none",
      supplier_id: "none",
      brand: "",
      model: "",
      image_url: "",
      cost_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      reorder_level: 0,
      markup_percentage: 0,
      tax_rate: 0,
    },
  });

  // Calculate suggested markup
  const costPrice = form.watch("cost_price");
  const sellingPrice = form.watch("selling_price");
  const suggestedMarkup = (() => {
      const cost = Number(costPrice);
      const price = Number(sellingPrice);
      if (!Number.isFinite(cost) || cost <= 0 || !Number.isFinite(price)) {
        return 0;
      }
      return ((price - cost) / cost) * 100;
  })();

  // Reset form when product changes or modal opens
  useEffect(() => {
    if (open && product) {
      form.reset({
        name: product.name || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        description: product.description || "",
        category_id: product.category_id ? String(product.category_id) : "none",
        supplier_id: product.supplier_id ? String(product.supplier_id) : "none",
        brand: product.brand || "",
        model: product.model || "",
        image_url: product.image_url || "",
        cost_price: product.cost_price || 0,
        selling_price: product.selling_price || 0,
        stock_quantity: product.stock_quantity || 0,
        reorder_level: product.reorder_level || 0,
        markup_percentage: product.markup_percentage || 0,
        tax_rate: product.tax_rate || 0,
      });
    }
  }, [open, product, form]);

  const onSubmit = async (values: ProductFormValues) => {
    try {
      setIsSubmitting(true);

      // Prepare payload - convert empty strings to null for optional fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        name: values.name,
        sku: values.sku,
        barcode: values.barcode || null,
        description: values.description || null,
        category_id: values.category_id === "none" || !values.category_id ? null : values.category_id,
        supplier_id: values.supplier_id === "none" || !values.supplier_id ? null : values.supplier_id,
        brand: values.brand || null,
        model: values.model || null,
        image_url: values.image_url || null,
        cost_price: values.cost_price,
        selling_price: values.selling_price,
        stock_quantity: values.stock_quantity,
        reorder_level: values.reorder_level,
        markup_percentage: values.markup_percentage ?? suggestedMarkup ?? null,
        tax_rate: values.tax_rate,
      };

      if (product) {
        if (isDraft) {
            // First update the product with changes
            await updateProduct(String(product.id), payload);
            // Then approve it
            await approveProduct(String(product.id));
            toast.success("Product finalized and activated successfully");
        } else {
            await updateProduct(String(product.id), payload);
            toast.success("Product updated successfully");
        }
      } else {
        await createProduct(payload);
        toast.success("Product created successfully");
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving product:", error);
      if (error.response && error.response.status === 422) {
        const errors = error.response.data.errors;
        if (errors.sku) form.setError("sku", { message: errors.sku[0] });
        if (errors.barcode) form.setError("barcode", { message: errors.barcode[0] });
        if (errors.name) form.setError("name", { message: errors.name[0] });
        
        // Handle generic error if no specific field error matches
        const hasSpecificError = errors.sku || errors.barcode || errors.name;
        if (!hasSpecificError) {
          toast.error("Validation failed. Please check the form.");
        }
      } else {
        toast.error(product ? "Failed to update product" : "Failed to create product");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? (isDraft ? "Finalize Draft Product" : "Edit Product") : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? (isDraft ? "Review and finalize this draft product to make it available for sale." : "Update product information below.")
              : "Fill in the product details below."}
          </DialogDescription>
        </DialogHeader>

        {isDraft && (
            <Alert className="mb-4 bg-amber-50 text-amber-900 border-amber-200">
                <AlertTriangle className="h-4 w-4 stroke-amber-600" />
                <AlertTitle>Draft Product</AlertTitle>
                <AlertDescription>
                    This product was created from a purchase order and needs to be finalized before it can be used in sales.
                </AlertDescription>
            </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* General Information Section */}
            <div>
              <h3 className="text-lg font-medium mb-4">General Information</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                        <FormLabel>
                        Product Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                        <Input placeholder="e.g. iPhone 15 Pro Max" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Category</FormLabel>
                        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={categoryOpen}
                                        className={cn(
                                            "w-full justify-between",
                                            !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        {field.value && field.value !== "none"
                                            ? categories.find((category) => String(category.id) === field.value)?.name
                                            : "Select category"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput
                                        placeholder="Search category..."
                                        value={categorySearch}
                                        onValueChange={setCategorySearch}
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            <div className="p-2">
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    No category found.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start h-auto py-1.5 px-2 text-sm"
                                                    onClick={async () => {
                                                        if (!categorySearch.trim()) return;
                                                        try {
                                                            const newCategory = await createCategory(categorySearch);
                                                            await onRefreshCategories?.();
                                                            form.setValue("category_id", String(newCategory.id));
                                                            setCategorySearch("");
                                                            setCategoryOpen(false);
                                                            toast.success(`Category "${categorySearch}" created`);
                                                        } catch (error) {
                                                            console.error(error);
                                                            toast.error("Failed to create category");
                                                        }
                                                    }}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Create &quot;{categorySearch}&quot;
                                                </Button>
                                            </div>
                                        </CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="none"
                                                onSelect={() => {
                                                    form.setValue("category_id", "none");
                                                    setCategoryOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        field.value === "none" ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                Unassigned
                                            </CommandItem>
                                            {categories.map((category) => (
                                                <CommandItem
                                                    value={category.name}
                                                    key={category.id}
                                                    onSelect={() => {
                                                        form.setValue("category_id", String(category.id));
                                                        setCategoryOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            field.value === String(category.id)
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    {category.name}
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

                <FormField
                    control={form.control}
                    name="supplier_id"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Supplier</FormLabel>
                        <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={supplierOpen}
                                        className={cn(
                                            "w-full justify-between",
                                            !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        {field.value && field.value !== "none"
                                            ? suppliers.find((supplier) => String(supplier.id) === field.value)?.company_name ?? suppliers.find((supplier) => String(supplier.id) === field.value)?.contact_person ?? "Unknown"
                                            : "Select supplier"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput
                                        placeholder="Search supplier..."
                                        value={supplierSearch}
                                        onValueChange={setSupplierSearch}
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            <div className="p-2">
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    No supplier found.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start h-auto py-1.5 px-2 text-sm"
                                                    onClick={async () => {
                                                        if (!supplierSearch.trim()) return;
                                                        try {
                                                            const newSupplier = await createSupplier(supplierSearch);
                                                            await onRefreshSuppliers?.();
                                                            form.setValue("supplier_id", String(newSupplier.id));
                                                            setSupplierSearch("");
                                                            setSupplierOpen(false);
                                                            toast.success(`Supplier "${supplierSearch}" created`);
                                                        } catch (error) {
                                                            console.error(error);
                                                            toast.error("Failed to create supplier");
                                                        }
                                                    }}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Create &quot;{supplierSearch}&quot;
                                                </Button>
                                            </div>
                                        </CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="none"
                                                onSelect={() => {
                                                    form.setValue("supplier_id", "none");
                                                    setSupplierOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        field.value === "none" ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                Unassigned
                                            </CommandItem>
                                            {suppliers.map((supplier) => (
                                                <CommandItem
                                                    value={supplier.company_name ?? supplier.contact_person ?? "Unknown"}
                                                    key={supplier.id}
                                                    onSelect={() => {
                                                        form.setValue("supplier_id", String(supplier.id));
                                                        setSupplierOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            field.value === String(supplier.id)
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    {supplier.company_name ?? supplier.contact_person ?? "Unknown"}
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

                 <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                        SKU <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                        <Input placeholder="e.g. WM-001" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Barcode</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g. 123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                 <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g. A2849" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g. Apple" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                        <FormLabel>Product Image</FormLabel>
                        <FormControl>
                            <ImageUpload 
                                value={field.value}
                                onChange={async (file) => {
                                    if (file) {
                                        try {
                                          const { url } = await uploadProductImage(file);
                                          field.onChange(url);
                                          toast.success("Image uploaded successfully");
                                        } catch (error) {
                                          console.error("Upload failed", error);
                                          toast.error("Failed to upload image");
                                        }
                                    } else {
                                        field.onChange("");
                                    }
                                }}
                                disabled={isSubmitting}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="Product description..."
                            className="resize-none"
                            rows={3}
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
            </div>

            <div className="h-px bg-border" />

             {/* Pricing Section */}
            <div>
              <h3 className="text-lg font-medium mb-4">Pricing & Inventory</h3>
              <div className="grid gap-4 sm:grid-cols-4">
                 <FormField
                    control={form.control}
                    name="cost_price"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                        Cost Price <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                        <Input
                            type="number"
                            step="0.01"
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
                    name="selling_price"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                        Selling Price <span className="text-destructive">*</span>
                         <p className="text-xs text-muted-foreground mt-1">
                            Margin: {suggestedMarkup.toFixed(1)}%
                        </p>
                        </FormLabel>
                        <FormControl>
                        <Input
                            type="number"
                            step="0.01"
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
                    name="markup_percentage"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Markup %</FormLabel>
                        <FormControl>
                        <Input
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            {...field}
                            value={field.value ?? ""}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                 <FormField
                    control={form.control}
                    name="tax_rate"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tax Rate %</FormLabel>
                        <FormControl>
                        <Input
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            {...field}
                            value={field.value ?? ""}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                 <FormField
                    control={form.control}
                    name="stock_quantity"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                        Stock Quantity <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                 <FormField
                    control={form.control}
                    name="reorder_level"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                        Reorder Level <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
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
                {isEditing ? (isDraft ? "Finalize Product" : "Update product") : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
