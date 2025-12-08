"use client";

import { SiteHeader } from "@/src/components/site-header";
import { customers } from "@/src/data/mockCustomers";
import { CustomerTable } from "./CustomerTable";
import CustomerStats from "./CustomerStats";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";

function CustomersPage() {
  return (
    <div className="flex flex-col">
      <SiteHeader
        title="Customers"
        subtitle="Review customer health, lifetime value, and relationship status."
      />
      <div className="p-4">
        <CustomerStats customers={customers} />
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="flex justify-between text-2xl font-bold">
              Customer database
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add customer
              </Button>
            </CardTitle>
            <CardDescription>
              Manage your customer database and purchase history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerTable customers={customers} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CustomersPage;
