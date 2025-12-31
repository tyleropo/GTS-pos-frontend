"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Badge } from "@/src/components/ui/badge";
import { MoreHorizontal, Search, UserPlus } from "lucide-react";
import { EmployeeFormModal } from "./EmployeeFormModal";
import { fetchEmployees, deleteEmployee, type Employee } from "@/src/lib/api/employees";
import { toast } from "sonner";
import { format } from "date-fns";
import { SiteHeader } from "@/src/components/site-header";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await fetchEmployees({ search });
      setEmployees(data);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadEmployees();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateClick = () => {
    setSelectedEmployee(undefined);
    setModalOpen(true);
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalOpen(true);
  };

  const handleDeleteClick = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.first_name} ${employee.last_name}?`)) {
      return;
    }

    try {
      await deleteEmployee(employee.id);
      toast.success("Employee deleted successfully");
      loadEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Failed to delete employee");
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      <SiteHeader
        title="Employees"
        subtitle="Manage detailed employee records and payroll information"
        actions={
          <Button onClick={handleCreateClick}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    {employee.first_name} {employee.last_name}
                  </TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.email || "-"}</TableCell>
                  <TableCell>{employee.phone || "-"}</TableCell>
                  <TableCell>₱{Number(employee.salary).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === "active" ? "default" : "secondary"} className="capitalize">
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {employee.hire_date
                      ? format(new Date(employee.hire_date), "MMM d, yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditClick(employee)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(employee)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EmployeeFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        employee={selectedEmployee}
        onSuccess={loadEmployees}
      />
    </div>
  );
}
