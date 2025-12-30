"use client";

import { SiteHeader } from "@/src/components/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";
import PaymentsTable from "./PaymentsTable";
import PaymentStats from "./PaymentStats";
import { PaymentFormModal } from "./PaymentFormModal";
import { useQuery } from "@tanstack/react-query";
import { fetchPayments, type Payment as APIPayment } from "@/src/lib/api/payments";
import { useState } from "react";

function PaymentsPage() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<APIPayment | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["payments"],
    queryFn: () => fetchPayments({ per_page: 100 }),
  });

  const handleAddPayment = () => {
    setSelectedPayment(null);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    // Query will auto-refetch due to invalidation in the modal
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 p-4">
        <SiteHeader
          title="Payments"
          subtitle="Track customer payments and deposits for orders"
        />
        <p className="text-muted-foreground">Loading payments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-5 p-4">
        <SiteHeader
          title="Payments"
          subtitle="Track customer payments and deposits for orders"
        />
        <p className="text-destructive">Error: {(error as Error).message}</p>
      </div>
    );
  }

  const payments = data?.data || [];

  return (
    <div className="flex flex-col gap-5 p-4">
      <SiteHeader
        title="Payments"
        subtitle="Track customer payments and deposits for orders"
      />

      <PaymentStats payments={payments} />

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between text-2xl font-bold">
            Payment Records
            <Button onClick={handleAddPayment}>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </CardTitle>
          <CardDescription>
            View and manage payment receipts and deposit status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentsTable />
        </CardContent>
      </Card>

      {/* Modals */}
      <PaymentFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        payment={selectedPayment}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}

export default PaymentsPage;
