"use client";

import { SiteHeader } from "@/src/components/site-header";
import { SupplierTable } from "./SupplierTable";
import SupplierStats from "./SupplierStats";
import { SupplierFormModal } from "./SupplierFormModal";
import { DeleteSupplierDialog } from "./DeleteSupplierDialog";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";
import { fetchSuppliers, type Supplier } from "@/src/lib/api/suppliers";
import { useEffect, useState } from "react";

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchSuppliers({ page, per_page: 10 });
      setSuppliers(response.data);
      if (response.meta) {
        setMeta(response.meta);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suppliers");
      console.error("Error loading suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [page]);

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setIsFormModalOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsFormModalOpen(true);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSuccess = () => {
    loadSuppliers();
  };

  const handleDeleteSuccess = () => {
    loadSuppliers();
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        <SiteHeader
          title="Suppliers"
          subtitle="Manage supplier relationships and procurement sources."
        />
        <div className="p-4">
          <p className="text-muted-foreground">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <SiteHeader
          title="Suppliers"
          subtitle="Manage supplier relationships and procurement sources."
        />
        <div className="p-4">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={loadSuppliers} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <SiteHeader
        title="Suppliers"
        subtitle="Manage supplier relationships and procurement sources."
      />
      <div className="p-4">
        <SupplierStats suppliers={suppliers} />
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="flex justify-between text-2xl font-bold">
              Supplier database
              <Button onClick={handleAddSupplier}>
                <Plus className="mr-2 h-4 w-4" />
                Add supplier
              </Button>
            </CardTitle>
            <CardDescription>
              Manage your supplier database and procurement history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupplierTable
              suppliers={suppliers}
              onEdit={handleEditSupplier}
              onDelete={handleDeleteSupplier}
              page={page}
              totalPages={meta.last_page || 1}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <SupplierFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        supplier={selectedSupplier || undefined}
        onSuccess={handleFormSuccess}
      />

      <DeleteSupplierDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        supplier={selectedSupplier}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}

export default SuppliersPage;
