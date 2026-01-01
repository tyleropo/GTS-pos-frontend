import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adjustStock, type Product } from "@/src/lib/api/products";

const adjustStockSchema = z.object({
  type: z.enum(["add", "subtract", "set"]),
  quantity: z.coerce.number().min(0, "Quantity must be positive"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
});

type AdjustStockValues = z.infer<typeof adjustStockSchema>;

interface AdjustStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onSuccess?: () => void;
}

export function AdjustStockModal({
  open,
  onOpenChange,
  product,
  onSuccess,
}: AdjustStockModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdjustStockValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      type: "add",
      quantity: 0,
      reason: "",
      notes: "",
    },
  });

  const onSubmit = async (values: AdjustStockValues) => {
    try {
      setIsSubmitting(true);
      await adjustStock(String(product.id), values);
      toast.success("Stock adjusted successfully");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to adjust stock:", error);
      toast.error("Failed to adjust stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStock = product.stock_quantity;
  const adjustmentType = form.watch("type");
  const adjustmentQty = form.watch("quantity");
  
  const estimatedNewStock = (() => {
      const qty = Number(adjustmentQty) || 0;
      switch (adjustmentType) {
          case "add": return currentStock + qty;
          case "subtract": return currentStock - qty;
          case "set": return qty;
          default: return currentStock;
      }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            Update inventory levels for <span className="font-medium text-foreground">{product.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Adjustment Type</FormLabel>
                    <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                    >
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="add">Add Stock</SelectItem>
                        <SelectItem value="subtract">Remove Stock</SelectItem>
                        <SelectItem value="set">Set Quantity</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                        <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="rounded-md bg-muted p-3 text-sm flex justify-between items-center">
                <span>Current Stock: <span className="font-medium">{currentStock}</span></span>
                <span>New Stock: <span className="font-medium">{estimatedNewStock}</span></span>
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="restock">Restock</SelectItem>
                      <SelectItem value="damage">Damaged/Expired</SelectItem>
                      <SelectItem value="loss">Loss/Theft</SelectItem>
                      <SelectItem value="correction">Inventory Correction</SelectItem>
                      <SelectItem value="return">Customer Return</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details..."
                      rows={2}
                      {...field}
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
                Save Adjustment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
