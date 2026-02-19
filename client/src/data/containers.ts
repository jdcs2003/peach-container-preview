// All 46 containers from Diamond_Container_Billing_Final.xlsx
// M&A costs from MA-020126 (Week 1) and MA-20260204 (Week 2)
// Fernando unload: $260/container
// Pallets: $4.50/pallet (estimated 20 pallets/container)

export interface Container {
  containerNumber: string;
  poNumber: string;
  eta: string;
  arrivalDate: string;
  totalCartons: number;
  actualCuft: number;
  billableCuft: number;
  ibCalculated: number;
  ibRevenue: number;
  ibNote: string;
  storageMonthly: number;
  skuCount: number;
  // Carrier info
  carrier: string;
  carrierType: "house" | "overflow" | "unknown";
  // M&A drayage costs (from actual invoices)
  pullDate: string;
  returnDate: string;
  chassisDays: number;
  containerFee: number;
  chassisFee: number;
  drayageTotal: number;
  drayageStatus: "paid" | "payable" | "pending" | "no_drayage";
  drayageInvoice: string;
  // Unload costs
  unloadCost: number;
  unloadStatus: "completed" | "in_progress" | "waiting" | "not_required";
  // Revenue
  drayageRevenue: number; // $495 pass-through
  chassisRevenue: number; // $40/day
  handlingRevenue: number; // $550 minimum or $0.15/carton
  storageRevenue: number; // $0.18/cuft/month
  palletRevenue: number; // $2.50/pallet shrink wrap
  totalRevenue: number;
  // Costs
  maDrayageCost: number; // $425/container
  maChassisCost: number; // $30/day
  fernandoUnloadCost: number; // $260/container
  palletCost: number; // $4.50/pallet
  totalCost: number;
  // Margin
  grossMargin: number;
  // Status
  billingStatus: "pending" | "invoiced" | "paid";
  period: string;
}

// Helper to calculate revenue
function calcRevenue(c: {
  totalCartons: number;
  billableCuft: number;
  chassisDays: number;
  carrier: string;
}) {
  const handling = Math.max(c.totalCartons * 0.15, 550);
  const storage = c.billableCuft * 0.18;
  const drayage = c.carrier !== "" ? 495 : 0;
  const chassis = c.chassisDays * 40;
  const pallets = 20 * 2.5; // estimated 20 pallets, $2.50 shrink wrap
  return { handling, storage, drayage, chassis, pallets };
}

// Helper to calculate costs
function calcCosts(c: {
  containerFee: number;
  chassisFee: number;
  carrier: string;
}) {
  const fernando = 260;
  const pallets = 20 * 4.5; // estimated 20 pallets, $4.50/pallet
  return { fernando, pallets };
}

function buildContainer(raw: {
  containerNumber: string;
  poNumber: string;
  eta: string;
  arrivalDate: string;
  totalCartons: number;
  actualCuft: number;
  billableCuft: number;
  skuCount: number;
  carrier: string;
  carrierType: "house" | "overflow" | "unknown";
  pullDate: string;
  returnDate: string;
  chassisDays: number;
  containerFee: number;
  chassisFee: number;
  drayageStatus: "paid" | "payable" | "pending" | "no_drayage";
  drayageInvoice: string;
  unloadStatus: "completed" | "in_progress" | "waiting" | "not_required";
  billingStatus: "pending" | "invoiced" | "paid";
  period: string;
}): Container {
  const ibCalculated = raw.totalCartons * 0.15;
  const ibRevenue = Math.max(ibCalculated, 550);
  const ibNote = ibCalculated < 550 ? "Minimum" : "Calculated";
  const storageMonthly = raw.billableCuft * 0.18;

  const rev = calcRevenue({
    totalCartons: raw.totalCartons,
    billableCuft: raw.billableCuft,
    chassisDays: raw.chassisDays,
    carrier: raw.carrier,
  });

  const drayageRevenue = raw.containerFee > 0 ? 495 : 0;
  const chassisRevenue = raw.chassisDays * 40;
  const handlingRevenue = ibRevenue;
  const storageRevenue = storageMonthly;
  const palletRevenue = 20 * 2.5;

  const totalRevenue = drayageRevenue + chassisRevenue + handlingRevenue + storageRevenue + palletRevenue;

  const maDrayageCost = raw.containerFee;
  const maChassisCost = raw.chassisFee;
  const fernandoUnloadCost = 260;
  const palletCost = 20 * 4.5;
  const totalCost = maDrayageCost + maChassisCost + fernandoUnloadCost + palletCost;

  const grossMargin = totalRevenue - totalCost;

  return {
    ...raw,
    ibCalculated: Math.round(ibCalculated * 100) / 100,
    ibRevenue,
    ibNote,
    storageMonthly: Math.round(storageMonthly * 100) / 100,
    unloadCost: fernandoUnloadCost,
    drayageRevenue,
    chassisRevenue,
    handlingRevenue,
    storageRevenue: Math.round(storageRevenue * 100) / 100,
    palletRevenue,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    maDrayageCost,
    maChassisCost,
    fernandoUnloadCost,
    palletCost,
    drayageTotal: raw.containerFee + raw.chassisFee,
    totalCost: Math.round(totalCost * 100) / 100,
    grossMargin: Math.round(grossMargin * 100) / 100,
  };
}

