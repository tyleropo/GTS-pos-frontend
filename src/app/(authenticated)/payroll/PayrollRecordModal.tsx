"use client";

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
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { updatePayrollRecord, type PayrollRecord } from "@/src/lib/api/payroll";

const recordFormSchema = z.object({
  base_salary: z.number().min(0),
  commission: z.number().min(0),
  benefit_items: z.array(z.object({
    name: z.string().min(1),
    amount: z.number().min(0),
  })),
  deduction_items: z.array(z.object({
    name: z.string().min(1),
    amount: z.number().min(0),
  })),
  notes: z.string().optional(),
});

type RecordFormValues = z.infer<typeof recordFormSchema>;

interface PayrollRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: PayrollRecord;
  periodId: number;
  onSuccess?: () => void;
}

export function PayrollRecordModal({
  open,
  onOpenChange,
  record,
  periodId,
  onSuccess,
}: PayrollRecordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordFormSchema),
    defaultValues: {
      base_salary: record.base_salary,
      commission: record.commission,
      benefit_items: record.benefit_items || [],
      deduction_items: record.deduction_items || [],
      notes: record.notes || "",
    },
  });

  const { fields: benefitFields, append: appendBenefit, remove: removeBenefit } = useFieldArray({
    control: form.control,
    name: "benefit_items",
  });

  const { fields: deductionFields, append: appendDeduction, remove: removeDeduction } = useFieldArray({
    control: form.control,
    name: "deduction_items",
  });

  useEffect(() => {
    if (open) {
      form.reset({
        base_salary: record.base_salary,
        commission: record.commission,
        benefit_items: record.benefit_items || [],
        deduction_items: record.deduction_items || [],
        notes: record.notes || "",
      });
    }
  }, [open, record, form]);

  const watchedValues = form.watch();
  
  // Calculate totals
  const baseSalary = watchedValues.base_salary || 0;
  const commission = watchedValues.commission || 0;
  const benefitsTotal = (watchedValues.benefit_items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
  const deductionsTotal = (watchedValues.deduction_items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
  const grossPay = baseSalary + commission + benefitsTotal;
  const netPay = grossPay - deductionsTotal;

  const onSubmit = async (values: RecordFormValues) => {
    try {
      setIsSubmitting(true);
      await updatePayrollRecord(periodId, record.id, values);
      toast.success("Payroll record updated successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating payroll record:", error);
      toast.error("Failed to update payroll record");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Payroll: {record.employee?.first_name || record.user?.first_name} {record.employee?.last_name || record.user?.last_name}
          </DialogTitle>
          <DialogDescription>
            Update employee compensation and deductions
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="base_salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Salary</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <FormLabel>Benefits (Optional)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendBenefit({ name: "", amount: 0 })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Benefit
                </Button>
              </div>
              {benefitFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2">
                  <FormField
                    control={form.control}
                    name={`benefit_items.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="e.g., Allowance" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`benefit_items.${index}.amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBenefit(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <FormLabel>Deductions (Optional)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendDeduction({ name: "", amount: 0 })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Deduction
                </Button>
              </div>
              {deductionFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2">
                  <FormField
                    control={form.control}
                    name={`deduction_items.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="e.g., SSS" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`deduction_items.${index}.amount`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDeduction(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="bg-muted p-4 rounded-md space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gross Pay:</span>
                <span className="font-bold">₱{grossPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Deductions:</span>
                <span className="font-bold">₱{deductionsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-lg border-t pt-2">
                <span className="font-bold">Net Pay:</span>
                <span className="font-bold text-primary">₱{netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} />
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
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
