import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CustomerOrder as APICustomerOrder } from "@/src/lib/api/purchase-orders";

export function generateCustomerOrderPDF(customerOrder: APICustomerOrder) {
    const doc = new jsPDF();

    // Add company header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER ORDER", 105, 20, { align: "center" });

    // Add PO details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`PO Number: ${customerOrder.co_number}`, 20, 35);
    doc.text(
        `Date: ${customerOrder.created_at ? new Date(customerOrder.created_at).toLocaleDateString() : "N/A"}`,
        20,
        42
    );
    doc.text(
        `Status: ${customerOrder.status.charAt(0).toUpperCase() + customerOrder.status.slice(1)}`,
        20,
        49
    );

    // Customer information
    doc.setFont("helvetica", "bold");
    doc.text("Customer:", 20, 60);
    doc.setFont("helvetica", "normal");
    doc.text(
        customerOrder.supplier?.company_name ||
            customerOrder.supplier?.supplier_code ||
            "Unknown Supplier",
        20,
        67
    );

    // Use type assertion for supplier with full properties
    const supplier = customerOrder.supplier as any;
    if (supplier?.contact_person) {
        doc.text(`Contact: ${supplier.contact_person}`, 20, 74);
    }
    if (supplier?.phone) {
        doc.text(`Phone: ${supplier.phone}`, 20, 81);
    }
    if (supplier?.email) {
        doc.text(`Email: ${supplier.email}`, 20, 88);
    }

    // Delivery date
    if (customerOrder.expected_at) {
        doc.setFont("helvetica", "bold");
        doc.text("Delivery Date:", 120, 60);
        doc.setFont("helvetica", "normal");
        doc.text(new Date(customerOrder.expected_at).toLocaleDateString(), 120, 67);
    }

    // Line items table
    const tableStartY = 100;
    const items = customerOrder.items || [];
    const tableData = items.map((item) => [
        item.product_name || item.product_id,
        item.quantity_ordered.toString(),
        item.quantity_received?.toString() || "0",
        `$${item.unit_cost.toFixed(2)}`,
        `$${item.line_total.toFixed(2)}`,
    ]);

    autoTable(doc, {
        startY: tableStartY,
        head: [["Product", "Qty Ordered", "Qty Shipped", "Unit Cost", "Total"]],
        body: tableData,
        theme: "grid",
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: "bold",
        },
        styles: {
            fontSize: 9,
        },
        columnStyles: {
            1: { halign: "center" },
            2: { halign: "center" },
            3: { halign: "right" },
            4: { halign: "right" },
        },
    });

    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 50;

    // Totals
    const totalsStartY = finalY + 10;
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", 140, totalsStartY);
    doc.text(`$${customerOrder.subtotal.toFixed(2)}`, 180, totalsStartY, { align: "right" });

    doc.text("Tax:", 140, totalsStartY + 7);
    doc.text(`$${customerOrder.tax.toFixed(2)}`, 180, totalsStartY + 7, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Total:", 140, totalsStartY + 15);
    doc.text(`$${customerOrder.total.toFixed(2)}`, 180, totalsStartY + 15, { align: "right" });

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
        "Thank you for your order!",
        105,
        280,
        { align: "center" }
    );

    // Download the PDF
    doc.save(`PO-${customerOrder.co_number}.pdf`);
}