// ============================================================
// WEEK 1 — M&A Invoice MA-020126 (12 containers, all PAID)
// ============================================================
const week1MA: Container[] = [
  buildContainer({
    containerNumber: "CAAU7482454", poNumber: "5144", eta: "2026-01-28", arrivalDate: "2026-01-28",
    totalCartons: 1431, actualCuft: 2286.53, billableCuft: 2286.53, skuCount: 3,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-01-23", returnDate: "2026-01-29", chassisDays: 7,
    containerFee: 425, chassisFee: 210,
    drayageStatus: "paid", drayageInvoice: "MA-020126",
    unloadStatus: "completed", billingStatus: "invoiced", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "MRKU2402234", poNumber: "5178", eta: "2026-01-19", arrivalDate: "2026-01-23",
    totalCartons: 700, actualCuft: 2387.76, billableCuft: 2387.76, skuCount: 30,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-01-23", returnDate: "2026-01-28", chassisDays: 6,
    containerFee: 425, chassisFee: 180,
    drayageStatus: "paid", drayageInvoice: "MA-020126",
    unloadStatus: "completed", billingStatus: "invoiced", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "MRKU3725416", poNumber: "5064", eta: "2026-01-19", arrivalDate: "2026-01-22",
    totalCartons: 527, actualCuft: 2333.56, billableCuft: 2333.56, skuCount: 33,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-01-22", returnDate: "2026-01-27", chassisDays: 6,
    containerFee: 425, chassisFee: 180,
    drayageStatus: "paid", drayageInvoice: "MA-020126",
    unloadStatus: "completed", billingStatus: "invoiced", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "MRKU5416587", poNumber: "5167", eta: "2026-01-19", arrivalDate: "2026-01-24",
    totalCartons: 2450, actualCuft: 2421.66, billableCuft: 2450.0, skuCount: 28,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-01-23", returnDate: "2026-01-29", chassisDays: 7,
    containerFee: 425, chassisFee: 210,
    drayageStatus: "paid", drayageInvoice: "MA-020126",
    unloadStatus: "completed", billingStatus: "invoiced", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "MRKU5545938", poNumber: "4948", eta: "2026-01-19", arrivalDate: "2026-01-22",
    totalCartons: 2890, actualCuft: 2430.09, billableCuft: 2890.0, skuCount: 40,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-01-22", returnDate: "2026-01-24", chassisDays: 3,
    containerFee: 425, chassisFee: 90,
    drayageStatus: "paid", drayageInvoice: "MA-020126",
    unloadStatus: "completed", billingStatus: "invoiced", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "MRSU4926151", poNumber: "5178", eta: "2026-01-19", arrivalDate: "2026-01-24",
    totalCartons: 700, actualCuft: 2387.76, billableCuft: 2387.76, skuCount: 25,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-01-23", returnDate: "2026-01-29", chassisDays: 7,
    containerFee: 425, chassisFee: 210,
    drayageStatus: "paid", drayageInvoice: "MA-020126",
    unloadStatus: "completed", billingStatus: "invoiced", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "MSKU1928437", poNumber: "5178", eta: "2026-01-19", arrivalDate: "2026-01-24",
    totalCartons: 700, actualCuft: 2387.76, billableCuft: 2387.76, skuCount: 25,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-01-23", returnDate: "2026-01-28", chassisDays: 6,
    containerFee: 425, chassisFee: 180,
    drayageStatus: "paid", drayageInvoice: "MA-020126",
    unloadStatus: "completed", billingStatus: "invoiced", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "ONEU1919230", poNumber: "5112", eta: "2026-01-28", arrivalDate: "2026-01-27",
    totalCartons: 919, actualCuft: 2296.59, billableCuft: 2296.59, skuCount: 31,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-01-27", returnDate: "2026-01-28", chassisDays: 2,
    containerFee: 425, chassisFee: 60,
    drayageStatus: "paid", drayageInvoice: "MA-020126",
    unloadStatus: "completed", billingStatus: "invoiced", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "ONEU5253590", poNumber: "5112", eta: "2026-01-28", arrivalDate: "",
    totalCartons: 919, actualCuft: 2296.59, billableCuft: 2296.59, skuCount: 1,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-01-28", returnDate: "2026-01-30", chassisDays: 3,
    containerFee: 425, chassisFee: 90,
    drayageStatus: "paid", drayageInvoice: "MA-020126",
    unloadStatus: "completed", billingStatus: "invoiced", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "SUDU8795010", poNumber: "5064", eta: "2026-01-19", arrivalDate: "2026-01-24",
    totalCartons: 527, actualCuft: 2333.56, billableCuft: 2333.56, skuCount: 27,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-01-23", returnDate: "2026-01-26", chassisDays: 4,
    containerFee: 425, chassisFee: 120,
    drayageStatus: "paid", drayageInvoice: "MA-020126",
    unloadStatus: "completed", billingStatus: "invoiced", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "TCNU8150661", poNumber: "5087", eta: "2026-01-19", arrivalDate: "2026-01-23",
    totalCartons: 1669, actualCuft: 2214.27, billableCuft: 2214.27, skuCount: 40,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-01-23", returnDate: "2026-01-24", chassisDays: 2,
    containerFee: 425, chassisFee: 60,
    drayageStatus: "paid", drayageInvoice: "MA-020126",
    unloadStatus: "completed", billingStatus: "invoiced", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "TRHU5016591", poNumber: "5144", eta: "2026-01-28", arrivalDate: "2026-01-28",
    totalCartons: 938, actualCuft: 2263.65, billableCuft: 2263.65, skuCount: 1,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-01-23", returnDate: "2026-01-30", chassisDays: 8,
    containerFee: 425, chassisFee: 240,
    drayageStatus: "paid", drayageInvoice: "MA-020126",
    unloadStatus: "completed", billingStatus: "invoiced", period: "Week 1",
  }),
];

