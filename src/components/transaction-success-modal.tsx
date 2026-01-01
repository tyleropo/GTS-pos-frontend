"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { CheckCircle2, Printer, ArrowRight, Settings } from "lucide-react";
import type { Transaction } from "@/src/lib/api/transactions";
import { adaptTransaction } from "@/src/lib/adapters";

import { useRef, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { 
    ReceiptSettingsModal, 
    ReceiptSettings, 
    DEFAULT_RECEIPT_SETTINGS 
} from "@/src/components/modals/receipt-settings-modal";
import { PosPrint } from "@/src/components/print/PosPrint";
import { useAuth } from "@/src/providers/auth-provider";

interface TransactionSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onNewSale: () => void;
}

export function TransactionSuccessModal({
  open,
  onOpenChange,
  transaction,
  onNewSale,
}: TransactionSuccessModalProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
      const saved = localStorage.getItem("pos_receipt_settings");
      if (saved) {
        try {
            setReceiptSettings(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to parse receipt settings", e);
        }
      }
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  if (!transaction) return null;

  const currency = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  });

  const {
    invoice_number,
    total,
    payment_method,
    items = [],
    customer,
  } = transaction;

  // Extract meta info safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (transaction.meta as any) || {};
  const amountTendered = meta.amount_tendered;
  const change = meta.change;

  // Adapt transaction for receipt component with user's first name
  const receiptTransaction = transaction ? adaptTransaction(transaction, user?.first_name) : null;
  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="rounded-full bg-green-100 p-3 mb-2">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <DialogTitle className="text-xl">Transaction Successful</DialogTitle>
          <DialogDescription>
            Invoice: <span className="font-medium text-foreground">{invoice_number}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="font-medium">{customer?.name || "Walk-in Customer"}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-medium capitalize">{payment_method}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                    {(() => {
                        const computedSubtotal = total / 1.12;
                        const computedTax = total - computedSubtotal;
                        return (
                            <>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Total Sales (VAT Inclusive)</span>
                                    <span>{currency.format(total)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Less: VAT 12%</span>
                                    <span>{currency.format(computedTax)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Net of VAT</span>
                                    <span>{currency.format(computedSubtotal)}</span>
                                </div>
                            </>
                        );
                    })()}
                    <div className="flex justify-between text-base font-semibold pt-1 border-t">
                        <span>TOTAL</span>
                        <span>{currency.format(total)}</span>
                    </div>
                </div>

                {payment_method === 'cash' && amountTendered !== undefined && (
                   <>
                     <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span>Amount Tendered</span>
                        <span>{currency.format(amountTendered)}</span>
                    </div>
                     <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Change</span>
                        <span>{currency.format(change || 0)}</span>
                    </div>
                   </>
                )}
            </div>

            <div className="text-center text-xs text-muted-foreground">
                {items.length} items purchased
            </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
           <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
           </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => handlePrint()}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
          <Button className="w-full sm:w-auto" onClick={onNewSale}>
            New Sale
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ReceiptSettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        onSave={setReceiptSettings}
    />
    
    <div className="hidden">
        {receiptTransaction && (
            <PosPrint ref={receiptRef} transaction={receiptTransaction} settings={receiptSettings} />
        )}
    </div>
    </>
  );
}
