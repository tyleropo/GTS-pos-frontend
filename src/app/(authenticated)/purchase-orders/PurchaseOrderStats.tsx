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
  const pendingPOs = purchaseOrders.filter((po) => po.status === "Pending").length
  const processingPOs = purchaseOrders.filter((po) => po.status === "Processing").length
  const completedPOs = purchaseOrders.filter((po) => po.status === "Completed").length

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
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingPOs}</div>
          <p className="text-xs text-muted-foreground">Awaiting processing</p>
        </CardContent>
      </Card>

      {/* Processing Orders Card */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{processingPOs}</div>
          <p className="text-xs text-muted-foreground">In progress</p>
        </CardContent>
      </Card>

      {/* Completed Orders Card */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedPOs}</div>
          <p className="text-xs text-muted-foreground">Successfully delivered</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default PurchaseOrderStats