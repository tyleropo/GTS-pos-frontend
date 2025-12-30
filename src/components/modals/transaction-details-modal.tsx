import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Transaction } from "@/src/types/transactions";
import { Printer, Settings } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { 
    ReceiptSettingsModal, 
    ReceiptSettings, 
    DEFAULT_RECEIPT_SETTINGS 
} from "@/src/components/modals/receipt-settings-modal";
import { TransactionReceipt } from "@/src/components/receipts/transaction-receipt";

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailsModal({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailsModalProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(DEFAULT_RECEIPT_SETTINGS);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Load settings on mount (or when modal opens)
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

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            Invoice: <span className="font-mono font-medium text-foreground">{transaction.invoice_number}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{transaction.date} {transaction.time}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium">{transaction.customer}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Method</p>
              <p className="font-medium">{transaction.paymentMethod}</p>
              {transaction.meta?.reference_number && (
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Ref: {transaction.meta.reference_number}
                  </p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium">{transaction.status}</p>
            </div>
            <div>
                <p className="text-muted-foreground">Cashier</p>
                <p className="font-medium">{transaction.cashier}</p>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaction.lineItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <span className="font-medium">{item.product_name}</span>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">₱{item.unit_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₱{item.line_total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-end gap-2 text-sm">
             {/* Note: Subtotal and Tax are not explicit in frontend Transaction type yet, calculating or inferring */}
             {/* Assuming tax is included or we just show total for now as per type definition */}
            <div className="flex w-full max-w-xs justify-between font-medium text-lg">
              <span>Total</span>
              <span>₱{transaction.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
           <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Customize Receipt
           </Button>
           <div className="flex gap-2">
               <Button variant="outline" onClick={() => handlePrint()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
               </Button>
               <Button onClick={() => onOpenChange(false)}>Close</Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ReceiptSettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        onSave={setReceiptSettings}
    />
    
    <div className="hidden">
        <TransactionReceipt ref={receiptRef} transaction={transaction} settings={receiptSettings} />
    </div>
    </>
  );
}
