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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Label } from "@/src/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPayrollPeriod } from "@/src/lib/api/payroll";
import { fetchEmployees, type Employee } from "@/src/lib/api/employees";

const periodFormSchema = z.object({
  name: z.string().min(1, "Period name is required"),
  period_type: z.enum(['weekly', 'bi-weekly', 'monthly', 'custom']),
  employee_selection: z.enum(['all', 'custom']),
  selected_user_ids: z.array(z.number()).optional(), // This now refers to employee IDs
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
});

export type PeriodFormValues = z.infer<typeof periodFormSchema>;

interface PayrollPeriodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultValues?: Partial<PeriodFormValues>;
}

export function PayrollPeriodModal({
  open,
  onOpenChange,
  onSuccess,
  defaultValues
}: PayrollPeriodModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibleEmployees, setEligibleEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const form = useForm<PeriodFormValues>({
    resolver: zodResolver(periodFormSchema),
    defaultValues: {
      name: "",
      period_type: "monthly",
      employee_selection: "all",
      selected_user_ids: [],
      start_date: "",
      end_date: "",
      ...defaultValues
    },
  });

  // Watch for period type changes to auto-set dates
  const periodType = form.watch("period_type");
  const employeeSelection = form.watch("employee_selection");

  useEffect(() => {
    if (open) {
      loadEligibleEmployees();
      // Reset form with default values when opened
      if (defaultValues) {
        form.reset(defaultValues);
      } else {
        form.reset({
          name: "",
          period_type: "monthly",
          employee_selection: "all",
          selected_user_ids: [],
          start_date: "",
          end_date: "",
        });
      }
    }
  }, [open, defaultValues]);

  // Auto-set dates for weekly period
  useEffect(() => {
    if (periodType === 'weekly' && !defaultValues) {
      const today = new Date();
      // Calculate next Monday
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7));
      
      // Calculate following Saturday (5 days after Monday)
      const followingSaturday = new Date(nextMonday);
      followingSaturday.setDate(nextMonday.getDate() + 5);

      form.setValue('start_date', nextMonday.toISOString().split('T')[0]);
      form.setValue('end_date', followingSaturday.toISOString().split('T')[0]);
    }
  }, [periodType]);

  const loadEligibleEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const employees = await fetchEmployees({ status: 'active' });
      setEligibleEmployees(employees);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast.error("Failed to load eligible employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const onSubmit = async (values: PeriodFormValues) => {
    try {
      setIsSubmitting(true);
      await createPayrollPeriod(values);
      toast.success("Payroll period created successfully");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating payroll period:", error);
      toast.error("Failed to create payroll period");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEmployee = (employeeId: number) => {
    const currentIds = form.getValues("selected_user_ids") || [];
    if (currentIds.includes(employeeId)) {
      form.setValue("selected_user_ids", currentIds.filter(id => id !== employeeId));
    } else {
      form.setValue("selected_user_ids", [...currentIds, employeeId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Duplicate Payroll Period" : "Create Payroll Period"}</DialogTitle>
          <DialogDescription>
            {defaultValues ? "Create a copy of an existing payroll period" : "Set up a new payroll period for employees"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., January 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="period_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employee_selection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Include Employees</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employees" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Active Employees</SelectItem>
                      <SelectItem value="custom">Select Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">
                    Select which employees to include in this payroll run
                  </p>
                </FormItem>
              )}
            />

            {employeeSelection === 'custom' && (
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                <Label className="mb-2 block">Select Employees</Label>
                {loadingEmployees ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : eligibleEmployees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No eligible employees found</p>
                ) : (
                  <div className="space-y-2">
                    {eligibleEmployees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`emp-${employee.id}`}
                          checked={form.watch("selected_user_ids")?.includes(employee.id)}
                          onCheckedChange={() => toggleEmployee(employee.id)}
                        />
                        <label
                          htmlFor={`emp-${employee.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {employee.first_name} {employee.last_name} ({employee.position})
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
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
                {defaultValues ? "Duplicate Period" : "Create Period"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
