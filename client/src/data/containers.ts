// Container Data — Peach Warehouse SC-144 · Diamond Home
// Source: Peach_Version_Diamond_Home_Billing_Complete_Thais02.18.xlsx
// All rates from Billing Summary rate card

// ═══════════════════════════════════════════════════════════
// RATE CARD
// ═══════════════════════════════════════════════════════════
export const RATES = {
  handling: 0.15,         // $/carton
  handlingMin: 550,       // $/container minimum
  handlingMinHigh: 750,   // $/container for 2500+ cartons
  drayageBill: 495,       // $/container (bill to client)
  drayagePay: 425,        // $/container (pay to M&A)
  chassisBill: 40,        // $/day (bill to client)
  chassisPay: 30,         // $/day (pay to M&A)
  storage: 0.18,          // $/billable cuft
  minCuftPerCase: 1.3,    // minimum billable cuft per carton
  shrinkWrap: 2.50,       // $/pallet
  palletCost: 4.50,       // $/pallet
  unloadFernando: 280,    // $/container (Fernando Palma standard)
  unloadFreddie: 425,     // $/container (Freddie standard)
  unloadFreddieHeavy: 600,// $/container (Freddie heavy)
  monthlyStorageMinCuft: 65000,  // cuft threshold for monthly minimum
  monthlyStorageMinRate: 0.24,   // $/cuft for monthly minimum
  monthlyStorageMin: 15600,      // 65000 x $0.24 = $15,600/month floor
};

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
export type ContainerStatus = "unloaded" | "received" | "in_transit" | "pending" | "projected";
export type BillingStatus = "billed" | "pending" | "unbilled";
export type PayableStatus = "paid" | "due" | "pending";
export type DrayageSource = "m&a" | "summerville" | "other" | "pending";

export interface Container {
  id: number;
  containerNumber: string;
  po: string;
  period: string;           // "Jan Wk1", "Jan Wk2", "Feb Wk1", "Feb Wk2", "Feb Wk3", "Feb Unbilled", "Mar Projected"
  invoiceNumber: string;
  arrivalDate: string;
  eta: string;              // for pending containers
  status: ContainerStatus;
  notes: string;

  // Cargo
  cartons: number;
  inbCuft: number;
  billableCuft: number;
  pallets: number;
  skuCount: number;

  // Drayage (M&A)
  pullDate: string;
  returnDate: string;
  chassisDays: number;
  ssl: string;
  drayageSource: DrayageSource;

  // ── REVENUE (bill to Diamond Home) ──
  handlingCalc: number;     // $0.15 × cartons
  handlingRevenue: number;  // max(handlingCalc, handlingMin)
  drayageRevenue: number;   // $495
  chassisRevenue: number;   // $40/day
  storageRevenue: number;   // $0.18 × billableCuft
  shrinkWrapRevenue: number;// $2.50 × pallets
  totalRevenue: number;

  // ── PAYABLES (costs) ──
  // Lumper
  lumperVendor: string;
  lumperRate: number;
  lumperCost: number;
  lumperStatus: PayableStatus;
  lumperInvoice: string;
  dateUnloaded: string;
  // Pallets
  palletCost: number;
  // M&A Drayage
  maDrayageCost: number;
  maChassisCost: number;
  maDrayageTotal: number;
  maDrayageStatus: PayableStatus;
  maDrayageInvoice: string;
  // Total
  totalCost: number;

  // Margin
  grossMargin: number;
  billingStatus: BillingStatus;
}

