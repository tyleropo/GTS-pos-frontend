"use client";

import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { FileText, Printer, Download } from "lucide-react";
import { BillingStatement, DocumentFormatSettings } from "@/src/types/billing";
import { exportToPdf } from "@/src/lib/export/exportToPdf";
import { exportToDocx } from "@/src/lib/export/exportToDocx";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { FormatSettingsDialog } from "./FormatSettingsDialog";

interface ExportButtonsProps {
    statement: BillingStatement | null;
    printRef: React.RefObject<HTMLDivElement | null>;
    formatSettings: DocumentFormatSettings;
    onFormatSettingsChange: (settings: DocumentFormatSettings) => void;
}

export function ExportButtons({
    statement,
    printRef,
    formatSettings,
    onFormatSettingsChange,
}: ExportButtonsProps) {
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isExportingDocx, setIsExportingDocx] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: statement
            ? `Statement_${statement.customer.name.replace(/\s+/g, "_")}`
            : "Statement",
    });

    const handleExportPdf = async () => {
        if (!statement) {
            toast.error("No statement to export");
            return;
        }

        try {
            setIsExportingPdf(true);
            exportToPdf(statement, formatSettings);
            toast.success("PDF exported successfully");
        } catch (error) {
            console.error("PDF export error:", error);
            toast.error("Failed to export PDF");
        } finally {
            setIsExportingPdf(false);
        }
    };

    const handleExportDocx = async () => {
        if (!statement) {
            toast.error("No statement to export");
            return;
        }

        try {
            setIsExportingDocx(true);
            await exportToDocx(statement, formatSettings);
            toast.success("DOCX exported successfully");
        } catch (error) {
            console.error("DOCX export error:", error);
            toast.error("Failed to export DOCX");
        } finally {
            setIsExportingDocx(false);
        }
    };

    const disabled = !statement || statement.lineItems.length === 0;

    return (
        <div className="flex gap-2 items-center print:hidden">
            <FormatSettingsDialog
                settings={formatSettings}
                onSettingsChange={onFormatSettingsChange}
            />
            <div className="border-l h-6 mx-1" />
            <Button
                onClick={handlePrint}
                disabled={disabled}
                variant="outline"
                className="gap-2"
            >
                <Printer className="h-4 w-4" />
                Print
            </Button>
            <Button
                onClick={handleExportPdf}
                disabled={disabled || isExportingPdf}
                variant="outline"
                className="gap-2"
            >
                <FileText className="h-4 w-4" />
                {isExportingPdf ? "Exporting..." : "Export PDF"}
            </Button>
            <Button
                onClick={handleExportDocx}
                disabled={disabled || isExportingDocx}
                variant="outline"
                className="gap-2"
            >
                <Download className="h-4 w-4" />
                {isExportingDocx ? "Exporting..." : "Export DOCX"}
            </Button>
        </div>
    );
}
