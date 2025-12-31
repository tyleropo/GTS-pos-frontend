"use client";

import { useState, useEffect } from "react";
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
import { createEmployeeFromUser, type CreateEmployeeFromUserPayload } from "@/src/lib/api/employees";
import { toast } from "sonner";

interface ConvertToEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: { id: string | number; first_name: string; last_name: string; email: string };
  onSuccess: () => void;
}

export function ConvertToEmployeeModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: ConvertToEmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEmployeeFromUserPayload>({
    position: "",
    department: "",
    salary: 0,
    hire_date: "",
  });

  useEffect(() => {
    if (open && !user) {
      // Reset if no user
      setFormData({
        position: "",
        department: "",
        salary: 0,
        hire_date: new Date().toISOString().split('T')[0],
      });
    } else if (open && user) {
      setFormData({
        position: "",
        department: "",
        salary: 0,
        hire_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const payload: CreateEmployeeFromUserPayload = {
        ...formData,
        department: formData.department || null,
        hire_date: formData.hire_date || null,
        salary: Number(formData.salary),
      };

      await createEmployeeFromUser(user.id, payload);
      toast.success("User converted to employee successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Error converting to employee:", error);
      const err = error as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        Object.values(validationErrors).forEach((v: string[]) => {
          toast.error(Array.isArray(v) ? v[0] : v);
        });
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to convert user to employee");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Convert to Employee</DialogTitle>
          <DialogDescription>
            Create an employee record for {user.first_name} {user.last_name}. This will link their user account to an employee profile for payroll and HR purposes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                placeholder="e.g. Cashier, Manager, Technician"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <Input
                id="department"
                value={formData.department || ""}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="e.g. Sales, Operations"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="salary">Base Salary *</Label>
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Converting..." : "Convert to Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