// ═══════════════════════════════════════════════════════════
// JANUARY INBOUNDS — INV2101-59 ($37,136.48)
// ═══════════════════════════════════════════════════════════
const janInbounds: Container[] = [
  { id:1, containerNumber:"MRKU3725416", po:"5064", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-22", eta:"", status:"unloaded", notes:"",
    cartons:527, inbCuft:2333.56, billableCuft:2333.56, pallets:33, skuCount:1,
    pullDate:"2026-01-22", returnDate:"2026-01-27", chassisDays:6, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:79.05, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:420.04, shrinkWrapRevenue:82.50, totalRevenue:1547.54,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"WE01242026", dateUnloaded:"2026-01-22",
    palletCost:148.50, maDrayageCost:425, maChassisCost:150, maDrayageTotal:575, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260201",
    totalCost:983.50, grossMargin:564.04, billingStatus:"billed" },

  { id:2, containerNumber:"MRKU5545938", po:"4948", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-22", eta:"", status:"unloaded", notes:"",
    cartons:2894, inbCuft:2432, billableCuft:2894, pallets:35, skuCount:8,
    pullDate:"2026-01-22", returnDate:"2026-01-24", chassisDays:3, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:434.10, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:520.92, shrinkWrapRevenue:87.50, totalRevenue:1653.42,
    lumperVendor:"Freddie", lumperRate:440, lumperCost:440, lumperStatus:"paid", lumperInvoice:"WE01242026", dateUnloaded:"2026-01-22",
    palletCost:157.50, maDrayageCost:425, maChassisCost:150, maDrayageTotal:575, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260201",
    totalCost:1172.50, grossMargin:480.92, billingStatus:"billed" },

  { id:3, containerNumber:"MRKU2402234", po:"5178", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-23", eta:"", status:"unloaded", notes:"",
    cartons:700, inbCuft:2387.76, billableCuft:2387.76, pallets:30, skuCount:1,
    pullDate:"2026-01-23", returnDate:"2026-01-28", chassisDays:6, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:105, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:429.80, shrinkWrapRevenue:75, totalRevenue:1549.80,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"WE01242026", dateUnloaded:"2026-01-23",
    palletCost:135, maDrayageCost:425, maChassisCost:180, maDrayageTotal:605, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260201",
    totalCost:1000, grossMargin:549.80, billingStatus:"billed" },

  { id:4, containerNumber:"TCNU8150661", po:"5087", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-23", eta:"", status:"unloaded", notes:"",
    cartons:2059, inbCuft:2214.27, billableCuft:2214.27, pallets:42, skuCount:4,
    pullDate:"2026-01-23", returnDate:"2026-01-24", chassisDays:2, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:308.85, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:398.57, shrinkWrapRevenue:105, totalRevenue:1548.57,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"WE01242026", dateUnloaded:"2026-01-23",
    palletCost:189, maDrayageCost:425, maChassisCost:150, maDrayageTotal:575, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260201",
    totalCost:1024, grossMargin:524.57, billingStatus:"billed" },

  { id:5, containerNumber:"SUDU8795010", po:"5064", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-24", eta:"", status:"unloaded", notes:"",
    cartons:527, inbCuft:2333.56, billableCuft:2333.56, pallets:27, skuCount:1,
    pullDate:"2026-01-23", returnDate:"2026-01-26", chassisDays:4, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:79.05, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:420.04, shrinkWrapRevenue:67.50, totalRevenue:1532.54,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"WE01242026", dateUnloaded:"2026-01-24",
    palletCost:121.50, maDrayageCost:425, maChassisCost:150, maDrayageTotal:575, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260201",
    totalCost:956.50, grossMargin:576.04, billingStatus:"billed" },

  { id:6, containerNumber:"BMOU4244012", po:"5117", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-24", eta:"", status:"unloaded", notes:"",
    cartons:1019, inbCuft:2330.31, billableCuft:2330.31, pallets:37, skuCount:1,
    pullDate:"2026-01-24", returnDate:"2026-01-26", chassisDays:3, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:152.85, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:419.46, shrinkWrapRevenue:92.50, totalRevenue:1556.96,
    lumperVendor:"Fernando Palma", lumperRate:300, lumperCost:300, lumperStatus:"paid", lumperInvoice:"WE01242026", dateUnloaded:"2026-01-24",
    palletCost:166.50, maDrayageCost:425, maChassisCost:240, maDrayageTotal:665, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260201",
    totalCost:1131.50, grossMargin:425.46, billingStatus:"billed" },

  { id:7, containerNumber:"MRSU4926151", po:"5178", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-24", eta:"", status:"unloaded", notes:"",
    cartons:700, inbCuft:2388, billableCuft:2387.76, pallets:25, skuCount:1,
    pullDate:"2026-01-23", returnDate:"2026-01-29", chassisDays:7, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:105, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:429.80, shrinkWrapRevenue:62.50, totalRevenue:1537.30,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"WE01242026", dateUnloaded:"2026-01-24",
    palletCost:112.50, maDrayageCost:425, maChassisCost:150, maDrayageTotal:575, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260201",
    totalCost:947.50, grossMargin:589.80, billingStatus:"billed" },

  { id:8, containerNumber:"MRKU5416587", po:"5167", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-24", eta:"", status:"unloaded", notes:"",
    cartons:2450, inbCuft:2422, billableCuft:2450, pallets:28, skuCount:2,
    pullDate:"2026-01-23", returnDate:"2026-01-29", chassisDays:7, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:367.50, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:441, shrinkWrapRevenue:70, totalRevenue:1556,
    lumperVendor:"Fernando Palma", lumperRate:300, lumperCost:300, lumperStatus:"paid", lumperInvoice:"WE01242026", dateUnloaded:"2026-01-24",
    palletCost:126, maDrayageCost:425, maChassisCost:150, maDrayageTotal:575, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260201",
    totalCost:1001, grossMargin:555, billingStatus:"billed" },

  { id:9, containerNumber:"MSKU1928437", po:"5178", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-24", eta:"", status:"unloaded", notes:"",
    cartons:700, inbCuft:2388, billableCuft:2387.76, pallets:25, skuCount:1,
    pullDate:"2026-01-23", returnDate:"2026-01-28", chassisDays:6, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:105, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:429.80, shrinkWrapRevenue:62.50, totalRevenue:1537.30,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"WE01242026", dateUnloaded:"2026-01-24",
    palletCost:112.50, maDrayageCost:425, maChassisCost:150, maDrayageTotal:575, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260201",
    totalCost:947.50, grossMargin:589.80, billingStatus:"billed" },

  { id:10, containerNumber:"WHSU9015409", po:"4974", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-26", eta:"", status:"unloaded", notes:"",
    cartons:2074, inbCuft:2563, billableCuft:2563, pallets:36, skuCount:14,
    pullDate:"2026-01-26", returnDate:"2026-01-27", chassisDays:2, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:311.10, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:461.34, shrinkWrapRevenue:90, totalRevenue:1596.34,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260205", dateUnloaded:"2026-01-26",
    palletCost:162, maDrayageCost:425, maChassisCost:180, maDrayageTotal:605, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260201",
    totalCost:1027, grossMargin:569.34, billingStatus:"billed" },

  { id:11, containerNumber:"CAAU8340789", po:"4983", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-26", eta:"", status:"unloaded", notes:"",
    cartons:1684, inbCuft:1993, billableCuft:1993, pallets:30, skuCount:6,
    pullDate:"2026-01-26", returnDate:"2026-02-02", chassisDays:8, ssl:"MED", drayageSource:"m&a",
    handlingCalc:252.60, handlingRevenue:550, drayageRevenue:495, chassisRevenue:320, storageRevenue:358.74, shrinkWrapRevenue:75, totalRevenue:1798.74,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260205", dateUnloaded:"2026-01-26",
    palletCost:135, maDrayageCost:425, maChassisCost:240, maDrayageTotal:665, maDrayageStatus:"due", maDrayageInvoice:"MA-20260217",
    totalCost:1060, grossMargin:738.74, billingStatus:"billed" },

  { id:12, containerNumber:"MSNU6630666", po:"4924", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-27", eta:"", status:"unloaded", notes:"",
    cartons:2688, inbCuft:1905, billableCuft:2688, pallets:32, skuCount:3,
    pullDate:"2026-01-27", returnDate:"2026-02-03", chassisDays:8, ssl:"MED", drayageSource:"m&a",
    handlingCalc:403.20, handlingRevenue:550, drayageRevenue:495, chassisRevenue:320, storageRevenue:483.84, shrinkWrapRevenue:80, totalRevenue:1928.84,
    lumperVendor:"Freddie", lumperRate:440, lumperCost:440, lumperStatus:"paid", lumperInvoice:"FP-20260205", dateUnloaded:"2026-01-28",
    palletCost:144, maDrayageCost:425, maChassisCost:240, maDrayageTotal:665, maDrayageStatus:"due", maDrayageInvoice:"MA-20260217",
    totalCost:1249, grossMargin:679.84, billingStatus:"billed" },

  { id:13, containerNumber:"ONEU1919230", po:"5112", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-27", eta:"", status:"unloaded", notes:"",
    cartons:919, inbCuft:2297, billableCuft:2296.59, pallets:31, skuCount:1,
    pullDate:"2026-01-27", returnDate:"2026-01-28", chassisDays:2, ssl:"ONE", drayageSource:"m&a",
    handlingCalc:137.85, handlingRevenue:550, drayageRevenue:495, chassisRevenue:80, storageRevenue:413.39, shrinkWrapRevenue:77.50, totalRevenue:1615.89,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260205", dateUnloaded:"2026-01-27",
    palletCost:139.50, maDrayageCost:425, maChassisCost:0, maDrayageTotal:425, maDrayageStatus:"pending", maDrayageInvoice:"",
    totalCost:824.50, grossMargin:791.39, billingStatus:"billed" },

  { id:14, containerNumber:"ONEU5253590", po:"5112", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-28", eta:"", status:"unloaded", notes:"",
    cartons:919, inbCuft:2297, billableCuft:2296.59, pallets:31, skuCount:1,
    pullDate:"2026-01-28", returnDate:"2026-01-30", chassisDays:3, ssl:"ONE", drayageSource:"m&a",
    handlingCalc:137.85, handlingRevenue:550, drayageRevenue:495, chassisRevenue:120, storageRevenue:413.39, shrinkWrapRevenue:77.50, totalRevenue:1655.89,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260205", dateUnloaded:"2026-01-28",
    palletCost:139.50, maDrayageCost:425, maChassisCost:0, maDrayageTotal:425, maDrayageStatus:"pending", maDrayageInvoice:"",
    totalCost:824.50, grossMargin:831.39, billingStatus:"billed" },

  { id:15, containerNumber:"NYKU5104769", po:"4457", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-29", eta:"", status:"unloaded", notes:"",
    cartons:1493, inbCuft:2317, billableCuft:2317.09, pallets:30, skuCount:2,
    pullDate:"2026-01-28", returnDate:"2026-02-02", chassisDays:6, ssl:"ONE", drayageSource:"m&a",
    handlingCalc:223.95, handlingRevenue:550, drayageRevenue:495, chassisRevenue:240, storageRevenue:417.08, shrinkWrapRevenue:75, totalRevenue:1777.08,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260205", dateUnloaded:"2026-01-29",
    palletCost:135, maDrayageCost:425, maChassisCost:180, maDrayageTotal:605, maDrayageStatus:"due", maDrayageInvoice:"MA-20260217",
    totalCost:1020, grossMargin:757.08, billingStatus:"billed" },

  { id:16, containerNumber:"JXLU4402179", po:"4876", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-29", eta:"", status:"unloaded", notes:"",
    cartons:515, inbCuft:2325, billableCuft:2325.27, pallets:25, skuCount:1,
    pullDate:"2026-01-29", returnDate:"2026-02-02", chassisDays:5, ssl:"ZIM", drayageSource:"m&a",
    handlingCalc:77.25, handlingRevenue:550, drayageRevenue:495, chassisRevenue:200, storageRevenue:418.55, shrinkWrapRevenue:62.50, totalRevenue:1726.05,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260205", dateUnloaded:"2026-01-29",
    palletCost:112.50, maDrayageCost:425, maChassisCost:150, maDrayageTotal:575, maDrayageStatus:"due", maDrayageInvoice:"MA-20260217",
    totalCost:947.50, grossMargin:778.55, billingStatus:"billed" },

  { id:17, containerNumber:"YMLU9580270", po:"1073", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-30", eta:"", status:"unloaded", notes:"",
    cartons:970, inbCuft:2663, billableCuft:2663, pallets:37, skuCount:5,
    pullDate:"2026-01-30", returnDate:"2026-02-02", chassisDays:4, ssl:"YML", drayageSource:"m&a",
    handlingCalc:145.50, handlingRevenue:550, drayageRevenue:495, chassisRevenue:160, storageRevenue:479.34, shrinkWrapRevenue:92.50, totalRevenue:1776.84,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260205", dateUnloaded:"2026-01-30",
    palletCost:166.50, maDrayageCost:425, maChassisCost:120, maDrayageTotal:545, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260204",
    totalCost:971.50, grossMargin:805.34, billingStatus:"billed" },

  // Summerville / Non-M&A loads
  { id:18, containerNumber:"TRHU5016591", po:"5144", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-28", eta:"", status:"unloaded", notes:"Pulled by another carrier to a different warehouse; Peach just unloaded it. No drayage billed to client.",
    cartons:938, inbCuft:2264, billableCuft:2263.65, pallets:27, skuCount:1,
    pullDate:"", returnDate:"", chassisDays:0, ssl:"MAE", drayageSource:"other",
    handlingCalc:140.70, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:407.46, shrinkWrapRevenue:67.50, totalRevenue:1519.96,
    lumperVendor:"Fernando Palma", lumperRate:300, lumperCost:300, lumperStatus:"paid", lumperInvoice:"FP-20260205", dateUnloaded:"2026-01-28",
    palletCost:121.50, maDrayageCost:0, maChassisCost:0, maDrayageTotal:0, maDrayageStatus:"paid", maDrayageInvoice:"N/A",
    totalCost:421.50, grossMargin:1098.46, billingStatus:"billed" },

  { id:19, containerNumber:"CAAU7482454", po:"5144", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-28", eta:"", status:"unloaded", notes:"Pulled by another carrier; Peach helped unload. No drayage billed to client.",
    cartons:1432, inbCuft:2288, billableCuft:2288.43, pallets:33, skuCount:3,
    pullDate:"", returnDate:"", chassisDays:0, ssl:"MAE", drayageSource:"other",
    handlingCalc:214.80, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:411.92, shrinkWrapRevenue:82.50, totalRevenue:1539.42,
    lumperVendor:"Fernando Palma", lumperRate:300, lumperCost:300, lumperStatus:"paid", lumperInvoice:"FP-20260205", dateUnloaded:"2026-01-28",
    palletCost:148.50, maDrayageCost:0, maChassisCost:0, maDrayageTotal:0, maDrayageStatus:"paid", maDrayageInvoice:"N/A",
    totalCost:448.50, grossMargin:1090.92, billingStatus:"billed" },

  { id:20, containerNumber:"SEKU4713410", po:"5101", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-28", eta:"", status:"unloaded", notes:"Summerville load. Fernando unloaded 01/28 at $260.",
    cartons:1170, inbCuft:2292, billableCuft:2292.11, pallets:29, skuCount:3,
    pullDate:"", returnDate:"", chassisDays:0, ssl:"", drayageSource:"summerville",
    handlingCalc:175.50, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:412.58, shrinkWrapRevenue:72.50, totalRevenue:1530.08,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260205", dateUnloaded:"2026-01-28",
    palletCost:130.50, maDrayageCost:0, maChassisCost:0, maDrayageTotal:0, maDrayageStatus:"paid", maDrayageInvoice:"N/A",
    totalCost:390.50, grossMargin:1139.58, billingStatus:"billed" },

  { id:21, containerNumber:"TXGU6089924", po:"5111", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-29", eta:"", status:"unloaded", notes:"Summerville load. Fernando unloaded 01/29 at $300.",
    cartons:1367, inbCuft:2191, billableCuft:2191.16, pallets:26, skuCount:3,
    pullDate:"", returnDate:"", chassisDays:0, ssl:"", drayageSource:"summerville",
    handlingCalc:205.05, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:394.41, shrinkWrapRevenue:65, totalRevenue:1504.41,
    lumperVendor:"Fernando Palma", lumperRate:300, lumperCost:300, lumperStatus:"paid", lumperInvoice:"FP-20260205", dateUnloaded:"2026-01-29",
    palletCost:117, maDrayageCost:0, maChassisCost:0, maDrayageTotal:0, maDrayageStatus:"paid", maDrayageInvoice:"N/A",
    totalCost:417, grossMargin:1087.41, billingStatus:"billed" },

  { id:22, containerNumber:"EGHU9666372", po:"5111", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-29", eta:"", status:"unloaded", notes:"Summerville load. Fernando unloaded 01/29 at $260.",
    cartons:829, inbCuft:2280, billableCuft:2279.60, pallets:28, skuCount:1,
    pullDate:"", returnDate:"", chassisDays:0, ssl:"", drayageSource:"summerville",
    handlingCalc:124.35, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:410.33, shrinkWrapRevenue:70, totalRevenue:1525.33,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260205", dateUnloaded:"2026-01-29",
    palletCost:126, maDrayageCost:0, maChassisCost:0, maDrayageTotal:0, maDrayageStatus:"paid", maDrayageInvoice:"N/A",
    totalCost:386, grossMargin:1139.33, billingStatus:"billed" },

  { id:23, containerNumber:"TCNU7918159", po:"1126", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-30", eta:"", status:"unloaded", notes:"Summerville load. Peach unloaded 01/30.",
    cartons:1329, inbCuft:2285, billableCuft:2285, pallets:27, skuCount:3,
    pullDate:"", returnDate:"", chassisDays:0, ssl:"MAE", drayageSource:"summerville",
    handlingCalc:199.35, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:411.30, shrinkWrapRevenue:67.50, totalRevenue:1523.80,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260205", dateUnloaded:"2026-01-30",
    palletCost:121.50, maDrayageCost:0, maChassisCost:0, maDrayageTotal:0, maDrayageStatus:"paid", maDrayageInvoice:"N/A",
    totalCost:381.50, grossMargin:1142.30, billingStatus:"billed" },

  { id:24, containerNumber:"HASU4886399", po:"1127", period:"January", invoiceNumber:"INV2101-59", arrivalDate:"2026-01-30", eta:"", status:"unloaded", notes:"Summerville load. Peach unloaded 01/31.",
    cartons:1976, inbCuft:2269, billableCuft:2269, pallets:34, skuCount:5,
    pullDate:"", returnDate:"", chassisDays:0, ssl:"MAE", drayageSource:"summerville",
    handlingCalc:296.40, handlingRevenue:550, drayageRevenue:495, chassisRevenue:0, storageRevenue:408.42, shrinkWrapRevenue:85, totalRevenue:1538.42,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260205", dateUnloaded:"2026-01-31",
    palletCost:153, maDrayageCost:0, maChassisCost:0, maDrayageTotal:0, maDrayageStatus:"paid", maDrayageInvoice:"N/A",
    totalCost:413, grossMargin:1125.42, billingStatus:"billed" },
];

