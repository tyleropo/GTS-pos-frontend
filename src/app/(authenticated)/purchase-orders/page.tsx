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
import { purchaseOrders } from "@/src/data/mockPurchaseOrders";
import PurchaseOrderStats from "./PurchaseOrderStats";
import PurchaseOrderTable from "./PurchaseOrderTable";

function PurchaseOrdersPage() {
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
              Inventory list
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New purchase order
              </Button>
            </CardTitle>
            <CardDescription>
              Manage your product inventory, stock levels, and pricing
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
