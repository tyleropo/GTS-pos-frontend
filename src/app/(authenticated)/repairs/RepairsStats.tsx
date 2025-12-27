import { Repair } from '@/src/types/repair';
import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

const RepairsStats = ({repairs} : {repairs: Repair[]}) => {

  const totalRepairs = repairs.length;
  const inProgressRepairs = repairs.filter(
    (r) =>
      r.status === "In Progress" ||
      r.status === "Diagnostic" ||
      r.status === "Waiting for Parts"
  ).length;
  const completedRepairs = repairs.filter((r) => r.status === "Completed").length;
  const totalRevenue = repairs
    .filter((r) => r.status === "Completed")
    .reduce((sum, r) => sum + r.cost, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Repairs */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Repairs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRepairs}</div>
          <p className="text-xs text-muted-foreground">All repair tickets</p>
        </CardContent>
      </Card>

      {/* In-Progress Repairs */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inProgressRepairs}</div>
          <p className="text-xs text-muted-foreground">Active repair tickets</p>
        </CardContent>
      </Card>

      {/* Completed Repairs */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedRepairs}</div>
          <p className="text-xs text-muted-foreground">Finished repairs</p>
        </CardContent>
      </Card>

      {/* Total Revenue */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₱{totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">From completed repairs</p>
        </CardContent>
      </Card>
    </div>
  )

}

export default RepairsStats