// ═══════════════════════════════════════════════════════════
// FEBRUARY WEEK 1 — INV2101-70 ($21,255.64)
// ═══════════════════════════════════════════════════════════
const febWk1: Container[] = [
  { id:25, containerNumber:"JXLU6414630", po:"1069", period:"Feb Wk1", invoiceNumber:"INV2101-70", arrivalDate:"2026-02-02", eta:"", status:"unloaded", notes:"",
    cartons:666, inbCuft:2277, billableCuft:2277, pallets:31, skuCount:2,
    pullDate:"2026-02-02", returnDate:"2026-02-03", chassisDays:2, ssl:"ZIM", drayageSource:"m&a",
    handlingCalc:99.90, handlingRevenue:550, drayageRevenue:495, chassisRevenue:80, storageRevenue:409.86, shrinkWrapRevenue:77.50, totalRevenue:1612.36,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260211", dateUnloaded:"2026-02-02",
    palletCost:139.50, maDrayageCost:425, maChassisCost:60, maDrayageTotal:485, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260204",
    totalCost:884.50, grossMargin:727.86, billingStatus:"pending" },

  { id:26, containerNumber:"ZCSU7553498", po:"1077", period:"Feb Wk1", invoiceNumber:"INV2101-70", arrivalDate:"2026-02-02", eta:"", status:"unloaded", notes:"",
    cartons:645, inbCuft:2377, billableCuft:2377, pallets:33, skuCount:1,
    pullDate:"2026-02-02", returnDate:"2026-02-03", chassisDays:2, ssl:"ZIM", drayageSource:"m&a",
    handlingCalc:96.75, handlingRevenue:550, drayageRevenue:495, chassisRevenue:80, storageRevenue:427.86, shrinkWrapRevenue:82.50, totalRevenue:1635.36,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260211", dateUnloaded:"2026-02-02",
    palletCost:148.50, maDrayageCost:425, maChassisCost:60, maDrayageTotal:485, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260204",
    totalCost:893.50, grossMargin:741.86, billingStatus:"pending" },

  { id:27, containerNumber:"CAIU6454234", po:"1079", period:"Feb Wk1", invoiceNumber:"INV2101-70", arrivalDate:"2026-02-02", eta:"", status:"unloaded", notes:"",
    cartons:327, inbCuft:944.32, billableCuft:944.32, pallets:14, skuCount:1,
    pullDate:"2026-02-02", returnDate:"2026-02-03", chassisDays:2, ssl:"ZIM", drayageSource:"m&a",
    handlingCalc:49.05, handlingRevenue:550, drayageRevenue:495, chassisRevenue:80, storageRevenue:169.98, shrinkWrapRevenue:35, totalRevenue:1329.98,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260211", dateUnloaded:"2026-02-02",
    palletCost:63, maDrayageCost:425, maChassisCost:60, maDrayageTotal:485, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260204",
    totalCost:808, grossMargin:521.98, billingStatus:"pending" },

  { id:28, containerNumber:"EGSU6378289", po:"1054", period:"Feb Wk1", invoiceNumber:"INV2101-70", arrivalDate:"2026-02-03", eta:"", status:"unloaded", notes:"",
    cartons:1100, inbCuft:2244, billableCuft:2244, pallets:24, skuCount:2,
    pullDate:"2026-02-03", returnDate:"2026-02-04", chassisDays:2, ssl:"EGL", drayageSource:"m&a",
    handlingCalc:165, handlingRevenue:550, drayageRevenue:495, chassisRevenue:80, storageRevenue:403.92, shrinkWrapRevenue:60, totalRevenue:1588.92,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260211", dateUnloaded:"2026-02-03",
    palletCost:108, maDrayageCost:425, maChassisCost:60, maDrayageTotal:485, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260204",
    totalCost:853, grossMargin:735.92, billingStatus:"pending" },

  { id:29, containerNumber:"CAAU9375558", po:"1056", period:"Feb Wk1", invoiceNumber:"INV2101-70", arrivalDate:"2026-02-03", eta:"", status:"unloaded", notes:"",
    cartons:680, inbCuft:2508, billableCuft:2508, pallets:28, skuCount:1,
    pullDate:"2026-02-02", returnDate:"2026-02-04", chassisDays:3, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:102, handlingRevenue:550, drayageRevenue:495, chassisRevenue:120, storageRevenue:451.44, shrinkWrapRevenue:70, totalRevenue:1686.44,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260211", dateUnloaded:"2026-02-03",
    palletCost:126, maDrayageCost:425, maChassisCost:90, maDrayageTotal:515, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260204",
    totalCost:901, grossMargin:785.44, billingStatus:"pending" },

  { id:30, containerNumber:"MRSU3625003", po:"1058", period:"Feb Wk1", invoiceNumber:"INV2101-70", arrivalDate:"2026-02-03", eta:"", status:"unloaded", notes:"",
    cartons:480, inbCuft:2345, billableCuft:2345, pallets:24, skuCount:1,
    pullDate:"2026-02-03", returnDate:"2026-02-04", chassisDays:2, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:72, handlingRevenue:550, drayageRevenue:495, chassisRevenue:80, storageRevenue:422.10, shrinkWrapRevenue:60, totalRevenue:1607.10,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260211", dateUnloaded:"2026-02-03",
    palletCost:108, maDrayageCost:425, maChassisCost:60, maDrayageTotal:485, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260204",
    totalCost:853, grossMargin:754.10, billingStatus:"pending" },

  { id:31, containerNumber:"TCNU7052887", po:"1062", period:"Feb Wk1", invoiceNumber:"INV2101-70", arrivalDate:"2026-02-03", eta:"", status:"unloaded", notes:"",
    cartons:1643, inbCuft:1850, billableCuft:1850, pallets:28, skuCount:6,
    pullDate:"2026-02-03", returnDate:"2026-02-04", chassisDays:2, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:246.45, handlingRevenue:550, drayageRevenue:495, chassisRevenue:80, storageRevenue:333, shrinkWrapRevenue:70, totalRevenue:1528,
    lumperVendor:"Fernando Palma", lumperRate:300, lumperCost:300, lumperStatus:"paid", lumperInvoice:"FP-20260211", dateUnloaded:"2026-02-03",
    palletCost:126, maDrayageCost:425, maChassisCost:60, maDrayageTotal:485, maDrayageStatus:"paid", maDrayageInvoice:"MA-20260204",
    totalCost:911, grossMargin:617, billingStatus:"pending" },

  { id:32, containerNumber:"EITU9171292", po:"1055", period:"Feb Wk1", invoiceNumber:"INV2101-70", arrivalDate:"2026-02-04", eta:"", status:"unloaded", notes:"",
    cartons:1500, inbCuft:2288, billableCuft:2288, pallets:32, skuCount:3,
    pullDate:"2026-02-04", returnDate:"2026-02-06", chassisDays:3, ssl:"EGL", drayageSource:"m&a",
    handlingCalc:225, handlingRevenue:550, drayageRevenue:495, chassisRevenue:120, storageRevenue:411.84, shrinkWrapRevenue:80, totalRevenue:1656.84,
    lumperVendor:"Fernando Palma", lumperRate:300, lumperCost:300, lumperStatus:"paid", lumperInvoice:"FP-20260211", dateUnloaded:"2026-02-04",
    palletCost:144, maDrayageCost:425, maChassisCost:90, maDrayageTotal:515, maDrayageStatus:"due", maDrayageInvoice:"MA-20260217",
    totalCost:959, grossMargin:697.84, billingStatus:"pending" },

  { id:33, containerNumber:"MRKU4377655", po:"1059", period:"Feb Wk1", invoiceNumber:"INV2101-70", arrivalDate:"2026-02-04", eta:"", status:"unloaded", notes:"",
    cartons:540, inbCuft:2072, billableCuft:2072, pallets:24, skuCount:3,
    pullDate:"2026-02-03", returnDate:"2026-02-06", chassisDays:4, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:81, handlingRevenue:550, drayageRevenue:495, chassisRevenue:160, storageRevenue:372.96, shrinkWrapRevenue:60, totalRevenue:1637.96,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260211", dateUnloaded:"2026-02-04",
    palletCost:108, maDrayageCost:425, maChassisCost:120, maDrayageTotal:545, maDrayageStatus:"due", maDrayageInvoice:"MA-20260217",
    totalCost:913, grossMargin:724.96, billingStatus:"pending" },

  { id:34, containerNumber:"MRSU8376705", po:"1060", period:"Feb Wk1", invoiceNumber:"INV2101-70", arrivalDate:"2026-02-04", eta:"", status:"unloaded", notes:"",
    cartons:2546, inbCuft:2353, billableCuft:2546, pallets:34, skuCount:2,
    pullDate:"2026-02-04", returnDate:"2026-02-05", chassisDays:2, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:381.90, handlingRevenue:550, drayageRevenue:495, chassisRevenue:80, storageRevenue:458.28, shrinkWrapRevenue:85, totalRevenue:1668.28,
    lumperVendor:"Fernando Palma", lumperRate:300, lumperCost:300, lumperStatus:"paid", lumperInvoice:"FP-20260211", dateUnloaded:"2026-02-04",
    palletCost:153, maDrayageCost:425, maChassisCost:60, maDrayageTotal:485, maDrayageStatus:"due", maDrayageInvoice:"MA-20260217",
    totalCost:938, grossMargin:730.28, billingStatus:"pending" },

  { id:35, containerNumber:"TRHU4848410", po:"1061", period:"Feb Wk1", invoiceNumber:"INV2101-70", arrivalDate:"2026-02-04", eta:"", status:"unloaded", notes:"",
    cartons:2565, inbCuft:2403, billableCuft:2565, pallets:38, skuCount:3,
    pullDate:"2026-02-04", returnDate:"2026-02-06", chassisDays:3, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:384.75, handlingRevenue:550, drayageRevenue:495, chassisRevenue:120, storageRevenue:461.70, shrinkWrapRevenue:95, totalRevenue:1721.70,
    lumperVendor:"Fernando Palma", lumperRate:300, lumperCost:300, lumperStatus:"paid", lumperInvoice:"FP-20260211", dateUnloaded:"2026-02-04",
    palletCost:171, maDrayageCost:425, maChassisCost:90, maDrayageTotal:515, maDrayageStatus:"due", maDrayageInvoice:"MA-20260217",
    totalCost:986, grossMargin:735.70, billingStatus:"pending" },

  { id:36, containerNumber:"MRSU7312429", po:"1057", period:"Feb Wk1", invoiceNumber:"INV2101-70", arrivalDate:"2026-02-05", eta:"", status:"unloaded", notes:"",
    cartons:2720, inbCuft:2496, billableCuft:2720, pallets:28, skuCount:1,
    pullDate:"2026-02-05", returnDate:"2026-02-06", chassisDays:2, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:408, handlingRevenue:550, drayageRevenue:495, chassisRevenue:80, storageRevenue:489.60, shrinkWrapRevenue:70, totalRevenue:1684.60,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"paid", lumperInvoice:"FP-20260211", dateUnloaded:"2026-02-05",
    palletCost:126, maDrayageCost:425, maChassisCost:60, maDrayageTotal:485, maDrayageStatus:"due", maDrayageInvoice:"MA-20260217",
    totalCost:871, grossMargin:813.60, billingStatus:"pending" },

  { id:37, containerNumber:"TRHU4341597", po:"1268", period:"Feb Wk1", invoiceNumber:"INV2101-70", arrivalDate:"2026-02-06", eta:"", status:"unloaded", notes:"Pull 02/05, Return 02/11 = 7 days. $425 + $210 = $635.",
    cartons:2670, inbCuft:2266, billableCuft:2670, pallets:37, skuCount:8,
    pullDate:"2026-02-05", returnDate:"2026-02-11", chassisDays:7, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:400.50, handlingRevenue:550, drayageRevenue:495, chassisRevenue:280, storageRevenue:480.60, shrinkWrapRevenue:92.50, totalRevenue:1898.10,
    lumperVendor:"Fernando Palma", lumperRate:300, lumperCost:300, lumperStatus:"paid", lumperInvoice:"FP-20260211", dateUnloaded:"2026-02-07",
    palletCost:166.50, maDrayageCost:425, maChassisCost:210, maDrayageTotal:635, maDrayageStatus:"due", maDrayageInvoice:"MA-20260217",
    totalCost:1101.50, grossMargin:796.60, billingStatus:"pending" },
];

