import { SiteHeader } from "@/src/components/site-header";
import React from "react";
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
// TODO add a component for the add customer button
const Page = () => {
  return (
    <div>
      <SiteHeader title="Customers" />
      <div className="p-4">
        <CustomerStats customers={customers} />
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex justify-between">
              Customer Database
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
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
};

export default Page;
