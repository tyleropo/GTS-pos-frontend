"use client";

import { SiteHeader } from "@/src/components/site-header";
import { CustomerTable } from "./CustomerTable";
import CustomerStats from "./CustomerStats";
import { CustomerFormModal } from "./CustomerFormModal";
import { DeleteCustomerDialog } from "./DeleteCustomerDialog";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";
import { fetchCustomers } from "@/src/lib/api/customers";
import { useEffect, useState } from "react";
import type { Customer } from "@/src/types/customer";
import { adaptCustomer } from "@/src/lib/adapters";

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{
    last_page?: number;
    total?: number;
  }>({});

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchCustomers({ page, per_page: 10 });
      const adapted = response.data.map(adaptCustomer);
      setCustomers(adapted);
      if (response.meta) {
        setMeta(response.meta);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
      console.error("Error loading customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page]);

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsFormModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormModalOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSuccess = () => {
    loadCustomers();
  };

  const handleDeleteSuccess = () => {
    loadCustomers();
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        <SiteHeader
          title="Customers"
          subtitle="Review customer health, lifetime value, and relationship status."
        />
        <div className="p-4">
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <SiteHeader
          title="Customers"
          subtitle="Review customer health, lifetime value, and relationship status."
        />
        <div className="p-4">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={loadCustomers} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <SiteHeader
        title="Customers"
        subtitle="Review customer health, lifetime value, and relationship status."
      />
      <div className="p-4">
        <CustomerStats customers={customers} />
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="flex justify-between text-2xl font-bold">
              Customer database
              <Button onClick={handleAddCustomer}>
                <Plus className="mr-2 h-4 w-4" />
                Add customer
              </Button>
            </CardTitle>
            <CardDescription>
              Manage your customer database and purchase history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerTable
              customers={customers}
              onEdit={handleEditCustomer}
              onDelete={handleDeleteCustomer}
              page={page}
              totalPages={meta.last_page || 1}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CustomerFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        customer={selectedCustomer || undefined}
        onSuccess={handleFormSuccess}
      />

      <DeleteCustomerDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        customer={selectedCustomer}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}

export default CustomersPage;