// ═══════════════════════════════════════════════════════════
// FEBRUARY WEEK 2 — INV2101- (pending)
// ═══════════════════════════════════════════════════════════
const febWk2: Container[] = [
  { id:38, containerNumber:"ZCSU6594851", po:"1586", period:"Feb Wk2", invoiceNumber:"", arrivalDate:"2026-02-12", eta:"", status:"unloaded", notes:"",
    cartons:1959, inbCuft:2287, billableCuft:2287, pallets:29, skuCount:2,
    pullDate:"2026-02-12", returnDate:"2026-02-13", chassisDays:2, ssl:"ZIM", drayageSource:"m&a",
    handlingCalc:293.85, handlingRevenue:550, drayageRevenue:495, chassisRevenue:80, storageRevenue:411.66, shrinkWrapRevenue:72.50, totalRevenue:1609.16,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"due", lumperInvoice:"FP-20260214", dateUnloaded:"2026-02-12",
    palletCost:130.50, maDrayageCost:425, maChassisCost:60, maDrayageTotal:485, maDrayageStatus:"due", maDrayageInvoice:"MA-20260217",
    totalCost:875.50, grossMargin:733.66, billingStatus:"unbilled" },

  { id:39, containerNumber:"MSNU8718946", po:"1585", period:"Feb Wk2", invoiceNumber:"", arrivalDate:"2026-02-12", eta:"", status:"unloaded", notes:"",
    cartons:1918, inbCuft:2461, billableCuft:2461, pallets:29, skuCount:3,
    pullDate:"2026-02-12", returnDate:"2026-02-17", chassisDays:6, ssl:"MED", drayageSource:"m&a",
    handlingCalc:287.70, handlingRevenue:550, drayageRevenue:495, chassisRevenue:240, storageRevenue:442.98, shrinkWrapRevenue:72.50, totalRevenue:1800.48,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"due", lumperInvoice:"FP-20260214", dateUnloaded:"2026-02-12",
    palletCost:130.50, maDrayageCost:425, maChassisCost:180, maDrayageTotal:605, maDrayageStatus:"due", maDrayageInvoice:"MA-20260217",
    totalCost:995.50, grossMargin:804.98, billingStatus:"unbilled" },

  { id:40, containerNumber:"FFAU6666281", po:"1602", period:"Feb Wk2", invoiceNumber:"", arrivalDate:"2026-02-13", eta:"", status:"unloaded", notes:"",
    cartons:1325, inbCuft:1996, billableCuft:1996, pallets:25, skuCount:4,
    pullDate:"2026-02-12", returnDate:"2026-02-16", chassisDays:5, ssl:"MAE", drayageSource:"m&a",
    handlingCalc:198.75, handlingRevenue:550, drayageRevenue:495, chassisRevenue:200, storageRevenue:359.28, shrinkWrapRevenue:62.50, totalRevenue:1666.78,
    lumperVendor:"Fernando Palma", lumperRate:260, lumperCost:260, lumperStatus:"due", lumperInvoice:"FP-20260214", dateUnloaded:"2026-02-13",
    palletCost:112.50, maDrayageCost:425, maChassisCost:150, maDrayageTotal:575, maDrayageStatus:"due", maDrayageInvoice:"MA-20260217",
    totalCost:947.50, grossMargin:719.28, billingStatus:"unbilled" },
];

