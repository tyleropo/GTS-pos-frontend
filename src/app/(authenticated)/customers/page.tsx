"use client";

import { SiteHeader } from "@/src/components/site-header";
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
import { fetchCustomers } from "@/src/lib/api/customers";
import { useEffect, useState } from "react";
import type { Customer } from "@/src/types/customer";
import { adaptCustomer } from "@/src/lib/adapters";

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchCustomers();
        const adapted = response.data.map(adaptCustomer);
        setCustomers(adapted);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load customers");
        console.error("Error loading customers:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col">
        <SiteHeader
          title="Customers"
          subtitle="Review customer health, lifetime value, and relationship status."
        />
        <div className="p-4">
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <SiteHeader
          title="Customers"
          subtitle="Review customer health, lifetime value, and relationship status."
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
