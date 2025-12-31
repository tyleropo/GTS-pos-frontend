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
import CustomerOrderStats from "./CustomerOrderStats";
import CustomerOrderTable from "./CustomerOrderTable";
import { CustomerOrderFormModal } from "./CustomerOrderFormModal";
import { DeleteCustomerOrderDialog } from "./DeleteCustomerOrderDialog";
import { FulfillCustomerOrderModal } from "./FulfillCustomerOrderModal";
import { fetchCustomerOrders, updateCustomerOrder, fetchCustomerOrder } from "@/src/lib/api/customer-orders";
import { useEffect, useState } from "react";
import type { CustomerOrder } from "@/src/types/customerOrder";
import type { CustomerOrder as APICustomerOrder } from "@/src/lib/api/customer-orders";
import { adaptCustomerOrder } from "@/src/lib/adapters";
import { toast } from "sonner";
import { generateCustomerOrderPDF } from "./utils/pdf-generator";

function CustomerOrdersPage() {
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [apiCustomerOrders, setApiCustomerOrders] = useState<APICustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [selectedCustomerOrder, setSelectedCustomerOrder] = useState<APICustomerOrder | null>(null);

  const loadCustomerOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchCustomerOrders();
      const adapted = response.data.map(adaptCustomerOrder);
      setCustomerOrders(adapted);
      setApiCustomerOrders(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customer orders");
      console.error("Error loading customer orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerOrders();
  }, []);

  const handleAddCustomerOrder = () => {
    setSelectedCustomerOrder(null);
    setIsFormModalOpen(true);
  };

  const handleEditCustomerOrder = async (order: CustomerOrder) => {
    try {
      // Find the ID from the local list first to verify it exists or get the ID string
      // The passed 'order' is the adapted one, so order.id is the string ID
      const data = await fetchCustomerOrder(order.id);
      setSelectedCustomerOrder(data);
      setIsFormModalOpen(true);
    } catch (error) {
      console.error("Error fetching customer order details:", error);
      toast.error("Failed to load customer order details");
    }
  };

  const handleDeleteCustomerOrder = (order: CustomerOrder) => {
    const apiOrder = apiCustomerOrders.find(p => String(p.id) === order.id);
    setSelectedCustomerOrder(apiOrder || null);
    setIsDeleteDialogOpen(true);
  };

  const handleFulfillCustomerOrder = (order: CustomerOrder) => {
    const apiOrder = apiCustomerOrders.find(p => String(p.id) === order.id);
    setSelectedCustomerOrder(apiOrder || null);
    setIsFulfillModalOpen(true);
  };



  const handleCancelOrder = async (order: CustomerOrder) => {
    const apiOrder = apiCustomerOrders.find(p => String(p.id) === order.id);
    if (!apiOrder) return;

    try {
      await updateCustomerOrder(String(apiOrder.id), { status: "cancelled" });
      toast.success("Customer order cancelled");
      loadCustomerOrders();
    } catch (error) {
      console.error("Error cancelling customer order:", error);
      toast.error("Failed to cancel customer order");
    }
  };

  const handleDownloadPDF = (order: CustomerOrder) => {
    const apiOrder = apiCustomerOrders.find(p => String(p.id) === order.id);
    if (!apiOrder) return;

    try {
      generateCustomerOrderPDF(apiOrder);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleFormSuccess = () => {
    loadCustomerOrders();
  };

  const handleDeleteSuccess = () => {
    loadCustomerOrders();
  };

  const handleFulfillSuccess = () => {
    loadCustomerOrders();
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        <SiteHeader
          title="Customer orders"
          subtitle="Manage customer orders and track fulfillment status."
        />
        <div className="p-4">
          <p className="text-muted-foreground">Loading customer orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <SiteHeader
          title="Customer orders"
          subtitle="Manage customer orders and track fulfillment status."
        />
        <div className="p-4">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={loadCustomerOrders} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <SiteHeader
        title="Customer orders"
        subtitle="Manage customer orders and track fulfillment status."
      />
      <div className="p-4">
        <CustomerOrderStats customerOrders={customerOrders} />
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex justify-between">
              Customer order list
              <Button onClick={handleAddCustomerOrder}>
                <Plus className="mr-2 h-4 w-4" />
                New customer order
              </Button>
            </CardTitle>
            <CardDescription>
              Manage your customer orders and fulfillment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerOrderTable
              customerOrders={customerOrders}
              onEdit={handleEditCustomerOrder}
              onDelete={handleDeleteCustomerOrder}
              onFulfill={handleFulfillCustomerOrder}
              onCancel={handleCancelOrder}
              onDownloadPDF={handleDownloadPDF}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CustomerOrderFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        customerOrder={selectedCustomerOrder || undefined}
        onSuccess={handleFormSuccess}
      />

      <DeleteCustomerOrderDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        customerOrder={selectedCustomerOrder}
        onSuccess={handleDeleteSuccess}
      />

      <FulfillCustomerOrderModal
        open={isFulfillModalOpen}
        onOpenChange={setIsFulfillModalOpen}
        customerOrder={selectedCustomerOrder}
        onSuccess={handleFulfillSuccess}
      />
    </div>
  );
}

export default CustomerOrdersPage;