// ═══════════════════════════════════════════════════════════
// FEBRUARY WEEK 3 — received / in transit
// ═══════════════════════════════════════════════════════════
const febWk3: Container[] = [
  { id:41, containerNumber:"HMMU4264969", po:"1066", period:"Feb Wk3", invoiceNumber:"", arrivalDate:"2026-02-16", eta:"2026-02-16", status:"unloaded", notes:"",
    cartons:1282, inbCuft:2403, billableCuft:2403, pallets:30, skuCount:0,
    pullDate:"2026-02-16", returnDate:"2026-02-17", chassisDays:2, ssl:"HYU", drayageSource:"m&a",
    handlingCalc:192.30, handlingRevenue:550, drayageRevenue:495, chassisRevenue:80, storageRevenue:264.33, shrinkWrapRevenue:75, totalRevenue:1464.33,
    lumperVendor:"", lumperRate:0, lumperCost:0, lumperStatus:"pending", lumperInvoice:"", dateUnloaded:"",
    palletCost:135, maDrayageCost:425, maChassisCost:60, maDrayageTotal:485, maDrayageStatus:"due", maDrayageInvoice:"MA-20260217",
    totalCost:620, grossMargin:844.33, billingStatus:"unbilled" },

  { id:42, containerNumber:"HMMU6542760", po:"", period:"Feb Wk3", invoiceNumber:"", arrivalDate:"2026-02-16", eta:"2026-02-16", status:"received", notes:"Pulled, returned 02/17. Not yet unloaded.",
    cartons:0, inbCuft:0, billableCuft:0, pallets:0, skuCount:0,
    pullDate:"2026-02-16", returnDate:"2026-02-17", chassisDays:2, ssl:"HYU", drayageSource:"m&a",
    handlingCalc:0, handlingRevenue:0, drayageRevenue:495, chassisRevenue:80, storageRevenue:0, shrinkWrapRevenue:0, totalRevenue:575,
    lumperVendor:"", lumperRate:0, lumperCost:0, lumperStatus:"pending", lumperInvoice:"", dateUnloaded:"",
    palletCost:0, maDrayageCost:425, maChassisCost:60, maDrayageTotal:485, maDrayageStatus:"due", maDrayageInvoice:"MA-20260217",
    totalCost:485, grossMargin:90, billingStatus:"unbilled" },

  { id:43, containerNumber:"HMMU6867832", po:"", period:"Feb Wk3", invoiceNumber:"", arrivalDate:"", eta:"2026-02-16", status:"in_transit", notes:"Currently out — not yet returned as of 02/17.",
    cartons:0, inbCuft:0, billableCuft:0, pallets:0, skuCount:0,
    pullDate:"2026-02-16", returnDate:"", chassisDays:2, ssl:"HYU", drayageSource:"m&a",
    handlingCalc:0, handlingRevenue:0, drayageRevenue:495, chassisRevenue:80, storageRevenue:0, shrinkWrapRevenue:0, totalRevenue:575,
    lumperVendor:"", lumperRate:0, lumperCost:0, lumperStatus:"pending", lumperInvoice:"", dateUnloaded:"",
    palletCost:0, maDrayageCost:425, maChassisCost:60, maDrayageTotal:485, maDrayageStatus:"pending", maDrayageInvoice:"",
    totalCost:485, grossMargin:90, billingStatus:"unbilled" },

  { id:44, containerNumber:"TXGU8533128", po:"", period:"Feb Wk3", invoiceNumber:"", arrivalDate:"", eta:"2026-02-16", status:"in_transit", notes:"Currently out — not yet returned.",
    cartons:0, inbCuft:0, billableCuft:0, pallets:0, skuCount:0,
    pullDate:"2026-02-16", returnDate:"", chassisDays:2, ssl:"HYU", drayageSource:"m&a",
    handlingCalc:0, handlingRevenue:0, drayageRevenue:495, chassisRevenue:80, storageRevenue:0, shrinkWrapRevenue:0, totalRevenue:575,
    lumperVendor:"", lumperRate:0, lumperCost:0, lumperStatus:"pending", lumperInvoice:"", dateUnloaded:"",
    palletCost:0, maDrayageCost:425, maChassisCost:60, maDrayageTotal:485, maDrayageStatus:"pending", maDrayageInvoice:"",
    totalCost:485, grossMargin:90, billingStatus:"unbilled" },

  { id:45, containerNumber:"KOCU4917503", po:"", period:"Feb Wk3", invoiceNumber:"", arrivalDate:"", eta:"2026-02-17", status:"in_transit", notes:"Currently out — not yet returned.",
    cartons:0, inbCuft:0, billableCuft:0, pallets:0, skuCount:0,
    pullDate:"2026-02-17", returnDate:"", chassisDays:1, ssl:"HYU", drayageSource:"m&a",
    handlingCalc:0, handlingRevenue:0, drayageRevenue:495, chassisRevenue:40, storageRevenue:0, shrinkWrapRevenue:0, totalRevenue:535,
    lumperVendor:"", lumperRate:0, lumperCost:0, lumperStatus:"pending", lumperInvoice:"", dateUnloaded:"",
    palletCost:0, maDrayageCost:425, maChassisCost:30, maDrayageTotal:455, maDrayageStatus:"pending", maDrayageInvoice:"",
    totalCost:455, grossMargin:80, billingStatus:"unbilled" },

  { id:46, containerNumber:"MSBU5090355", po:"", period:"Feb Wk3", invoiceNumber:"", arrivalDate:"", eta:"2026-02-17", status:"in_transit", notes:"Currently out — not yet returned.",
    cartons:0, inbCuft:0, billableCuft:0, pallets:0, skuCount:0,
    pullDate:"2026-02-17", returnDate:"", chassisDays:1, ssl:"MED", drayageSource:"m&a",
    handlingCalc:0, handlingRevenue:0, drayageRevenue:495, chassisRevenue:40, storageRevenue:0, shrinkWrapRevenue:0, totalRevenue:535,
    lumperVendor:"", lumperRate:0, lumperCost:0, lumperStatus:"pending", lumperInvoice:"", dateUnloaded:"",
    palletCost:0, maDrayageCost:425, maChassisCost:30, maDrayageTotal:455, maDrayageStatus:"pending", maDrayageInvoice:"",
    totalCost:455, grossMargin:80, billingStatus:"unbilled" },

  { id:47, containerNumber:"MSDU6013601", po:"", period:"Feb Wk3", invoiceNumber:"", arrivalDate:"", eta:"2026-02-17", status:"in_transit", notes:"Currently out — not yet returned.",
    cartons:0, inbCuft:0, billableCuft:0, pallets:0, skuCount:0,
    pullDate:"2026-02-17", returnDate:"", chassisDays:1, ssl:"MED", drayageSource:"m&a",
    handlingCalc:0, handlingRevenue:0, drayageRevenue:495, chassisRevenue:40, storageRevenue:0, shrinkWrapRevenue:0, totalRevenue:535,
    lumperVendor:"", lumperRate:0, lumperCost:0, lumperStatus:"pending", lumperInvoice:"", dateUnloaded:"",
    palletCost:0, maDrayageCost:425, maChassisCost:30, maDrayageTotal:455, maDrayageStatus:"pending", maDrayageInvoice:"",
    totalCost:455, grossMargin:80, billingStatus:"unbilled" },

  { id:48, containerNumber:"MSDU8047581", po:"", period:"Feb Wk3", invoiceNumber:"", arrivalDate:"", eta:"2026-02-17", status:"in_transit", notes:"Currently out — not yet returned.",
    cartons:0, inbCuft:0, billableCuft:0, pallets:0, skuCount:0,
    pullDate:"2026-02-17", returnDate:"", chassisDays:1, ssl:"MED", drayageSource:"m&a",
    handlingCalc:0, handlingRevenue:0, drayageRevenue:495, chassisRevenue:40, storageRevenue:0, shrinkWrapRevenue:0, totalRevenue:535,
    lumperVendor:"", lumperRate:0, lumperCost:0, lumperStatus:"pending", lumperInvoice:"", dateUnloaded:"",
    palletCost:0, maDrayageCost:425, maChassisCost:30, maDrayageTotal:455, maDrayageStatus:"pending", maDrayageInvoice:"",
    totalCost:455, grossMargin:80, billingStatus:"unbilled" },
];

