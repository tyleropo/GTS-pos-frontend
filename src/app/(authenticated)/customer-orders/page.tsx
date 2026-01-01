"use client";

import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { OrderPrint } from "@/src/components/print/OrderPrint";
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
import CustomerOrderStats from "./CustomerOrderStats";
import CustomerOrderTable from "./CustomerOrderTable";
import { CustomerOrderFormModal } from "./CustomerOrderFormModal";
import { DeleteCustomerOrderDialog } from "./DeleteCustomerOrderDialog";
import { FulfillCustomerOrderModal } from "./FulfillCustomerOrderModal";
import { PaymentFormModal } from "@/src/app/(authenticated)/payments/PaymentFormModal";
import { BulkPaymentModal } from "@/src/app/(authenticated)/payments/BulkPaymentModal";
import { fetchCustomerOrders, fetchCustomerOrder, cancelCustomerOrder } from "@/src/lib/api/customer-orders";
import type { CustomerOrder } from "@/src/types/customerOrder";
import type { CustomerOrder as APICustomerOrder } from "@/src/lib/api/customer-orders";
import { adaptCustomerOrder } from "@/src/lib/adapters";
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';



// TODO add a functionaility where a customer order is created it would automatically deduct the stocks from the inventory  
// we need to implement a feature where 
// 1. when a customer order is created it would automatically deduct the stocks from the inventory
// 2. when a customer order is fulfilled it would automatically add the stocks to the inventory 
// we also need to convert product  to cash ,
// check if the custom price affects the inventory
// how to resolve if there is a customer order but we dont have the product in the inventory and it is needed to be ordered 
function CustomerOrdersPage() {
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [apiCustomerOrders, setApiCustomerOrders] = useState<APICustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Modal states
// ...
  
  // Filter customer orders based on date range
  const filteredCustomerOrders = customerOrders.filter((order) => {
    if (!dateRange?.from) return true;
    
    const orderDate = new Date(order.date);
    if (dateRange.to) {
      return isWithinInterval(orderDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to)
      });
    } else {
      return isWithinInterval(orderDate, {
         start: startOfDay(dateRange.from),
         end: endOfDay(dateRange.from)
      });
    }
  });


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
      // The passed 'order' is the adapted one (now direct), so order.id is the ID
      const data = await fetchCustomerOrder(String(order.id));
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
      await cancelCustomerOrder(String(apiOrder.id));
      toast.success("Customer order cancelled");
      loadCustomerOrders();
    } catch (error) {
      console.error("Error cancelling customer order:", error);
      toast.error("Failed to cancel customer order");
    }
  };

  const handleDownloadPDF = (_order: CustomerOrder) => {
    // const apiOrder = apiCustomerOrders.find(p => String(p.id) === order.id);
    // if (!apiOrder) return;

    try {
      // generateCustomerOrderPDF(apiOrder);
      console.log(_order);
      toast.info("PDF generation not yet implemented");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  // Print Logic
  const [printingOrder, setPrintingOrder] = useState<CustomerOrder | APICustomerOrder | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintTrigger = useReactToPrint({
    contentRef: printRef,
    documentTitle: printingOrder ? `Order_${printingOrder.co_number || (printingOrder as any).id}` : "Customer_Order",
  });

  const handlePrint = async (order: CustomerOrder) => {
    try {
        const fullOrder = await fetchCustomerOrder(String(order.id));
        setPrintingOrder(fullOrder);
        setTimeout(() => {
            handlePrintTrigger();
        }, 500);
    } catch (error) {
        console.error("Error fetching CO for print:", error);
        toast.error("Failed to prepare print view");
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

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<CustomerOrder | null>(null);
  const [isBulkPaymentModalOpen, setIsBulkPaymentModalOpen] = useState(false);
  const [selectedOrdersForBulkPayment, setSelectedOrdersForBulkPayment] = useState<CustomerOrder[]>([]);

  const handleAddPayment = (order: CustomerOrder) => {
    setSelectedPaymentOrder(order);
    setIsPaymentModalOpen(true);
  };

  const handleBulkPayment = (orders: CustomerOrder[]) => {
    setSelectedOrdersForBulkPayment(orders);
    setIsBulkPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
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
        <CustomerOrderStats customerOrders={filteredCustomerOrders} />
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
              customerOrders={filteredCustomerOrders}
              onEdit={handleEditCustomerOrder}
              onDelete={handleDeleteCustomerOrder}
              onFulfill={handleFulfillCustomerOrder}
              onCancel={handleCancelOrder}
              onDownloadPDF={handleDownloadPDF}
              onAddPayment={handleAddPayment}
              onBulkPayment={handleBulkPayment}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onPrint={handlePrint}
            />
            {/* Hidden Print Component */}
            <div className="hidden">
                <OrderPrint ref={printRef} order={printingOrder} type="customer" />
            </div>
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

      <PaymentFormModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        defaultPayableId={selectedPaymentOrder ? String(selectedPaymentOrder.id) : undefined}
        defaultPayableType="customer_order"
        onSuccess={handlePaymentSuccess}
      />

      <BulkPaymentModal
        open={isBulkPaymentModalOpen}
        onOpenChange={setIsBulkPaymentModalOpen}
        orders={selectedOrdersForBulkPayment}
        orderType="customer_order"
        onSuccess={() => {
          setIsBulkPaymentModalOpen(false);
          setSelectedOrdersForBulkPayment([]);
          loadCustomerOrders();
        }}
      />
    </div>
  );
}

export default CustomerOrdersPage;
