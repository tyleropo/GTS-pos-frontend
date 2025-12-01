import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BillingStatement, DocumentFormatSettings } from "@/src/types/billing";
import { formatCurrency } from "../billing";
import { format } from "date-fns";

// Color schemes
const COLOR_SCHEMES = {
  default: { header: [66, 66, 66], accent: [240, 240, 240] },
  blue: { header: [41, 128, 185], accent: [224, 242, 255] },
  green: { header: [39, 174, 96], accent: [232, 255, 240] },
  monochrome: { header: [0, 0, 0], accent: [245, 245, 245] },
};

// Font sizes
const FONT_SIZES = {
  small: { title: 16, heading: 10, body: 8 },
  medium: { title: 20, heading: 12, body: 10 },
  large: { title: 24, heading: 14, body: 11 },
};

export function exportToPdf(
  statement: BillingStatement,
  formatSettings: DocumentFormatSettings
) {
  const colors =
    COLOR_SCHEMES[formatSettings.colorScheme] || COLOR_SCHEMES.default;
  const sizes = FONT_SIZES[formatSettings.fontSize] || FONT_SIZES.medium;
  const doc = new jsPDF({
    orientation: formatSettings.pageOrientation,
  });

  // Company Header
  doc.setFontSize(sizes.title);
  doc.setFont("helvetica", "bold");
  doc.text(formatSettings.companyName, 14, 20);

  // Custom header text if provided
  if (formatSettings.headerText) {
    doc.setFontSize(sizes.body);
    doc.setFont("helvetica", "italic");
    doc.text(formatSettings.headerText, 14, 26);
  }

  doc.setFontSize(sizes.heading);
  doc.setFont("helvetica", "normal");
  doc.text("Customer Statement", 14, formatSettings.headerText ? 32 : 28);

  // Customer Information
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, 45);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(statement.customer.name, 14, 52);
  doc.text(statement.customer.email, 14, 57);
  doc.text(statement.customer.phone, 14, 62);
  doc.text(statement.customer.address, 14, 67);

  // Statement Period
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Statement Period:", 140, 45);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${format(statement.period.startDate, "MMM dd, yyyy")} - ${format(
      statement.period.endDate,
      "MMM dd, yyyy"
    )}`,
    140,
    52
  );

  // Prepare table data
  const tableData: (string | number)[][] = [];

  // Add repair items
  const repairItems = statement.lineItems.filter(
    (item) => item.type === "repair"
  );
  if (repairItems.length > 0) {
    tableData.push([
      {
        content: "REPAIRS & SERVICES",
        colSpan: 4,
        styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
      },
    ] as any);
    repairItems.forEach((item) => {
      tableData.push([
        format(new Date(item.date), "MM/dd/yyyy"),
        item.referenceId,
        item.description,
        formatCurrency(item.amount),
      ]);
    });
    tableData.push([
      "",
      "",
      { content: "Subtotal (Repairs):", styles: { fontStyle: "bold" } },
      {
        content: formatCurrency(statement.repairSubtotal),
        styles: { fontStyle: "bold" },
      },
    ] as any);
  }

  // Add product items
  const productItems = statement.lineItems.filter(
    (item) => item.type === "product"
  );
  if (productItems.length > 0) {
    tableData.push([
      {
        content: "PRODUCTS",
        colSpan: 4,
        styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
      },
    ] as any);
    productItems.forEach((item) => {
      tableData.push([
        format(new Date(item.date), "MM/dd/yyyy"),
        item.referenceId,
        item.description,
        formatCurrency(item.amount),
      ]);
    });
    tableData.push([
      "",
      "",
      { content: "Subtotal (Products):", styles: { fontStyle: "bold" } },
      {
        content: formatCurrency(statement.productSubtotal),
        styles: { fontStyle: "bold" },
      },
    ] as any);
  }

  // Grand Total
  tableData.push([
    "",
    "",
    {
      content: "GRAND TOTAL:",
      styles: { fontStyle: "bold", fontSize: 11, fillColor: [230, 230, 230] },
    },
    {
      content: formatCurrency(statement.grandTotal),
      styles: { fontStyle: "bold", fontSize: 11, fillColor: [230, 230, 230] },
    },
  ] as any);

  // Generate table
  const startY = formatSettings.headerText ? 85 : 75;
  autoTable(doc, {
    startY,
    head: [["Date", "Reference", "Description", "Amount"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: colors.header as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: sizes.body,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 30 },
      2: { cellWidth: 95 },
      3: { cellWidth: 30, halign: "right" },
    },
    styles: {
      fontSize: sizes.body,
      cellPadding: 3,
    },
  });

  // Add footer if provided
  if (formatSettings.footerText) {
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(sizes.body);
    doc.setFont("helvetica", "italic");
    doc.text(formatSettings.footerText, 14, doc.internal.pageSize.height - 10);
  }

  // Save the PDF
  const fileName = `statement_${statement.customer.name.replace(
    /\s+/g,
    "_"
  )}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
}
