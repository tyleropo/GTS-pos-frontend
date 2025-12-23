import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { PurchaseOrder } from '@/src/types/purchaseOrder';

const PurchaseOrderStats = ({purchaseOrders} : {purchaseOrders:PurchaseOrder[] }) => {
  const totalPOs = purchaseOrders.length
  const pendingPOs = purchaseOrders.filter((po) => po.status === "Pending" || po.status === "Draft").length
  const processingPOs = purchaseOrders.filter((po) => po.status === "Processing" || po.status === "Submitted").length
  const completedPOs = purchaseOrders.filter((po) => po.status === "Completed" || po.status === "Delivered" || po.status === "Received").length

  return (
     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Orders Card */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPOs}</div>
          <p className="text-xs text-muted-foreground">All purchase orders</p>
        </CardContent>
      </Card>

      {/* Pending Orders Card */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingPOs}</div>
          <p className="text-xs text-muted-foreground">Orders pending processing</p>
        </CardContent>
      </Card>

      {/* Processing Orders Card */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Processing Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{processingPOs}</div>
          <p className="text-xs text-muted-foreground">Orders being prepared</p>
        </CardContent>
      </Card>

      {/* Completed Orders Card */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Delivered Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedPOs}</div>
          <p className="text-xs text-muted-foreground">Orders successfully delivered</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default PurchaseOrderStats