// ============================================================
// WEEK 1 — Non-M&A containers (Overflow Capacity / other)
// ============================================================
const week1Other: Container[] = [
  buildContainer({
    containerNumber: "BMOU4244012", poNumber: "5117", eta: "2026-01-21", arrivalDate: "2026-01-24",
    totalCartons: 1019, actualCuft: 2330.31, billableCuft: 2330.31, skuCount: 37,
    carrier: "Overflow Capacity", carrierType: "overflow",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "CAAU8340789", poNumber: "4983", eta: "2026-01-22", arrivalDate: "2026-01-26",
    totalCartons: 1684, actualCuft: 1992.45, billableCuft: 2095.8, skuCount: 30,
    carrier: "Overflow Capacity", carrierType: "overflow",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "WHSU9015409", poNumber: "4974", eta: "2026-01-23", arrivalDate: "2026-01-28",
    totalCartons: 1742, actualCuft: 2113.54, billableCuft: 2204.39, skuCount: 29,
    carrier: "Overflow Capacity", carrierType: "overflow",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "MSNU6630666", poNumber: "4924", eta: "2026-01-22", arrivalDate: "",
    totalCartons: 2700, actualCuft: 1912.84, billableCuft: 2916.39, skuCount: 3,
    carrier: "Overflow Capacity", carrierType: "overflow",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "waiting", billingStatus: "pending", period: "Week 1",
  }),
];

