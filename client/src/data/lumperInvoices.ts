// Lumper Invoice Data — Fernando Palma
// Source: Lumpers Invoice_Corr sheet from 02.18 tracker

import { allContainers } from "./containers";

export interface LumperInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  vendor: string;
  status: "paid" | "due";
  containers: { containerNumber: string; skus: number; cases: number; dateUnloaded: string; payRate: number }[];
  subtotal: number;
  outbound?: { date: string; boxes: number; perLabel: number; perCase: number }[];
  outboundSubtotal?: number;
  adminFee?: number;
  trainingFee?: number;
  waitingFee?: number;
  total: number;
}

export const lumperInvoices: LumperInvoice[] = [
  {
    invoiceNumber: "WE01242026",
    invoiceDate: "2026-01-24",
    vendor: "Fernando Palma",
    status: "paid",
    containers: [
      { containerNumber: "MRKU5545938", skus: 8, cases: 2890, dateUnloaded: "01/22/2026", payRate: 440 },
      { containerNumber: "MRKU3725416", skus: 1, cases: 700, dateUnloaded: "01/22/2026", payRate: 260 },
      { containerNumber: "MRKU2402234", skus: 1, cases: 700, dateUnloaded: "01/23/2026", payRate: 260 },
      { containerNumber: "TCNU8150661", skus: 4, cases: 1735, dateUnloaded: "01/23/2026", payRate: 260 },
      { containerNumber: "MSKU1928437", skus: 1, cases: 2450, dateUnloaded: "01/24/2026", payRate: 260 },
      { containerNumber: "MRSU4926151", skus: 1, cases: 1735, dateUnloaded: "01/24/2026", payRate: 260 },
      { containerNumber: "SUDU8795010", skus: 1, cases: 1054, dateUnloaded: "01/24/2026", payRate: 260 },
      { containerNumber: "BMOU4244012", skus: 1, cases: 1019, dateUnloaded: "01/24/2026", payRate: 300 },
      { containerNumber: "MRKU5416587", skus: 2, cases: 2450, dateUnloaded: "01/24/2026", payRate: 300 },
    ],
    subtotal: 2600,
    total: 2600,
  },
  {
    invoiceNumber: "FP-20260205",
    invoiceDate: "2026-02-05",
    vendor: "Fernando Palma",
    status: "paid",
    containers: [
      { containerNumber: "CAAU8340789", skus: 6, cases: 1687, dateUnloaded: "01/26/2026", payRate: 260 },
      { containerNumber: "WHSU9015409", skus: 14, cases: 2098, dateUnloaded: "01/26/2026", payRate: 260 },
      { containerNumber: "ONEU1919230", skus: 1, cases: 919, dateUnloaded: "01/27/2026", payRate: 260 },
      { containerNumber: "MSNU6630666", skus: 3, cases: 2700, dateUnloaded: "01/28/2026", payRate: 440 },
      { containerNumber: "ONEU5253590", skus: 1, cases: 919, dateUnloaded: "01/28/2026", payRate: 260 },
      { containerNumber: "SEKU4713410", skus: 3, cases: 1170, dateUnloaded: "01/28/2026", payRate: 260 },
      { containerNumber: "CAAU7482454", skus: 3, cases: 1431, dateUnloaded: "01/28/2026", payRate: 300 },
      { containerNumber: "TRHU5016591", skus: 1, cases: 938, dateUnloaded: "01/28/2026", payRate: 300 },
      { containerNumber: "NYKU5104769", skus: 2, cases: 1487, dateUnloaded: "01/29/2026", payRate: 260 },
      { containerNumber: "JXLU4402179", skus: 1, cases: 515, dateUnloaded: "01/29/2026", payRate: 260 },
      { containerNumber: "EGHU9666372", skus: 1, cases: 830, dateUnloaded: "01/29/2026", payRate: 260 },
      { containerNumber: "TXGU6089924", skus: 3, cases: 1367, dateUnloaded: "01/29/2026", payRate: 300 },
      { containerNumber: "TCNU7918159", skus: 3, cases: 1330, dateUnloaded: "01/30/2026", payRate: 260 },
      { containerNumber: "YMLU9580270", skus: 5, cases: 970, dateUnloaded: "01/30/2026", payRate: 260 },
      { containerNumber: "HASU4886399", skus: 5, cases: 1976, dateUnloaded: "01/31/2026", payRate: 260 },
    ],
    subtotal: 4200,
    total: 4200,
  },
  {
    invoiceNumber: "FP-20260211",
    invoiceDate: "2026-02-11",
    vendor: "Fernando Palma",
    status: "paid",
    containers: [
      { containerNumber: "JXLU6414630", skus: 2, cases: 686, dateUnloaded: "02/02/2026", payRate: 260 },
      { containerNumber: "ZCSU7553498", skus: 1, cases: 645, dateUnloaded: "02/02/2026", payRate: 260 },
      { containerNumber: "CAIU6454234", skus: 1, cases: 327, dateUnloaded: "02/02/2026", payRate: 260 },
      { containerNumber: "CAAU9375558", skus: 1, cases: 680, dateUnloaded: "02/03/2026", payRate: 260 },
      { containerNumber: "EGSU6378289", skus: 2, cases: 1100, dateUnloaded: "02/03/2026", payRate: 260 },
      { containerNumber: "MRSU3625003", skus: 1, cases: 480, dateUnloaded: "02/03/2026", payRate: 260 },
      { containerNumber: "TCNU7052887", skus: 6, cases: 1644, dateUnloaded: "02/03/2026", payRate: 300 },
      { containerNumber: "EITU9171292", skus: 3, cases: 1500, dateUnloaded: "02/04/2026", payRate: 300 },
      { containerNumber: "MRSU8376705", skus: 2, cases: 2545, dateUnloaded: "02/04/2026", payRate: 300 },
      { containerNumber: "TRHU4848410", skus: 3, cases: 2565, dateUnloaded: "02/04/2026", payRate: 300 },
      { containerNumber: "MRKU4377655", skus: 3, cases: 680, dateUnloaded: "02/04/2026", payRate: 260 },
      { containerNumber: "MRSU7312429", skus: 1, cases: 680, dateUnloaded: "02/05/2026", payRate: 260 },
      { containerNumber: "TRHU4341597", skus: 8, cases: 2670, dateUnloaded: "02/07/2026", payRate: 300 },
    ],
    subtotal: 3580,
    outbound: [
      { date: "02/03/2026", boxes: 205, perLabel: 0.13, perCase: 0.10 },
      { date: "02/04/2026", boxes: 479, perLabel: 0.13, perCase: 0.10 },
      { date: "02/05/2026", boxes: 443, perLabel: 0.13, perCase: 0.10 },
      { date: "02/06/2026", boxes: 347, perLabel: 0.13, perCase: 0.10 },
    ],
    outboundSubtotal: 339.02,
    adminFee: 200,
    total: 4119.02,
  },
  {
    invoiceNumber: "FP-20260214",
    invoiceDate: "2026-02-14",
    vendor: "Fernando Palma",
    status: "due",
    containers: [
      { containerNumber: "MSNU8718946", skus: 3, cases: 1917, dateUnloaded: "02/12/2026", payRate: 260 },
      { containerNumber: "ZCSU6594851", skus: 2, cases: 1961, dateUnloaded: "02/12/2026", payRate: 260 },
      { containerNumber: "FFAU6666281", skus: 4, cases: 1325, dateUnloaded: "02/13/2026", payRate: 260 },
    ],
    subtotal: 980,
    outbound: [
      { date: "02/09/2026", boxes: 850, perLabel: 0.13, perCase: 0.10 },
      { date: "02/10/2026", boxes: 432, perLabel: 0.13, perCase: 0.10 },
      { date: "02/11/2026", boxes: 118, perLabel: 0.13, perCase: 0.10 },
      { date: "02/12/2026", boxes: 153, perLabel: 0.13, perCase: 0.10 },
    ],
    outboundSubtotal: 357.19,
    waitingFee: 200,
    trainingFee: 200,
    total: 1537.19,
  },
];

// Summary
export function getLumperSummary() {
  const totalPaid = lumperInvoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalDue = lumperInvoices.filter(i => i.status === "due").reduce((s, i) => s + i.total, 0);
  const totalAll = totalPaid + totalDue;
  const totalContainers = lumperInvoices.reduce((s, i) => s + i.containers.length, 0);
  return { totalPaid, totalDue, totalAll, totalContainers };
}
