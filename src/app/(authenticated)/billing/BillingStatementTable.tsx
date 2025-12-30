"use client";

import React, { forwardRef } from "react";
import { BillingStatement, DocumentFormatSettings } from "@/src/types/billing";
import { formatCurrency } from "@/src/lib/billing";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table";
import { Card, CardContent } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";

interface BillingStatementTableProps {
    statement: BillingStatement | null;
    settings?: DocumentFormatSettings;
}

const BillingStatementTable = forwardRef<HTMLDivElement, BillingStatementTableProps>(
    ({ statement, settings }, ref) => {
        if (!statement) {
            return (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <p>Select a customer and date range to generate a statement</p>
                    </CardContent>
                </Card>
            );
        }

        const showQuantity = settings?.showQuantity !== false;
        const showUnitPrice = settings?.showUnitPrice !== false;
        const showLineTotal = settings?.showLineTotal !== false;

        // Calculate columns span for subtotal row
        // Date + Ref + Desc + (Qty?) + (Price?) = 3 + ... 
        let colSpan = 3;
        if (showQuantity) colSpan++;
        if (showUnitPrice) colSpan++;

        if (statement.lineItems.length === 0) {
            return (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        <p>No transactions or repairs found for the selected period</p>
                    </CardContent>
                </Card>
            );
        }

        const repairItems = statement.lineItems.filter((item) => item.type === "repair");
        const productItems = statement.lineItems.filter((item) => item.type === "product");

        return (
            <div ref={ref} className="print:p-8">
                <Card className="print:shadow-none print:border-none">
                    <CardContent className="p-6">
                        {/* Company Name - visible in print and screen */}
                        {settings?.companyName && (
                            <div className="mb-4 print:mb-6 text-center">
                                <h2 className="text-xl font-bold print:text-2xl">{settings.companyName}</h2>
                            </div>
                        )}
                        
                        {/* Header Text - visible in print and screen */}
                        {settings?.headerText && (
                            <div className="mb-4 print:mb-6 text-center text-sm text-muted-foreground">
                                <p>{settings.headerText}</p>
                            </div>
                        )}
                        
                        {/* Header - visible in print and screen */}
                        <div className="mb-6 print:mb-8">
                            <h1 className="text-2xl font-bold print:text-3xl">Customer Statement</h1>
                            <p className="text-sm text-muted-foreground">
                                {format(statement.period.startDate, "MMM dd, yyyy")} -{" "}
                                {format(statement.period.endDate, "MMM dd, yyyy")}
                            </p>
                        </div>

                        {/* Customer Information */}
                        <div className="mb-6 print:mb-8">
                            <h2 className="text-lg font-semibold mb-2">Bill To:</h2>
                            <div className="text-sm space-y-1">
                                <p className="font-medium">{statement.customer.name}</p>
                                <p>{statement.customer.email}</p>
                                <p>{statement.customer.phone}</p>
                                <p>{statement.customer.address}</p>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Repairs & Services Section */}
                        {repairItems.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-md font-semibold mb-3 bg-muted p-2 rounded">
                                    Repairs & Services
                                </h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Date</TableHead>
                                            <TableHead className="w-[120px]">Reference</TableHead>
                                            <TableHead>Description</TableHead>
                                            {/* Repairs usually don't have qty/unit price in this context, just cost. 
                                                But let's respect columns if we want consistency, 
                                                though repair items might not have qty popualted. 
                                                Let's keep repairs simple as just Amount? 
                                                Or align columns? Aligning is better for visual consistency if mixed.
                                                But for now, repairs are distinct. Let's keep repairs simple or check usage.
                                                Repair item has 'cost'.
                                            */}
                                            <TableHead className="text-right w-[120px]">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {repairItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{format(new Date(item.date), "MM/dd/yyyy")}</TableCell>
                                                <TableCell className="font-mono text-xs">{item.referenceId}</TableCell>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(item.amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/50">
                                            <TableCell colSpan={3} className="text-right font-semibold">
                                                Subtotal (Repairs):
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(statement.repairSubtotal)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Products Section */}
                        {productItems.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-md font-semibold mb-3 bg-muted p-2 rounded">Products</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Date</TableHead>
                                            <TableHead className="w-[120px]">Reference</TableHead>
                                            <TableHead>Description</TableHead>
                                            {showQuantity && <TableHead className="text-right w-[80px]">Qty</TableHead>}
                                            {showUnitPrice && <TableHead className="text-right w-[100px]">Unit Price</TableHead>}
                                            {showLineTotal && <TableHead className="text-right w-[120px]">Amount</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {productItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{format(new Date(item.date), "MM/dd/yyyy")}</TableCell>
                                                <TableCell className="font-mono text-xs">{item.referenceId}</TableCell>
                                                <TableCell>{item.description}</TableCell>
                                                {showQuantity && (
                                                    <TableCell className="text-right">
                                                        {item.quantity || 1}
                                                    </TableCell>
                                                )}
                                                {showUnitPrice && (
                                                    <TableCell className="text-right">
                                                        {item.unitPrice ? formatCurrency(item.unitPrice) : "-"}
                                                    </TableCell>
                                                )}
                                                {showLineTotal && (
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(item.amount)}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/50">
                                            <TableCell colSpan={colSpan} className="text-right font-semibold">
                                                Subtotal (Products):
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(statement.productSubtotal)}
                                            </TableCell>
                                        </TableRow>

                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <Separator className="my-6" />

                        {/* Grand Total */}
                        <div className="flex justify-end">
                            <div className="bg-muted px-6 py-3 rounded-lg border-2 border-foreground">
                                <div className="flex items-center gap-8">
                                    <span className="text-base font-bold">GRAND TOTAL:</span>
                                    <span className="text-base font-bold">
                                        {formatCurrency(statement.grandTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer Text - visible in print and screen */}
                        {settings?.footerText && (
                            <div className="mt-6 print:mt-8 text-center text-sm text-muted-foreground border-t pt-4">
                                <p>{settings.footerText}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Print-specific styles */}
                <style jsx global>{`
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:p-8 {
              padding: 2rem;
            }
            .print\\:shadow-none {
              box-shadow: none;
            }
            .print\\:border-none {
              border: none;
            }
            .print\\:mb-8 {
              margin-bottom: 2rem;
            }
            .print\\:text-3xl {
              font-size: 1.875rem;
            }
          }
        `}</style>
            </div>
        );
    }
);

BillingStatementTable.displayName = "BillingStatementTable";

export default BillingStatementTable;