// ============================================================
// WEEK 1 — Containers with no carrier listed but in billing
// ============================================================
const week1Unassigned: Container[] = [
  buildContainer({
    containerNumber: "MRSU6846097", poNumber: "4971", eta: "2026-01-28", arrivalDate: "2026-01-28",
    totalCartons: 2492, actualCuft: 2053.16, billableCuft: 3056.3, skuCount: 6,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "TXGU6089924", poNumber: "5111", eta: "2026-01-28", arrivalDate: "2026-01-28",
    totalCartons: 1367, actualCuft: 2191.16, billableCuft: 2191.16, skuCount: 3,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "GAOU6261430", poNumber: "5111", eta: "2026-01-28", arrivalDate: "2026-01-28",
    totalCartons: 1368, actualCuft: 2192.44, billableCuft: 2192.44, skuCount: 3,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "EGSU9909460", poNumber: "5111", eta: "2026-01-28", arrivalDate: "2026-01-28",
    totalCartons: 830, actualCuft: 2282.35, billableCuft: 2282.35, skuCount: 1,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "TGHU5213217", poNumber: "4923", eta: "2026-01-28", arrivalDate: "2026-01-28",
    totalCartons: 1110, actualCuft: 2046.56, billableCuft: 2046.56, skuCount: 2,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "EGHU9666372", poNumber: "5111", eta: "2026-01-28", arrivalDate: "2026-01-28",
    totalCartons: 830, actualCuft: 2282.35, billableCuft: 2282.35, skuCount: 1,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "TCNU7918159", poNumber: "5101", eta: "2026-01-28", arrivalDate: "2026-01-28",
    totalCartons: 1330, actualCuft: 2286.55, billableCuft: 2286.55, skuCount: 3,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "SEKU4713410", poNumber: "5101", eta: "2026-01-28", arrivalDate: "2026-01-28",
    totalCartons: 1170, actualCuft: 2292.11, billableCuft: 2292.11, skuCount: 3,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "HASU4886399", poNumber: "5101", eta: "2026-01-28", arrivalDate: "2026-01-28",
    totalCartons: 1976, actualCuft: 2268.67, billableCuft: 2337.32, skuCount: 5,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 1",
  }),
  buildContainer({
    containerNumber: "CAIU6454234", poNumber: "4511", eta: "2026-01-23", arrivalDate: "",
    totalCartons: 327, actualCuft: 944.32, billableCuft: 944.32, skuCount: 1,
    carrier: "Overflow Capacity", carrierType: "overflow",
    pullDate: "2026-02-02", returnDate: "2026-02-03", chassisDays: 2,
    containerFee: 425, chassisFee: 60,
    drayageStatus: "paid", drayageInvoice: "MA-20260204",
    unloadStatus: "waiting", billingStatus: "pending", period: "Week 1",
  }),
];

// ============================================================
// WEEK 2 — M&A Invoice MA-20260204 NEW RETURNS (8 containers)
// ============================================================
const week2MA: Container[] = [
  buildContainer({
    containerNumber: "YMLU9580270", poNumber: "4798", eta: "2026-01-28", arrivalDate: "",
    totalCartons: 970, actualCuft: 2678.98, billableCuft: 2691.8, skuCount: 5,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-01-30", returnDate: "2026-02-02", chassisDays: 4,
    containerFee: 425, chassisFee: 120,
    drayageStatus: "payable", drayageInvoice: "MA-20260204",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 2",
  }),
  buildContainer({
    containerNumber: "JXLU6414630", poNumber: "4876", eta: "2026-01-28", arrivalDate: "",
    totalCartons: 686, actualCuft: 2340.24, billableCuft: 2340.24, skuCount: 2,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-02-02", returnDate: "2026-02-03", chassisDays: 2,
    containerFee: 425, chassisFee: 60,
    drayageStatus: "payable", drayageInvoice: "MA-20260204",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 2",
  }),
  buildContainer({
    containerNumber: "ZCSU7553498", poNumber: "4876", eta: "2026-01-28", arrivalDate: "",
    totalCartons: 645, actualCuft: 2376.38, billableCuft: 2376.38, skuCount: 1,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-02-02", returnDate: "2026-02-03", chassisDays: 2,
    containerFee: 425, chassisFee: 60,
    drayageStatus: "payable", drayageInvoice: "MA-20260204",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 2",
  }),
  buildContainer({
    containerNumber: "CAAU9375558", poNumber: "4999", eta: "2026-02-02", arrivalDate: "",
    totalCartons: 680, actualCuft: 2507.76, billableCuft: 2507.76, skuCount: 1,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-02-02", returnDate: "2026-02-04", chassisDays: 3,
    containerFee: 425, chassisFee: 90,
    drayageStatus: "payable", drayageInvoice: "MA-20260204",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 2",
  }),
  buildContainer({
    containerNumber: "MRSU3625003", poNumber: "4999", eta: "2026-02-02", arrivalDate: "",
    totalCartons: 480, actualCuft: 2345.66, billableCuft: 2345.66, skuCount: 1,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-02-03", returnDate: "2026-02-04", chassisDays: 2,
    containerFee: 425, chassisFee: 60,
    drayageStatus: "payable", drayageInvoice: "MA-20260204",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 2",
  }),
  buildContainer({
    containerNumber: "EGSU6378289", poNumber: "4910", eta: "2026-02-01", arrivalDate: "",
    totalCartons: 1100, actualCuft: 2243.49, billableCuft: 2440.55, skuCount: 2,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-02-03", returnDate: "2026-02-04", chassisDays: 2,
    containerFee: 425, chassisFee: 60,
    drayageStatus: "payable", drayageInvoice: "MA-20260204",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 2",
  }),
  buildContainer({
    containerNumber: "TCNU7052887", poNumber: "5160", eta: "2026-02-02", arrivalDate: "",
    totalCartons: 1644, actualCuft: 1832.66, billableCuft: 2064.63, skuCount: 6,
    carrier: "M&A Transport", carrierType: "house",
    pullDate: "2026-02-03", returnDate: "2026-02-04", chassisDays: 2,
    containerFee: 425, chassisFee: 60,
    drayageStatus: "payable", drayageInvoice: "MA-20260204",
    unloadStatus: "completed", billingStatus: "pending", period: "Week 2",
  }),
];

