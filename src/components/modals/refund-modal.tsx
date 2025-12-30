"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Transaction } from "@/src/types/transactions";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface RefundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onRefundSuccess?: () => void;
}

export function RefundModal({
  open,
  onOpenChange,
  transaction,
  onRefundSuccess,
}: RefundModalProps) {
  const [reason, setReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  const handleRefund = async () => {
    if (!transaction || !reason.trim()) {
      toast.error("Please provide a refund reason");
      return;
    }

    setIsRefunding(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/transactions/${transaction.id}/refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Refund failed");
      }

      const data = await response.json();
      toast.success(data.message || "Transaction refunded successfully");
      setReason("");
      onOpenChange(false);
      onRefundSuccess?.();
    } catch (error) {
      console.error("Refund error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process refund");
    } finally {
      setIsRefunding(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            This action will refund the transaction and restore inventory levels.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Alert */}
          <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900">This action cannot be undone</p>
              <p className="text-yellow-700 mt-1">
                Stock quantities will be restored for all items in this transaction.
              </p>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-2 rounded-lg border p-4 bg-muted/30">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invoice:</span>
              <span className="font-medium">{transaction.invoice_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Customer:</span>
              <span className="font-medium">{transaction.customer}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-bold text-lg">₱{transaction.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Refund Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Refund Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., Damaged product, Customer request, Wrong item..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRefunding}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRefund}
            disabled={isRefunding || !reason.trim()}
          >
            {isRefunding ? "Processing..." : "Confirm Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
