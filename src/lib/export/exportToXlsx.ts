
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
  if (settings.headerText) {
    worksheet.addRow([settings.headerText]);
  }
  worksheet.addRow(["Billing Statement"]);
  worksheet.addRow([]);

  // Merge header cells
  const billStatementRow = settings.headerText ? 3 : 2;
  worksheet.mergeCells("A1:G1");
  if (settings.headerText) {
    worksheet.mergeCells("A2:G2");
  }
  worksheet.mergeCells(`A${billStatementRow}:G${billStatementRow}`);

  // Style header
  worksheet.getCell("A1").font = { bold: true, size: 16 };
  worksheet.getCell("A1").alignment = { horizontal: "center" };
  if (settings.headerText) {
    worksheet.getCell("A2").font = { italic: true, size: 11 };
    worksheet.getCell("A2").alignment = { horizontal: "center" };
  }
  worksheet.getCell(`A${billStatementRow}`).font = { bold: true, size: 14 };
  worksheet.getCell(`A${billStatementRow}`).alignment = { horizontal: "center" };

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
  const headerRowValues = ["Date", "Reference", "Product", "Description"];
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
      item.itemDescription || "", // Add secondary description
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
    // Assuming Quantity is at index 5 (E), Price at 6 (F), Amount at 7 (G) with new column
    let colIndex = 5;
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
  // Date, Ref, Prod, Desc = 4 columns
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
  worksheet.getColumn(3).width = 30; // Product
  worksheet.getColumn(4).width = 40; // Description

  // Save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `Statement_${statement.customer.name.replace(/\s+/g, "_")}.xlsx`);
}