// ============================================================
// WEEK 2+ — Containers not yet on M&A invoices
// ============================================================
const week2Pending: Container[] = [
  buildContainer({
    containerNumber: "JXLU4402179", poNumber: "4876", eta: "2026-01-28", arrivalDate: "",
    totalCartons: 515, actualCuft: 2325.27, billableCuft: 2325.27, skuCount: 1,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "waiting", billingStatus: "pending", period: "Week 2",
  }),
  buildContainer({
    containerNumber: "NYKU5104769", poNumber: "4457", eta: "2026-01-28", arrivalDate: "",
    totalCartons: 1487, actualCuft: 2307.78, billableCuft: 2307.78, skuCount: 2,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "waiting", billingStatus: "pending", period: "Week 2",
  }),
  buildContainer({
    containerNumber: "EITU9171292", poNumber: "4910", eta: "2026-02-01", arrivalDate: "",
    totalCartons: 1500, actualCuft: 2287.76, billableCuft: 2287.76, skuCount: 3,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "waiting", billingStatus: "pending", period: "Week 2",
  }),
  buildContainer({
    containerNumber: "MRKU4377655", poNumber: "4999", eta: "2026-02-02", arrivalDate: "",
    totalCartons: 540, actualCuft: 2071.53, billableCuft: 2071.53, skuCount: 3,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "waiting", billingStatus: "pending", period: "Week 2",
  }),
  buildContainer({
    containerNumber: "MRSU7312429", poNumber: "4999", eta: "2026-02-02", arrivalDate: "",
    totalCartons: 680, actualCuft: 2496.62, billableCuft: 2496.62, skuCount: 1,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "waiting", billingStatus: "pending", period: "Week 2",
  }),
  buildContainer({
    containerNumber: "TRHU4341597", poNumber: "5147", eta: "2026-02-02", arrivalDate: "",
    totalCartons: 2670, actualCuft: 2265.43, billableCuft: 3057.35, skuCount: 8,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "waiting", billingStatus: "pending", period: "Week 2",
  }),
  buildContainer({
    containerNumber: "TRHU4848410", poNumber: "5214", eta: "2026-02-02", arrivalDate: "",
    totalCartons: 2565, actualCuft: 2402.17, billableCuft: 2675.97, skuCount: 3,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "waiting", billingStatus: "pending", period: "Week 2",
  }),
  buildContainer({
    containerNumber: "MRSU8376705", poNumber: "5214", eta: "2026-02-02", arrivalDate: "",
    totalCartons: 2545, actualCuft: 2352.8, billableCuft: 2646.96, skuCount: 2,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "waiting", billingStatus: "pending", period: "Week 2",
  }),
];

