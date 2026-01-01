import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Customer } from '@/src/types/customer';
import { formatCurrency } from "@/src/lib/format-currency";

const CustomerStats = ({customers}: {customers: Customer[]}) => {
  const totalCustomers = customers.length
  const activeCustomers = customers.filter((customer) => customer.status === "Active").length
  const vipCustomers = customers.filter((customer) => customer.type === "VIP").length
  const totalRevenue = customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0)

  return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalCustomers}</div>
          <p className="text-xs text-muted-foreground">
           Registered in the system
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{activeCustomers}</div>
          <p className="text-xs text-muted-foreground">{((activeCustomers / totalCustomers)*100).toFixed(1)} % of total</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0"> 
          <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{vipCustomers}</div>
          <p className="text-xs text-muted-foreground">
            {(((vipCustomers) / totalCustomers) *100).toFixed(1)}% fo total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">₱{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">From all customer purchases</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerStats