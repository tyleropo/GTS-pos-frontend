"use client";

import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { OrderPrint } from "@/src/components/print/OrderPrint";
import { useSearchParams } from "next/navigation";
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
import { toast } from "sonner";
import PurchaseOrderStats from "./PurchaseOrderStats";
import PurchaseOrderTable from "./PurchaseOrderTable";
import { PurchaseOrderFormModal } from "./PurchaseOrderFormModal";
import { DeletePurchaseOrderDialog } from "./DeletePurchaseOrderDialog";
import { FulfillPurchaseOrderModal } from "./FulfillPurchaseOrderModal";
import { PaymentFormModal } from "@/src/app/(authenticated)/payments/PaymentFormModal";
import { BulkPaymentModal } from "@/src/app/(authenticated)/payments/BulkPaymentModal";

import { fetchPurchaseOrders, updatePurchaseOrder, fetchPurchaseOrder } from "@/src/lib/api/purchase-orders";
import type { PurchaseOrder } from "@/src/types/purchaseOrder";
import type { PurchaseOrder as APIPurchaseOrder } from "@/src/lib/api/purchase-orders";
import { adaptPurchaseOrder } from "@/src/lib/adapters";
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';

function PurchaseOrdersPage() {
  const searchParams = useSearchParams();
  const searchParam = searchParams.get('search');
  const supplierParam = searchParams.get('supplier');

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [apiPurchaseOrders, setApiPurchaseOrders] = useState<APIPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Modal states
// ...
  
  // Filter purchase orders based on date range
  const filteredPurchaseOrders = purchaseOrders.filter((po) => {
    if (!dateRange?.from) return true;
    
    const poDate = new Date(po.date);
    if (dateRange.to) {
      return isWithinInterval(poDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to)
      });
    } else {
      return isWithinInterval(poDate, {
         start: startOfDay(dateRange.from),
         end: endOfDay(dateRange.from)
      });
    }
  });


  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBulkPaymentModalOpen, setIsBulkPaymentModalOpen] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<APIPurchaseOrder | null>(null);
  const [selectedOrdersForBulkPayment, setSelectedOrdersForBulkPayment] = useState<PurchaseOrder[]>([]);

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

  const handleDownloadPDF = (_po: PurchaseOrder) => {
    // const apiPO = apiPurchaseOrders.find(p => String(p.id) === po.id);
    // if (!apiPO) return;

    try {
      // generatePurchaseOrderPDF(apiPO);
      console.log(_po);
      toast.info("PDF generation not yet implemented");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  // Print Logic
  // Print Logic
  const [printingOrder, setPrintingOrder] = useState<PurchaseOrder | APIPurchaseOrder | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintTrigger = useReactToPrint({
    contentRef: printRef,
    documentTitle: printingOrder ? `PO_${printingOrder.po_number || (printingOrder as any).id}` : "Purchase_Order",
  });

  const handlePrint = async (po: PurchaseOrder) => {
    try {
        const fullOrder = await fetchPurchaseOrder(po.id);
        setPrintingOrder(fullOrder);
        setTimeout(() => {
            handlePrintTrigger();
        }, 500); // Increased timeout significantly to ensure rendering
    } catch (error) {
        console.error("Error fetching PO for print:", error);
        toast.error("Failed to prepare print view");
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

  const handleAddPayment = (po: PurchaseOrder) => {
    const apiPO = apiPurchaseOrders.find(p => String(p.id) === po.id);
    setSelectedPurchaseOrder(apiPO || null);
    setIsPaymentModalOpen(true);
  };

  const handleBulkPayment = (orders: PurchaseOrder[]) => {
    setSelectedOrdersForBulkPayment(orders);
    setIsBulkPaymentModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        <SiteHeader
          title="Purchases"
          subtitle="Review vendor commitments and initiate new replenishment orders."
        />
        <div className="p-4">
          <p className="text-muted-foreground">Loading purchases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <SiteHeader
          title="Purchases"
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
        title="Purchases"
        subtitle="Manage purchases and track fulfillment status."
      />
      <div className="p-4">
        <PurchaseOrderStats purchaseOrders={filteredPurchaseOrders} />
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex justify-between">
              Purchases list
              <Button onClick={handleAddPurchaseOrder}>
                <Plus className="mr-2 h-4 w-4" />
                New Purchases
              </Button>
            </CardTitle>
            <CardDescription>
              Manage your purchases and fulfillment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PurchaseOrderTable
              purchaseOrders={filteredPurchaseOrders}
              onEdit={handleEditPurchaseOrder}
              onDelete={handleDeletePurchaseOrder}
              onReceive={handleFulfillPurchaseOrder}
              onCancel={handleCancelOrder}
              onDownloadPDF={handleDownloadPDF}
              onAddPayment={handleAddPayment}
              onBulkPayment={handleBulkPayment}
              initialSearchQuery={searchParam || supplierParam || ""}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onPrint={handlePrint}
            />
            {/* Hidden Print Component */}
            <div className="hidden">
                <OrderPrint ref={printRef} order={printingOrder} type="purchase" />
            </div>
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

      <PaymentFormModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        defaultPayableId={selectedPurchaseOrder ? String(selectedPurchaseOrder.id) : undefined}
        defaultPayableType="purchase_order"
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          loadPurchaseOrders();
        }}
      />

      <BulkPaymentModal
        open={isBulkPaymentModalOpen}
        onOpenChange={setIsBulkPaymentModalOpen}
        orders={selectedOrdersForBulkPayment}
        orderType="purchase_order"
        onSuccess={() => {
          setIsBulkPaymentModalOpen(false);
          setSelectedOrdersForBulkPayment([]);
          loadPurchaseOrders();
        }}
      />
    </div>
  );
}

export default PurchaseOrdersPage;