// ============================================================
// WEEK 3 — Feb 7 ETA containers
// ============================================================
const week3: Container[] = [
  buildContainer({
    containerNumber: "TXGU8533128", poNumber: "5136", eta: "2026-02-07", arrivalDate: "",
    totalCartons: 1282, actualCuft: 2400.88, billableCuft: 2412.71, skuCount: 8,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "waiting", billingStatus: "pending", period: "Week 3",
  }),
  buildContainer({
    containerNumber: "HMMU6542760", poNumber: "5136", eta: "2026-02-07", arrivalDate: "",
    totalCartons: 1282, actualCuft: 2400.88, billableCuft: 2412.71, skuCount: 8,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "waiting", billingStatus: "pending", period: "Week 3",
  }),
  buildContainer({
    containerNumber: "HMMU4264969", poNumber: "5136", eta: "2026-02-07", arrivalDate: "",
    totalCartons: 1281, actualCuft: 2399.59, billableCuft: 2411.39, skuCount: 8,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "waiting", billingStatus: "pending", period: "Week 3",
  }),
  buildContainer({
    containerNumber: "HMMU6867832", poNumber: "5036", eta: "2026-02-07", arrivalDate: "",
    totalCartons: 1856, actualCuft: 2296.12, billableCuft: 2380.31, skuCount: 8,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "waiting", billingStatus: "pending", period: "Week 3",
  }),
  buildContainer({
    containerNumber: "KOCU4917503", poNumber: "4953", eta: "2026-02-07", arrivalDate: "",
    totalCartons: 1160, actualCuft: 2388.65, billableCuft: 2388.65, skuCount: 2,
    carrier: "", carrierType: "unknown",
    pullDate: "", returnDate: "", chassisDays: 0,
    containerFee: 0, chassisFee: 0,
    drayageStatus: "pending", drayageInvoice: "",
    unloadStatus: "waiting", billingStatus: "pending", period: "Week 3",
  }),
];

export const allContainers: Container[] = [
  ...week1MA,
  ...week1Other,
  ...week1Unassigned,
  ...week2MA,
  ...week2Pending,
  ...week3,
];

// Summary stats
export function getStats() {
  const total = allContainers.length;
  const totalCartons = allContainers.reduce((s, c) => s + c.totalCartons, 0);
  const totalRevenue = allContainers.reduce((s, c) => s + c.totalRevenue, 0);
  const totalCost = allContainers.reduce((s, c) => s + c.totalCost, 0);
  const grossMargin = totalRevenue - totalCost;
  const pendingBilling = allContainers.filter(c => c.billingStatus === "pending").length;
  const waitingUnload = allContainers.filter(c => c.unloadStatus === "waiting").length;
  const completedUnload = allContainers.filter(c => c.unloadStatus === "completed").length;
  const maPaid = allContainers.filter(c => c.drayageStatus === "paid").length;
  const maPayable = allContainers.filter(c => c.drayageStatus === "payable").length;
  const maPending = allContainers.filter(c => c.drayageStatus === "pending").length;
  const totalMACost = allContainers.reduce((s, c) => s + c.maDrayageCost + c.maChassisCost, 0);
  const totalFernandoCost = allContainers.reduce((s, c) => s + c.fernandoUnloadCost, 0);
  const ibHandlingTotal = allContainers.reduce((s, c) => s + c.handlingRevenue, 0);
  const storageTotal = allContainers.reduce((s, c) => s + c.storageRevenue, 0);

  return {
    total, totalCartons, totalRevenue, totalCost, grossMargin,
    pendingBilling, waitingUnload, completedUnload,
    maPaid, maPayable, maPending, totalMACost, totalFernandoCost,
    ibHandlingTotal, storageTotal,
  };
}

// M&A Invoice summaries
export const maInvoices = [
  {
    invoiceNumber: "MA-020126",
    invoiceDate: "2026-02-01",
    containers: 12,
    containerFees: 5100,
    chassisFees: 1830,
    total: 6930,
    status: "paid" as const,
    chassisDays: 61,
  },
  {
    invoiceNumber: "MA-20260204",
    invoiceDate: "2026-02-04",
    containers: 8,
    containerFees: 3400,
    chassisFees: 570,
    total: 3970,
    status: "payable" as const,
    chassisDays: 19,
    previouslyPaid: 5630,
    previousContainers: 10,
  },
];
