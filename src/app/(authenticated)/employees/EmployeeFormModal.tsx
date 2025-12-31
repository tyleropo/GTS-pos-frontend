"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { createEmployee, updateEmployee, type Employee, type CreateEmployeePayload } from "@/src/lib/api/employees";
import { toast } from "sonner";

interface EmployeeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee;
  onSuccess: () => void;
}

export function EmployeeFormModal({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EmployeeFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEmployeePayload>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    salary: 0,
    hire_date: "",
    status: "active",
    user_id: null,
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email || "",
        phone: employee.phone || "",
        position: employee.position,
        department: employee.department || "",
        salary: Number(employee.salary),
        hire_date: employee.hire_date || "",
        status: employee.status,
        user_id: employee.user_id,
      });
    } else {
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        position: "",
        department: "",
        salary: 0,
        hire_date: new Date().toISOString().split('T')[0], // Default to today
        status: "active",
        user_id: null,
      });
    }
  }, [employee, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: CreateEmployeePayload = {
        ...formData,
        email: formData.email || null,
        phone: formData.phone || null,
        department: formData.department || null,
        hire_date: formData.hire_date || null,
        // Ensure salary is number
        salary: Number(formData.salary),
      };

      if (employee) {
        await updateEmployee(employee.id, payload);
        toast.success("Employee updated successfully");
      } else {
        await createEmployee(payload);
        toast.success("Employee created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving employee:", error);
       // Extract validation errors if available (Laravel style)
       const validationErrors = error.response?.data?.errors;
       if (validationErrors) {
         Object.values(validationErrors).forEach((v: any) => {
            toast.error(Array.isArray(v) ? v[0] : v);
         });
       } else {
         toast.error("Failed to save employee");
       }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Employee" : "Add Employee"}</DialogTitle>
          <DialogDescription>
            {employee
              ? "Update employee details."
              : "Enter details for the new employee."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  placeholder="e.g. Cashier"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salary">Base Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: Number(e.target.value) })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, hire_date: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "terminated") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
