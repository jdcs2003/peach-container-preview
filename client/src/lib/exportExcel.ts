import * as XLSX from "xlsx";
import XLSXStyle from "xlsx-js-style";
import type { Container, LumperInvoice, DrayageInvoice, ClientInvoice } from "@/data/store";

function download(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

function downloadStyled(wb: any, filename: string) {
  XLSXStyle.writeFile(wb, filename);
}

// ═══════════════════════════════════════════════════════════
// EXPORT ALL — Full internal view with all columns
// ═══════════════════════════════════════════════════════════
export function exportContainersToExcel(containers: Container[], filename = "containers.xlsx") {
  const data = containers.map((c) => ({
    "Container #": c.container,
    "PO": c.po,
    "Period": c.period,
    "Status": c.status,
    "ETA": c.eta,
    "Cartons": c.cartons,
    "SKUs": c.skuCount,
    "Billable CuFt": c.billableCuft,
    "Pallets": c.pallets,
    "Chassis Days": c.maChassisDays,
    "Handling Revenue": c.handlingRevenue,
    "Storage Revenue": c.storageRevenue,
    "Drayage Revenue": c.drayageRevenue,
    "Chassis Revenue": c.chassisRevenue,
    "Shrink Wrap Revenue": c.shrinkWrapRevenue,
    "Total Revenue": c.totalRevenue,
    "Lumper Cost": c.fernandoTotal,
    "M&A Drayage Cost": c.maDrayageCost,
    "M&A Chassis Cost": c.maChassisCost,
    "Pallet Cost": c.palletCost,
    "Total Cost": c.totalCost,
    "Gross Margin": c.grossMargin,
    "Billed": c.billed ? "YES" : "NO",
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 16 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
    { wch: 8 }, { wch: 6 }, { wch: 12 }, { wch: 8 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Containers");
  download(wb, filename);
}

// ═══════════════════════════════════════════════════════════
// EXPORT CUSTOMER VIEW — DO Tracker format matching original report
// Client-facing: shows their charges (our revenue), no internal costs
// ═══════════════════════════════════════════════════════════
export function exportCustomerView(containers: Container[], filename?: string) {
  const wb = XLSXStyle.utils.book_new();

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Determine action needed for sorting
  const getAction = (c: Container) => {
    if (!c.doReceived && !c.plReceived) return "NEED DO & PL";
    if (!c.doReceived) return "NEED DO";
    if (!c.plReceived) return "NEED PL";
    return "";
  };

  // Sort: Action Needed first (by ETA oldest→newest), then rest (by ETA oldest→newest)
  const sorted = [...containers]
    .filter((c) => c.status !== "canceled")
    .sort((a, b) => {
      const aAction = getAction(a) !== "";
      const bAction = getAction(b) !== "";
      // Action needed comes first
      if (aAction && !bAction) return -1;
      if (!aAction && bAction) return 1;
      // Within same group, sort by ETA oldest to newest
      return (a.eta || "9999").localeCompare(b.eta || "9999");
    });

  // Summary counts
  const total = sorted.length;
  const inExtensiv = sorted.filter((c) => c.inExtensiv).length;
  const doReceived = sorted.filter((c) => c.doReceived).length;
  const needDO = total - doReceived;
  const needPL = sorted.filter((c) => !c.plReceived).length;

  // Header style — dark navy blue background, white bold text
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
    fill: { fgColor: { rgb: "1F4E79" } },
    alignment: { horizontal: "center" as const },
    border: {
      bottom: { style: "thin" as const, color: { rgb: "1F4E79" } },
    },
  };

  // Title style
  const titleStyle = {
    font: { bold: true, sz: 14, color: { rgb: "1F4E79" } },
  };

  // Subtitle style
  const subtitleStyle = {
    font: { sz: 10, color: { rgb: "666666" } },
  };

  // Summary label style
  const summaryBoldStyle = {
    font: { bold: true, sz: 11 },
  };

  // Summary value style
  const summaryStyle = {
    font: { sz: 10 },
  };

  // Zebra stripe light gray
  const stripeStyle = {
    fill: { fgColor: { rgb: "F9F9F9" } },
  };

  // Normal data style
  const normalStyle = {
    font: { sz: 10 },
  };

  // Notes style
  const notesStyle = {
    font: { bold: true, sz: 10 },
  };

  const noteItemStyle = {
    font: { sz: 9, color: { rgb: "555555" } },
  };

  // Build rows as AOA (array of arrays)
  // Row 1: empty
  // Row 2: Title
  // Row 3: Subtitle
  // Row 4: empty
  // Row 5: SUMMARY
  // Row 6: Summary stats
  // Row 7-8: empty
  // Row 9: Headers
  // Row 10+: Data
  const rows: any[][] = [];

  // Row 1 (index 0): empty
  rows.push(["", "", "", "", "", "", ""]);
  // Row 2 (index 1): Title
  rows.push(["", "DIAMOND HOME - DO IMPORT TRACKER", "", "", "", "", ""]);
  // Row 3 (index 2): Subtitle
  rows.push(["", `SC-144 Warehouse (144 Old Elloree Road, Orangeburg, SC 29115) | Generated: ${dateStr}`, "", "", "", "", ""]);
  // Row 4 (index 3): empty
  rows.push(["", "", "", "", "", "", ""]);
  // Row 5 (index 4): SUMMARY
  rows.push(["", "SUMMARY", "", "", "", "", ""]);
  // Row 6 (index 5): Summary stats
  rows.push(["", `Total: ${total}`, `In Extensiv: ${inExtensiv}`, `DO Received: ${doReceived}`, `Need DO: ${needDO}`, `Need PL: ${needPL}`, ""]);
  // Row 7 (index 6): empty
  rows.push(["", "", "", "", "", "", ""]);
  // Row 8 (index 7): empty
  rows.push(["", "", "", "", "", "", ""]);
  // Row 9 (index 8): Headers
  rows.push(["", "Container #", "ETA", "In Extensiv", "DO Received", "PL Received", "Action Needed"]);

  // Data rows
  for (const c of sorted) {
    const action = getAction(c);
    rows.push([
      "",
      c.container,
      c.eta || "",
      c.inExtensiv ? "YES" : "NO",
      c.doReceived ? "YES" : "NO",
      c.plReceived ? "YES" : "NO",
      action,
    ]);
  }

  // Blank row after data
  const notesStartRow = rows.length;
  rows.push(["", "", "", "", "", "", ""]);
  // Notes
  rows.push(["", "NOTES:", "", "", "", "", ""]);
  rows.push(["", "\u2022 DO = Delivery Order (PDF from freight forwarder - Edwina or Tracy)", "", "", "", "", ""]);
  rows.push(["", "\u2022 PL = Packing List (Excel file with item details)", "", "", "", "", ""]);
  rows.push(["", "\u2022 All containers in Extensiv have both DO and PL received", "", "", "", "", ""]);
  rows.push(["", "\u2022 Containers with DO but no PL need packing list to create inbound receipt", "", "", "", "", ""]);

  const ws = XLSXStyle.utils.aoa_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 3 },   // A: spacer
    { wch: 16 },  // B: Container #
    { wch: 12 },  // C: ETA
    { wch: 14 },  // D: In Extensiv
    { wch: 14 },  // E: DO Received
    { wch: 14 },  // F: PL Received
    { wch: 18 },  // G: Action Needed
  ];

  // Apply styles
  // Title (B2)
  const titleCell = ws["B2"];
  if (titleCell) titleCell.s = titleStyle;

  // Subtitle (B3)
  const subCell = ws["B3"];
  if (subCell) subCell.s = subtitleStyle;

  // Summary label (B5)
  const sumLabel = ws["B5"];
  if (sumLabel) sumLabel.s = summaryBoldStyle;

  // Summary values (B6-F6)
  for (const col of ["B", "C", "D", "E", "F"]) {
    const cell = ws[`${col}6`];
    if (cell) cell.s = summaryStyle;
  }

  // Header row (row 9 = index 8, so Excel row 9)
  for (const col of ["B", "C", "D", "E", "F", "G"]) {
    const cell = ws[`${col}9`];
    if (cell) cell.s = headerStyle;
  }

  // Data rows with zebra striping
  const dataStartRow = 10; // Excel row 10
  for (let i = 0; i < sorted.length; i++) {
    const excelRow = dataStartRow + i;
    const isStripe = i % 2 === 0; // alternating
    for (const col of ["B", "C", "D", "E", "F", "G"]) {
      const cell = ws[`${col}${excelRow}`];
      if (cell) {
        cell.s = isStripe ? { ...normalStyle, ...stripeStyle } : normalStyle;
      }
    }
  }

  // Notes styling
  const notesExcelRow = notesStartRow + 2; // +1 for blank, +1 for 1-indexed
  const notesCellRef = ws[`B${notesExcelRow}`];
  if (notesCellRef) notesCellRef.s = notesStyle;
  for (let i = 1; i <= 4; i++) {
    const cell = ws[`B${notesExcelRow + i}`];
    if (cell) cell.s = noteItemStyle;
  }

  XLSXStyle.utils.book_append_sheet(wb, ws, "DO Tracker");

  const fn = filename || `DiamondHome_DO_Tracker_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.xlsx`;
  downloadStyled(wb, fn);
}

// ═══════════════════════════════════════════════════════════
// LUMPER INVOICE EXPORT
// ═══════════════════════════════════════════════════════════
export function exportLumperInvoiceToExcel(invoice: LumperInvoice) {
  const data = invoice.lines.map((l) => ({
    "Container #": l.container,
    "SKUs": l.skuCount,
    "Cases": l.cartons,
    "Date Unloaded": l.unloadDate,
    "Pay Rate": l.rate,
  }));
  const wb = XLSX.utils.book_new();
  const headerData = [
    ["Invoice #", invoice.invoiceNumber],
    ["Date", invoice.invoiceDate],
    ["Vendor", invoice.vendor],
    ["Status", invoice.status.toUpperCase()],
    [""],
    ["Container Details"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(headerData);
  XLSX.utils.sheet_add_json(ws, data, { origin: "A7" });
  const totalRow = data.length + 8;
  XLSX.utils.sheet_add_aoa(ws, [["", "", "", "TOTAL", invoice.total]], { origin: `A${totalRow}` });
  ws["!cols"] = [{ wch: 16 }, { wch: 6 }, { wch: 8 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws, "Lumper Invoice");
  download(wb, `lumper_${invoice.invoiceNumber}.xlsx`);
}

// ═══════════════════════════════════════════════════════════
// DRAYAGE INVOICE EXPORT
// ═══════════════════════════════════════════════════════════
export function exportDrayageInvoiceToExcel(invoice: DrayageInvoice) {
  const data = invoice.lines.map((l) => ({
    "Container #": l.container,
    "Pull Date": l.pickup,
    "Return Date": l.returnDate,
    "Chassis Days": l.chassisDays,
    "Container Fee": l.containerFee,
    "Chassis Fee": l.chassisFee,
    "Total": l.total,
  }));
  const wb = XLSX.utils.book_new();
  const headerData = [
    ["Invoice #", invoice.invoiceNumber],
    ["Date", invoice.invoiceDate],
    ["Vendor", invoice.vendor],
    ["Status", invoice.status.toUpperCase()],
    [""],
    ["Container Details"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(headerData);
  XLSX.utils.sheet_add_json(ws, data, { origin: "A7" });
  const totalRow = data.length + 8;
  XLSX.utils.sheet_add_aoa(ws, [["", "", "", "", "", "TOTAL", invoice.total]], { origin: `A${totalRow}` });
  ws["!cols"] = [{ wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws, "Drayage Invoice");
  download(wb, `drayage_${invoice.invoiceNumber}.xlsx`);
}

// ═══════════════════════════════════════════════════════════
// CLIENT INVOICE EXPORT
// ═══════════════════════════════════════════════════════════
export function exportClientInvoiceToExcel(invoice: ClientInvoice) {
  const data = invoice.lines.map((l) => ({
    "Container #": l.container,
    "PO": l.po,
    "Cartons": l.cartons,
    "Billable CuFt": l.billableCuft,
    "Pallets": l.pallets,
    "Chassis Days": l.chassisDays,
    "IB Handling": l.handlingRevenue,
    "Storage": l.storageRevenue,
    "Drayage": l.drayageRevenue,
    "Chassis": l.chassisRevenue,
    "Shrink Wrap": l.shrinkWrapRevenue,
    "Total": l.totalRevenue,
  }));
  const wb = XLSX.utils.book_new();
  const headerData = [
    ["INVOICE"],
    ["Invoice #", invoice.invoiceNumber],
    ["Date", invoice.invoiceDate],
    ["Bill To", invoice.client],
    ["Period", invoice.period],
    [""],
    ["Line Items"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(headerData);
  XLSX.utils.sheet_add_json(ws, data, { origin: "A8" });
  const totalRow = data.length + 9;
  XLSX.utils.sheet_add_aoa(ws, [
    ["", "", "", "", "", "", "", "", "", "", "TOTAL", invoice.total],
  ], { origin: `A${totalRow}` });
  ws["!cols"] = [
    { wch: 16 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Client Invoice");
  download(wb, `invoice_${invoice.invoiceNumber}.xlsx`);
}

export function exportBatchToExcel(containers: Container[], type: "lumper" | "drayage" | "client", filename?: string) {
  exportContainersToExcel(containers, filename || `batch_${type}.xlsx`);
}