// ═══════════════════════════════════════════════════════════
// FEBRUARY UNBILLED — pending containers not yet unloaded
// ═══════════════════════════════════════════════════════════
const febUnbilledNumbers = [
  "SUDU8929212","XHCU2852151","MRSU6208488","MRKU5638368","MRKU5989953",
  "MIEU3070978","GCXU5568130","FFAU4623130","CAAU7927088","MRKU4183222",
  "CAAU8050223","TCNU2776513","TGBU5688890","EITU1292657","MRSU7315304",
  "MSKU0075833","MRSU6518272","TCNU2795200","UETU8143144","MSKU1392278",
  "MRSU6395500","MRKU2163567","MRKU4390929","MRKU3807047","MRKU3249053",
  "MRKU6301242","HASU4138822","GAOU7182633","MRKU4118931","FFAU5340665",
  "TCNU4556591","TEMU7315690","TXGU6504711","ZCSU7724219","TRHU4131013",
  "MRKU3920480","MRSU8580616","EITU1664456","EMCU8622287","EITU9564427",
  "TRHU8019790","TGBU7276784","MSMU7842748","MSMU4048502","HMCU9202996",
  "HPCU4902098","EGSU9372875","EGSU1317830","GAOU6296441","HMMU4500998",
];

const febUnbilled: Container[] = febUnbilledNumbers.map((cn, i) => ({
  id: 49 + i,
  containerNumber: cn, po: "", period: "Feb Pending", invoiceNumber: "", arrivalDate: "", eta: "TBD", status: "pending" as ContainerStatus, notes: "NOT YET UNLOADED",
  cartons: 0, inbCuft: 0, billableCuft: 0, pallets: 0, skuCount: 0,
  pullDate: "", returnDate: "", chassisDays: 0, ssl: "", drayageSource: "pending" as DrayageSource,
  handlingCalc: 0, handlingRevenue: 0, drayageRevenue: 495, chassisRevenue: 80, storageRevenue: 0, shrinkWrapRevenue: 0, totalRevenue: 575,
  lumperVendor: "", lumperRate: 0, lumperCost: 0, lumperStatus: "pending" as PayableStatus, lumperInvoice: "", dateUnloaded: "",
  palletCost: 0, maDrayageCost: 425, maChassisCost: 60, maDrayageTotal: 485, maDrayageStatus: "pending" as PayableStatus, maDrayageInvoice: "",
  totalCost: 485, grossMargin: 90, billingStatus: "unbilled" as BillingStatus,
}));

