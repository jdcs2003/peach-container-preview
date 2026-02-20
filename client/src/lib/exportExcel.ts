import * as XLSX from "xlsx";
import type { Container, LumperInvoice, DrayageInvoice, ClientInvoice } from "@/data/store";

function download(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

export function exportContainersToExcel(containers: Container[], filename = "containers.xlsx") {
  const data = containers.map(c => ({
    "Container #": c.containerNumber,
    "PO": c.po,
    "Period": c.period,
    "Status": c.status,
    "ETA": c.eta,
    "Arrival Date": c.arrivalDate,
    "Cartons": c.cartons,
    "Inbound CuFt": c.inbCuft,
    "Billable CuFt": c.billableCuft,
    "Pallets": c.pallets,
    "SKUs": c.skuCount,
    "SSL": c.ssl,
    "Pull Date": c.pullDate,
    "Return Date": c.returnDate,
    "Chassis Days": c.chassisDays,
    "Handling Revenue": c.handlingRevenue,
    "Storage Revenue": c.storageRevenue,
    "Drayage Revenue": c.drayageRevenue,
    "Chassis Revenue": c.chassisRevenue,
    "Shrink Wrap Revenue": c.shrinkWrapRevenue,
    "Total Revenue": c.totalRevenue,
    "Lumper Vendor": c.lumperVendor,
    "Lumper Cost": c.lumperCost,
    "M&A Drayage Cost": c.maDrayageCost,
    "M&A Chassis Cost": c.maChassisCost,
    "Pallet Cost": c.palletCost,
    "Total Cost": c.totalCost,
    "Gross Margin": c.grossMargin,
    "Billing Status": c.billingStatus,
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  // Set column widths
  ws["!cols"] = [
    { wch: 16 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
    { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 6 }, { wch: 6 },
    { wch: 12 }, { wch: 12 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Containers");
  download(wb, filename);
}

export function exportLumperInvoiceToExcel(invoice: LumperInvoice) {
  const data = invoice.containers.map(c => ({
    "Container #": c.containerNumber,
    "SKUs": c.skus,
    "Cases": c.cases,
    "Date Unloaded": c.dateUnloaded,
    "Pay Rate": c.payRate,
  }));
  const wb = XLSX.utils.book_new();
  // Invoice header
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
  // Add totals
  const totalRow = data.length + 8;
  XLSX.utils.sheet_add_aoa(ws, [
    ["", "", "", "Subtotal", invoice.subtotal],
    ...(invoice.outboundSubtotal ? [["", "", "", "Outbound", invoice.outboundSubtotal]] : []),
    ...(invoice.adminFee ? [["", "", "", "Admin Fee", invoice.adminFee]] : []),
    ...(invoice.trainingFee ? [["", "", "", "Training Fee", invoice.trainingFee]] : []),
    ...(invoice.waitingFee ? [["", "", "", "Waiting Fee", invoice.waitingFee]] : []),
    ["", "", "", "TOTAL", invoice.total],
  ], { origin: `A${totalRow}` });
  ws["!cols"] = [{ wch: 16 }, { wch: 6 }, { wch: 8 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws, "Lumper Invoice");
  download(wb, `lumper_${invoice.invoiceNumber}.xlsx`);
}

export function exportDrayageInvoiceToExcel(invoice: DrayageInvoice) {
  const data = invoice.containers.map(c => ({
    "Container #": c.containerNumber,
    "Pull Date": c.pullDate,
    "Return Date": c.returnDate,
    "Chassis Days": c.chassisDays,
    "Container Fee": c.containerFee,
    "Chassis Fee": c.chassisFee,
    "Total": c.total,
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

export function exportClientInvoiceToExcel(invoice: ClientInvoice) {
  const data = invoice.lines.map(l => ({
    "Container #": l.containerNumber,
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

export function exportBatchToExcel(
  containers: Container[],
  type: "lumper" | "drayage" | "client",
  filename?: string
) {
  if (type === "client") {
    exportContainersToExcel(containers, filename || "batch_billing.xlsx");
  } else {
    exportContainersToExcel(containers, filename || `batch_${type}.xlsx`);
  }
}
