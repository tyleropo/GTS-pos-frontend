
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { BillingStatement, DocumentFormatSettings } from "@/src/types/billing";
import { formatCurrency } from "@/src/lib/billing";

export async function exportToXlsx(
  statement: BillingStatement,
  settings: DocumentFormatSettings
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Statement");

  // 1. Header Information
  worksheet.addRow([settings.companyName.toUpperCase()]);
  worksheet.addRow(["Billing Statement"]);
  worksheet.addRow([]);

  // Merge header cells
  worksheet.mergeCells("A1:E1");
  worksheet.mergeCells("A2:E2");

  // Style header
  worksheet.getCell("A1").font = { bold: true, size: 16 };
  worksheet.getCell("A2").font = { bold: true, size: 14 };
  worksheet.getCell("A1").alignment = { horizontal: "center" };
  worksheet.getCell("A2").alignment = { horizontal: "center" };

  // 2. Customer Info
  worksheet.addRow(["Bill To:"]);
  worksheet.addRow([statement.customer.name]);
  if (statement.customer.email) worksheet.addRow([statement.customer.email]);
  if (statement.customer.phone) worksheet.addRow([statement.customer.phone]);
  if (statement.customer.address) worksheet.addRow([statement.customer.address]);
  worksheet.addRow([]);

  worksheet.getCell("A4").font = { bold: true };

  // 3. Statement Period
  worksheet.addRow([
    "Period:",
    `${statement.period.startDate.toLocaleDateString()} - ${statement.period.endDate.toLocaleDateString()}`,
  ]);
  worksheet.addRow([]);

  // 4. Table Header
  const headerRowValues = ["Date", "Reference", "Description"];
  if (settings.showQuantity !== false) headerRowValues.push("Qty");
  if (settings.showUnitPrice !== false) headerRowValues.push("Unit Price");
  if (settings.showLineTotal !== false) headerRowValues.push("Amount");

  const headerRow = worksheet.addRow(headerRowValues);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.border = { bottom: { style: "thin" } };
  });

  // 5. Data Rows
  statement.lineItems.forEach((item) => {
    const rowValues = [
      new Date(item.date).toLocaleDateString(),
      item.referenceId,
      item.description,
    ];
    
    if (settings.showQuantity !== false) {
      rowValues.push(item.quantity?.toString() || "");
    }
    
    if (settings.showUnitPrice !== false) {
      // Clean string for Excel or use number
      rowValues.push(item.unitPrice ? item.unitPrice : "");
    }

    if (settings.showLineTotal !== false) {
       rowValues.push(item.amount);
    }

    const row = worksheet.addRow(rowValues);
    
    // Formatting numbers
    // Assuming Quantity is at index 4 (E), Price at 5 (F), Amount at 6 (G) if they exist
    // Need to dynamically determine column index
    let colIndex = 4;
    if (settings.showQuantity !== false) colIndex++;
    if (settings.showUnitPrice !== false) {
       row.getCell(colIndex).numFmt = '"₱"#,##0.00'; 
       colIndex++;
    }
    if (settings.showLineTotal !== false) {
       row.getCell(colIndex).numFmt = '"₱"#,##0.00';
    }
  });

  // 6. Subtotals and Total
  worksheet.addRow([]);
  
  // Calculate column index for total
  let totalColIndex = 3; // Date, Ref, Desc usually first 3
  if (settings.showQuantity !== false) totalColIndex++;
  if (settings.showUnitPrice !== false) totalColIndex++;
  if (settings.showLineTotal !== false) totalColIndex++; // Amount is the last one if visible, else...?
  // Actually, Total should align with Amount column.
  // If Amount is hidden, where do we put it? Usually Amount is required.
  // Let's assume Amount is always last.
  const amountColIndex = headerRowValues.length;

  // Add Grand Total
  const totalRow = worksheet.addRow([]);
  totalRow.getCell(amountColIndex - 1).value = "Grand Total:";
  totalRow.getCell(amountColIndex).value = statement.grandTotal;
  totalRow.getCell(amountColIndex).numFmt = '"₱"#,##0.00';
  totalRow.getCell(amountColIndex - 1).font = { bold: true };
  totalRow.getCell(amountColIndex).font = { bold: true };

  // Adjust column widths
  worksheet.columns.forEach((column) => {
    column.width = 15;
  });
  worksheet.getColumn(3).width = 40; // Description

  // Save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `Statement_${statement.customer.name.replace(/\s+/g, "_")}.xlsx`);
}
