import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  AlignmentType,
  TextRun,
  HeadingLevel,
  BorderStyle,
  PageOrientation,
} from "docx";
import { BillingStatement, DocumentFormatSettings } from "@/src/types/billing";
import { formatCurrency } from "../billing";
import { format } from "date-fns";

export async function exportToDocx(
  statement: BillingStatement,
  formatSettings: DocumentFormatSettings
) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Company Name
          new Paragraph({
            text: formatSettings.companyName,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 100 },
          }),

          // Header text if provided
          ...(formatSettings.headerText
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: formatSettings.headerText,
                      italics: true,
                    }),
                  ],
                  spacing: { after: 100 },
                }),
              ]
            : []),

          // Document Title
          new Paragraph({
            text: "Customer Statement",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 300 },
          }),

          // Bill To Section
          new Paragraph({
            children: [new TextRun({ text: "Bill To:", bold: true })],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: statement.customer.name,
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: statement.customer.email,
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: statement.customer.phone,
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: statement.customer.address,
            spacing: { after: 200 },
          }),

          // Statement Period
          new Paragraph({
            children: [
              new TextRun({ text: "Statement Period: ", bold: true }),
              new TextRun({
                text: `${format(
                  statement.period.startDate,
                  "MMM dd, yyyy"
                )} - ${format(statement.period.endDate, "MMM dd, yyyy")}`,
              }),
            ],
            spacing: { after: 300 },
          }),

          // Main Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Header Row
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: "Date",
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: { fill: "424242" },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: "Reference",
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: { fill: "424242" },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: "Description",
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: { fill: "424242" },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: "Amount",
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: { fill: "424242" },
                  }),
                ],
              }),

              // Repairs Section Header
              ...(statement.lineItems.filter((item) => item.type === "repair")
                .length > 0
                ? [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "REPAIRS & SERVICES",
                                  bold: true,
                                }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          columnSpan: 4,
                          shading: { fill: "F0F0F0" },
                        }),
                      ],
                    }),
                  ]
                : []),

              // Repair Items
              ...statement.lineItems
                .filter((item) => item.type === "repair")
                .map(
                  (item) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph(
                              format(new Date(item.date), "MM/dd/yyyy")
                            ),
                          ],
                        }),
                        new TableCell({
                          children: [new Paragraph(item.referenceId)],
                        }),
                        new TableCell({
                          children: [new Paragraph(item.description)],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              text: formatCurrency(item.amount),
                              alignment: AlignmentType.RIGHT,
                            }),
                          ],
                        }),
                      ],
                    })
                ),

              // Repair Subtotal
              ...(statement.repairSubtotal > 0
                ? [
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph("")] }),
                        new TableCell({ children: [new Paragraph("")] }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Subtotal (Repairs):",
                                  bold: true,
                                }),
                              ],
                              alignment: AlignmentType.RIGHT,
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: formatCurrency(
                                    statement.repairSubtotal
                                  ),
                                  bold: true,
                                }),
                              ],
                              alignment: AlignmentType.RIGHT,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ]
                : []),

              // Products Section Header
              ...(statement.lineItems.filter((item) => item.type === "product")
                .length > 0
                ? [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "PRODUCTS", bold: true }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          columnSpan: 4,
                          shading: { fill: "F0F0F0" },
                        }),
                      ],
                    }),
                  ]
                : []),

              // Product Items
              ...statement.lineItems
                .filter((item) => item.type === "product")
                .map(
                  (item) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph(
                              format(new Date(item.date), "MM/dd/yyyy")
                            ),
                          ],
                        }),
                        new TableCell({
                          children: [new Paragraph(item.referenceId)],
                        }),
                        new TableCell({
                          children: [new Paragraph(item.description)],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              text: formatCurrency(item.amount),
                              alignment: AlignmentType.RIGHT,
                            }),
                          ],
                        }),
                      ],
                    })
                ),

              // Product Subtotal
              ...(statement.productSubtotal > 0
                ? [
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph("")] }),
                        new TableCell({ children: [new Paragraph("")] }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Subtotal (Products):",
                                  bold: true,
                                }),
                              ],
                              alignment: AlignmentType.RIGHT,
                            }),
                          ],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: formatCurrency(
                                    statement.productSubtotal
                                  ),
                                  bold: true,
                                }),
                              ],
                              alignment: AlignmentType.RIGHT,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ]
                : []),

              // Grand Total
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "GRAND TOTAL:", bold: true }),
                        ],
                        alignment: AlignmentType.RIGHT,
                      }),
                    ],
                    shading: { fill: "E6E6E6" },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: formatCurrency(statement.grandTotal),
                            bold: true,
                          }),
                        ],
                        alignment: AlignmentType.RIGHT,
                      }),
                    ],
                    shading: { fill: "E6E6E6" },
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  // Generate the document
  const blob = await Packer.toBlob(doc);

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `statement_${statement.customer.name.replace(
    /\s+/g,
    "_"
  )}_${format(new Date(), "yyyyMMdd")}.docx`;
  link.click();

  // Clean up
  window.URL.revokeObjectURL(url);
}
