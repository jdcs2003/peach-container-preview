import * as XLSX from "xlsx";
import type { Container, LumperInvoice, DrayageInvoice, ClientInvoice } from "@/data/store";

function download(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

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
