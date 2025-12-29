"use client";

import { SiteHeader } from "@/src/components/site-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";
import RepairsTable from "./RepairsTable";
import RepairsStats from "./RepairsStats";
import { RepairFormModal } from "./RepairFormModal";
import { ViewRepairModal } from "./ViewRepairModal";
import { DeleteRepairDialog } from "./DeleteRepairDialog";
import { fetchRepairs, fetchRepair, updateRepair } from "@/src/lib/api/repairs";
import type { Repair as APIRepair } from "@/src/lib/api/repairs";
import { useEffect, useState } from "react";
import type { Repair } from "@/src/types/repair";
import { adaptRepair } from "@/src/lib/adapters";
import { toast } from "sonner";

function RepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [apiRepairs, setApiRepairs] = useState<APIRepair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<APIRepair | null>(null);

  const loadRepairs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchRepairs();
      const adapted = response.data.map(adaptRepair);
      setRepairs(adapted);
      setApiRepairs(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repairs");
      console.error("Error loading repairs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepairs();
  }, []);

  const handleAddRepair = () => {
    setSelectedRepair(null);
    setIsFormModalOpen(true);
  };

  const handleViewRepair = (repair: Repair) => {
    const apiRepair = apiRepairs.find((r) => String(r.id) === repair.id);
    setSelectedRepair(apiRepair || null);
    setIsViewModalOpen(true);
  };

  const handleEditRepair = async (repair: Repair) => {
    try {
      const data = await fetchRepair(repair.id);
      setSelectedRepair(data);
      setIsFormModalOpen(true);
    } catch (error) {
      console.error("Error fetching repair details:", error);
      toast.error("Failed to load repair details");
    }
  };

  const handleDeleteRepair = (repair: Repair) => {
    const apiRepair = apiRepairs.find((r) => String(r.id) === repair.id);
    setSelectedRepair(apiRepair || null);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateStatus = async (
    repair: Repair,
    newStatus: "pending" | "in_progress" | "completed" | "cancelled"
  ) => {
    try {
      await updateRepair(repair.id, { status: newStatus });
      toast.success(`Repair marked as ${newStatus.replace("_", " ")}`);
      loadRepairs();
    } catch (error) {
      console.error("Error updating repair status:", error);
      toast.error("Failed to update repair status");
    }
  };

  const handleFormSuccess = () => {
    loadRepairs();
  };

  const handleDeleteSuccess = () => {
    loadRepairs();
  };

  const handleViewEdit = () => {
    setIsViewModalOpen(false);
    if (selectedRepair) {
      setIsFormModalOpen(true);
    }
  };

  const handleViewDelete = () => {
    setIsViewModalOpen(false);
    if (selectedRepair) {
      setIsDeleteDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-5 p-4">
        <SiteHeader
          title="Repairs"
          subtitle="Track service tickets and keep technicians aligned."
        />
        <p className="text-muted-foreground">Loading repairs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-5 p-4">
        <SiteHeader
          title="Repairs"
          subtitle="Track service tickets and keep technicians aligned."
        />
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <SiteHeader
        title="Repairs"
        subtitle="Track service tickets and keep technicians aligned."
      />

      <RepairsStats repairs={repairs} />

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between text-2xl font-bold">
            Repair tickets
            <Button onClick={handleAddRepair}>
              <Plus className="mr-2 h-4 w-4" />
              New repair
            </Button>
          </CardTitle>
          <CardDescription>
            Track and manage device repairs and service tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RepairsTable
            repairs={repairs}
            onView={handleViewRepair}
            onEdit={handleEditRepair}
            onDelete={handleDeleteRepair}
            onUpdateStatus={handleUpdateStatus}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <RepairFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        repair={selectedRepair}
        onSuccess={handleFormSuccess}
      />

      <ViewRepairModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        repair={selectedRepair}
        onEdit={handleViewEdit}
        onDelete={handleViewDelete}
      />

      <DeleteRepairDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        repair={selectedRepair}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}

export default RepairsPage;
