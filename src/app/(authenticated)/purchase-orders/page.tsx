"use client"

import React from 'react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/card";
import { SiteHeader } from "@/src/components/site-header";
import { Button } from '@/src/components/ui/button';
import { Plus } from 'lucide-react';
import { purchaseOrders } from '@/src/data/mockPurchaseOrders';
import PurchaseOrderStats from './PurchaseOrderStats';
import PurchaseOrderTable from './PurchaseOrderTable';
const Page = () => {
  // TODO Add a component for the New purchase order button
  return (
    <div>
      <SiteHeader title="Inventory Management" />
      <div className="p-4">
        <PurchaseOrderStats purchaseOrders = {purchaseOrders}/>
      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex justify-between">
            Inventory List
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
          </CardTitle>
          <CardDescription>
            Manage your product inventory, stock levels, and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
            <PurchaseOrderTable purchaseOrders={purchaseOrders}/>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

export default Page