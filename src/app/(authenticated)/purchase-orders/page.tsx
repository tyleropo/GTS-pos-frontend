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
import { fetchPurchaseOrders } from "@/src/lib/api/purchase-orders";
import { useEffect, useState } from "react";
import type { PurchaseOrder } from "@/src/types/purchaseOrder";
import { adaptPurchaseOrder } from "@/src/lib/adapters";

function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPurchaseOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchPurchaseOrders();
        const adapted = response.data.map(adaptPurchaseOrder);
        setPurchaseOrders(adapted);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load purchase orders");
        console.error("Error loading purchase orders:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPurchaseOrders();
  }, []);

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
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <SiteHeader
        title="Purchase orders"
        subtitle="Review vendor commitments and initiate new replenishment orders."
      />
      <div className="p-4">
        <PurchaseOrderStats purchaseOrders={purchaseOrders} />
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex justify-between">
              Purchase order list
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New purchase order
              </Button>
            </CardTitle>
            <CardDescription>
              Manage your purchase orders and vendor commitments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PurchaseOrderTable purchaseOrders={purchaseOrders} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PurchaseOrdersPage;
