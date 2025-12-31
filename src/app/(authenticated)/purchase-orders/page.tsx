"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/card";
import { SiteHeader } from "@/src/components/site-header";
import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";
import PurchaseOrderStats from "./PurchaseOrderStats";
import PurchaseOrderTable from "./PurchaseOrderTable";
import { PurchaseOrderFormModal } from "./PurchaseOrderFormModal";
import { DeletePurchaseOrderDialog } from "./DeletePurchaseOrderDialog";
import { FulfillPurchaseOrderModal } from "./FulfillPurchaseOrderModal";
import { fetchPurchaseOrders, updatePurchaseOrder, fetchPurchaseOrder } from "@/src/lib/api/purchase-orders";
import { useEffect, useState } from "react";
import type { PurchaseOrder } from "@/src/types/purchaseOrder";
import type { PurchaseOrder as APIPurchaseOrder } from "@/src/lib/api/purchase-orders";
import { adaptPurchaseOrder } from "@/src/lib/adapters";
import { toast } from "sonner";
import { generatePurchaseOrderPDF } from "./utils/pdf-generator";


//TODO:  Add feature where the incoming stocks are automatically added to the inventory but will prompt for more details like stocks etc. when an existing product it would add 
function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [apiPurchaseOrders, setApiPurchaseOrders] = useState<APIPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<APIPurchaseOrder | null>(null);

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchPurchaseOrders();
      const adapted = response.data.map(adaptPurchaseOrder);
      setPurchaseOrders(adapted);
      setApiPurchaseOrders(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load purchase orders");
      console.error("Error loading purchase orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const handleAddPurchaseOrder = () => {
    setSelectedPurchaseOrder(null);
    setIsFormModalOpen(true);
  };

  const handleEditPurchaseOrder = async (po: PurchaseOrder) => {
    try {
      // Find the ID from the local list first to verify it exists or get the ID string
      // The passed 'po' is the adapted one, so po.id is the string ID
      const data = await fetchPurchaseOrder(po.id);
      setSelectedPurchaseOrder(data);
      setIsFormModalOpen(true);
    } catch (error) {
      console.error("Error fetching purchase order details:", error);
      toast.error("Failed to load purchase order details");
    }
  };

  const handleDeletePurchaseOrder = (po: PurchaseOrder) => {
    const apiPO = apiPurchaseOrders.find(p => String(p.id) === po.id);
    setSelectedPurchaseOrder(apiPO || null);
    setIsDeleteDialogOpen(true);
  };

  const handleFulfillPurchaseOrder = (po: PurchaseOrder) => {
    const apiPO = apiPurchaseOrders.find(p => String(p.id) === po.id);
    setSelectedPurchaseOrder(apiPO || null);
    setIsFulfillModalOpen(true);
  };



  const handleCancelOrder = async (po: PurchaseOrder) => {
    const apiPO = apiPurchaseOrders.find(p => String(p.id) === po.id);
    if (!apiPO) return;

    try {
      await updatePurchaseOrder(String(apiPO.id), { status: "cancelled" });
      toast.success("Supplier order cancelled");
      loadPurchaseOrders();
    } catch (error) {
      console.error("Error cancelling purchase order:", error);
      toast.error("Failed to cancel purchase order");
    }
  };

  const handleDownloadPDF = (po: PurchaseOrder) => {
    const apiPO = apiPurchaseOrders.find(p => String(p.id) === po.id);
    if (!apiPO) return;

    try {
      generatePurchaseOrderPDF(apiPO);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleFormSuccess = () => {
    loadPurchaseOrders();
  };

  const handleDeleteSuccess = () => {
    loadPurchaseOrders();
  };

  const handleFulfillSuccess = () => {
    loadPurchaseOrders();
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        <SiteHeader
          title="Purchase orders"
          subtitle="Review vendor commitments and initiate new replenishment orders."
        />
        <div className="p-4">
          <p className="text-muted-foreground">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <SiteHeader
          title="Purchase orders"
          subtitle="Review vendor commitments and initiate new replenishment orders."
        />
        <div className="p-4">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={loadPurchaseOrders} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <SiteHeader
        title="Purchase orders"
        subtitle="Manage purchase orders and track fulfillment status."
      />
      <div className="p-4">
        <PurchaseOrderStats purchaseOrders={purchaseOrders} />
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex justify-between">
              Supplier order list
              <Button onClick={handleAddPurchaseOrder}>
                <Plus className="mr-2 h-4 w-4" />
                New Purchase order
              </Button>
            </CardTitle>
            <CardDescription>
              Manage your purchase orders and fulfillment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PurchaseOrderTable
              purchaseOrders={purchaseOrders}
              onEdit={handleEditPurchaseOrder}
              onDelete={handleDeletePurchaseOrder}
              onReceive={handleFulfillPurchaseOrder}
              onCancel={handleCancelOrder}
              onDownloadPDF={handleDownloadPDF}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <PurchaseOrderFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        purchaseOrder={selectedPurchaseOrder || undefined}
        onSuccess={handleFormSuccess}
      />

      <DeletePurchaseOrderDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        purchaseOrder={selectedPurchaseOrder}
        onSuccess={handleDeleteSuccess}
      />

      <FulfillPurchaseOrderModal
        open={isFulfillModalOpen}
        onOpenChange={setIsFulfillModalOpen}
        purchaseOrder={selectedPurchaseOrder}
        onSuccess={handleFulfillSuccess}
      />
    </div>
  );
}

export default PurchaseOrdersPage;