// ═══════════════════════════════════════════════════════════
// MARCH PROJECTED
// ═══════════════════════════════════════════════════════════
const marchProjectedNumbers = [
  "DRYU9540403","ZCSU9047354","MRKU5807745","CXDU2292601","MAGU5626326",
  "TGHU9453849","ONEU1075443","EGSU1270331","UETU6296442","SUDU8981289",
  "TCKU6541739","ZCSU7660813","MSBU6613086",
];

const marchProjected: Container[] = marchProjectedNumbers.map((cn, i) => ({
  id: 99 + i,
  containerNumber: cn, po: "", period: "Mar Projected", invoiceNumber: "", arrivalDate: "", eta: "TBD", status: "projected" as ContainerStatus, notes: "March projected",
  cartons: 0, inbCuft: 0, billableCuft: 0, pallets: 0, skuCount: 0,
  pullDate: "", returnDate: "", chassisDays: 0, ssl: "", drayageSource: "pending" as DrayageSource,
  handlingCalc: 0, handlingRevenue: 0, drayageRevenue: 495, chassisRevenue: 80, storageRevenue: 0, shrinkWrapRevenue: 0, totalRevenue: 575,
  lumperVendor: "", lumperRate: 0, lumperCost: 0, lumperStatus: "pending" as PayableStatus, lumperInvoice: "", dateUnloaded: "",
  palletCost: 0, maDrayageCost: 425, maChassisCost: 60, maDrayageTotal: 485, maDrayageStatus: "pending" as PayableStatus, maDrayageInvoice: "",
  totalCost: 485, grossMargin: 90, billingStatus: "unbilled" as BillingStatus,
}));

// ═══════════════════════════════════════════════════════════
// ALL CONTAINERS
// ═══════════════════════════════════════════════════════════
export const allContainers: Container[] = [
  ...janInbounds,
  ...febWk1,
  ...febWk2,
  ...febWk3,
  ...febUnbilled,
  ...marchProjected,
];

// Helper: get containers by status
export const getByStatus = (status: ContainerStatus) => allContainers.filter(c => c.status === status);
export const getUnloaded = () => allContainers.filter(c => c.status === "unloaded");
export const getPending = () => allContainers.filter(c => c.status === "pending" || c.status === "in_transit" || c.status === "projected");
