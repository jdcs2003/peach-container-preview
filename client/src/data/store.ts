/**
 * Central state management with localStorage persistence.
 * All containers, invoices live here. Billing auto-calculated.
 */
import { SEED_CONTAINERS, RATES, calcBilling, type Container } from "./containers";

export type { Container };
export { RATES, calcBilling };

// ═══════════════════════════════════════════════════════════
// INVOICE TYPES
// ═══════════════════════════════════════════════════════════
export interface LumperInvoiceLine {
  container: string;
  cartons: number;
  skuCount: number;
  rate: number;
  unloadDate: string;
}

export interface LumperInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  vendor: string;
  status: "paid" | "due" | "draft";
  lines: LumperInvoiceLine[];
  total: number;
}

export interface DrayageInvoiceLine {
  container: string;
  pickup: string;
  returnDate: string;
  chassisDays: number;
  containerFee: number;
  chassisFee: number;
  total: number;
}

export interface DrayageInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  vendor: string;
  status: "paid" | "due" | "draft";
  lines: DrayageInvoiceLine[];
  total: number;
}

// ═══════════════════════════════════════════════════════════
// OUTBOUND (Freddy) INVOICE TYPES
// ═══════════════════════════════════════════════════════════
export interface OutboundLine {
  date: string;
  cases: number;
  orders: number;
  labelPay: number;   // cases * 0.13
  pickPay: number;    // cases * 0.10
  comp: number;       // labelPay + pickPay
}

export interface OutboundInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  vendor: string;
  status: "paid" | "due" | "draft";
  lines: OutboundLine[];
  totalCases: number;
  totalOrders: number;
  totalLabelPay: number;
  totalPickPay: number;
  poFee: number;        // totalOrders * 2.50
  total: number;        // totalLabelPay + totalPickPay + poFee
  notes: string;
}

export interface ClientInvoiceLine {
  container: string;
  po: string;
  cartons: number;
  billableCuft: number;
  pallets: number;
  chassisDays: number;
  handlingRevenue: number;
  storageRevenue: number;
  drayageRevenue: number;
  chassisRevenue: number;
  shrinkWrapRevenue: number;
  totalRevenue: number;
}

export interface ClientInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  client: string;
  period: string;
  status: "sent" | "paid" | "draft";
  lines: ClientInvoiceLine[];
  total: number;
}

// ═══════════════════════════════════════════════════════════
// MONTHLY STORAGE MINIMUM
// ═══════════════════════════════════════════════════════════
export interface MonthlyStorageSummary {
  month: string;
  actualStorageCuft: number;
  actualStorageRevenue: number;
  minimumThreshold: number;
  minimumApplies: boolean;
  billedStorage: number;
  minimumTopUp: number;
  containerCount: number;
  proRateDiscount: number;
  netStorage: number;
}

export function calculateMonthlyStorage(
  containers: Container[],
  monthlyMin: number = RATES.monthlyStorageMinTotal,
  proRates: Record<string, number> = { "Jan 2026": 5388.60 }
): MonthlyStorageSummary[] {
  const byMonth: Record<string, Container[]> = {};
  const monthMap: Record<string, string> = {
    jan: "Jan 2026", feb: "Feb 2026", mar: "Mar 2026", apr: "Apr 2026",
  };
  for (const c of containers) {
    if (!["unloaded", "billed", "returned-to-pier"].includes(c.status)) continue;
    const firstWord = (c.period || "").split(" ")[0].toLowerCase();
    const monthKey = monthMap[firstWord] || `${(c.period || "").split(" ")[0]} 2026`;
    if (!monthKey || monthKey === " 2026") continue;
    if (!byMonth[monthKey]) byMonth[monthKey] = [];
    byMonth[monthKey].push(c);
  }

  return ["Jan 2026", "Feb 2026", "Mar 2026"]
    .map((month) => {
      const mc = byMonth[month] || [];
      const actualCuft = mc.reduce((s, c) => s + c.billableCuft, 0);
      const actualRev = mc.reduce((s, c) => s + c.storageRevenue, 0);
      const minApplies = actualRev < monthlyMin;
      const billed = Math.max(actualRev, monthlyMin);
      const topUp = minApplies ? monthlyMin - actualRev : 0;
      const proRate = proRates[month] || 0;
      return {
        month,
        actualStorageCuft: +actualCuft.toFixed(2),
        actualStorageRevenue: +actualRev.toFixed(2),
        minimumThreshold: monthlyMin,
        minimumApplies: minApplies,
        billedStorage: +billed.toFixed(2),
        minimumTopUp: +topUp.toFixed(2),
        containerCount: mc.length,
        proRateDiscount: proRate,
        netStorage: +(billed - proRate).toFixed(2),
      };
    })
    .filter((m) => m.containerCount > 0 || m.proRateDiscount > 0);
}

// ═══════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════
const KEYS = {
  containers: "pw_containers_v11",
  lumperInvoices: "pw_lumper_v11",
  drayageInvoices: "pw_drayage_v11",
  clientInvoices: "pw_client_v11",
  outboundInvoices: "pw_outbound_v11",
  initialized: "pw_init_v11",
};

// ═══════════════════════════════════════════════════════════
// SEED INVOICES from actual data
// ═══════════════════════════════════════════════════════════
function buildSeedLumperInvoices(containers: Container[]): LumperInvoice[] {
  // REAL Freddy invoices from actual submitted files — do NOT auto-batch
  const byId = new Map(containers.map((c) => [c.container, c]));
  const makeLine = (id: string): LumperInvoiceLine | null => {
    const c = byId.get(id);
    if (!c) return null;
    return { container: c.container, cartons: c.cartons, skuCount: c.skuCount, rate: c.fernandoRate, unloadDate: c.fernandoUnloadDate };
  };

  // Batch 1: WE01242026 — 9 containers, $2,600 PAID
  const batch1Ids = [
    "MRKU5545938", "MRKU3725416", "MRKU2402234", "TCNU8150661", "MSKU1928437",
    "MRSU4926151", "SUDU8795010", "BMOU4244012", "MRKU5416587",
  ];
  // Batch 2: FP-20260205 — 15 containers, $4,200 PAID
  const batch2Ids = [
    "CAAU8340789", "WHSU9015409", "ONEU1919230", "MSNU6630666", "ONEU5253590",
    "SEKU4713410", "CAAU7482454", "TRHU5016591", "NYKU5104769", "JXLU4402179",
    "EGHU9666372", "TXGU6089924", "TCNU7918159", "YMLU9580270", "HASU4886399",
  ];
  // Batch 3: FP-20260211 — 13 containers, $3,580 DUE
  const batch3Ids = [
    "JXLU6414630", "ZCSU7553498", "CAIU6454234", "CAAU9375558", "EGSU6378289",
    "MRSU3625003", "TCNU7052887", "EITU9171292", "MRSU8376705", "TRHU4848410",
    "MRKU4377655", "MRSU7312429", "TRHU4341597",
  ];
  // Batch 4: FP-WE021426 — 3 containers + waiting time, $980 DUE
  const batch4Ids = ["MSNU8718946", "ZCSU6594851", "FFAU6666281"];
  // Batch 5: FP-Invoice-0221 — 21 containers, $6,420 DUE
  const batch5Ids = [
    "HMMU6542760", "TXGU8533128", "HMMU4264969", "MSDU8047581", "KOCU4917503",
    "HMMU6867832", "MSDU6013601", "MRKU3807047", "MSBU5090355", "MRKU4118931",
    "TCNU2795200", "MRKU2163567", "MRKU6301242", "CAAU8050223", "TCNU2776513",
    "MRKU4183222", "GCXU5568130", "TGBU5688890", "MRSU7315304", "FFAU4623130",
    "CAAU7927088",
  ];

  const invoices: LumperInvoice[] = [];
  const buildInv = (ids: string[], num: string, date: string, status: "paid" | "due", extraTotal = 0): LumperInvoice | null => {
    const lines = ids.map(makeLine).filter(Boolean) as LumperInvoiceLine[];
    if (lines.length === 0) return null;
    return {
      invoiceNumber: num, invoiceDate: date, vendor: "Fernando Palma", status, lines,
      total: lines.reduce((s, l) => s + l.rate, 0) + extraTotal,
    };
  };

  const inv1 = buildInv(batch1Ids, "FP-WE01242026", "2026-01-24", "paid");
  if (inv1) invoices.push(inv1);
  const inv2 = buildInv(batch2Ids, "FP-20260205", "2026-02-05", "paid");
  if (inv2) invoices.push(inv2);
  const inv3 = buildInv(batch3Ids, "FP-20260211", "2026-02-11", "paid", 539.02); // +$539.02 outbound shipping
  if (inv3) invoices.push(inv3);
  const inv4 = buildInv(batch4Ids, "FP-WE021426", "2026-02-14", "due", 757.19); // +$200 waiting + $557.19 outbound
  if (inv4) invoices.push(inv4);
  const inv5 = buildInv(batch5Ids, "FP-20260221", "2026-02-21", "due");
  if (inv5) invoices.push(inv5);

  return invoices;
}

function buildSeedDrayageInvoices(containers: Container[]): DrayageInvoice[] {
  const byId = new Map(containers.map((c) => [c.container, c]));
  const makeLine = (id: string): DrayageInvoiceLine | null => {
    const c = byId.get(id);
    if (!c) return null;
    return {
      container: c.container, pickup: c.maPickup, returnDate: c.maReturn,
      chassisDays: c.maChassisDays, containerFee: c.maDrayageCost,
      chassisFee: c.maChassisCost, total: c.maDrayageCost + c.maChassisCost,
    };
  };

  // Batch 1: MA-20260201 — 10 containers, $5,630 PAID
  const batch1Ids = [
    "MRKU5545938", "MRKU3725416", "TCNU8150661", "MRKU2402234",
    "MRSU4926151", "MSKU1928437", "MRKU5416587", "SUDU8795010",
    "ONEU1919230", "ONEU5253590",
  ];
  // Batch 2: MA-20260204 — 8 containers, $3,970 PAID
  const batch2Ids = [
    "YMLU9580270", "JXLU6414630", "ZCSU7553498", "CAAU9375558",
    "CAIU6454234", "MRSU3625003", "EGSU6378289", "TCNU7052887",
  ];
  // Batch 3: Paid 021726 — 15 containers, $8,325 PAID
  const batch3Ids = [
    "CAAU8340789", "MSNU6630666", "NYKU5104769", "JXLU4402179",
    "EITU9171292", "MRKU4377655", "MRSU8376705", "TRHU4848410",
    "MRSU7312429", "TRHU4341597", "FFAU6666281", "ZCSU6594851",
    "MSNU8718946", "HMMU4264969", "HMMU6542760",
    "HMMU6867832", "TXGU8533128", "KOCU4917503",
    "MSBU5090355", "MSDU6013601", "MSDU8047581",
  ];
  // Parma Transport — 2 containers, $1,200 PAID
  const parmaIds = ["BMOU4244012", "WHSU9015409"];

  const invoices: DrayageInvoice[] = [];

  const buildInv = (ids: string[], num: string, date: string, vendor: string, status: "paid" | "due"): DrayageInvoice | null => {
    const lines = ids.map(makeLine).filter(Boolean) as DrayageInvoiceLine[];
    if (lines.length === 0) return null;
    return {
      invoiceNumber: num, invoiceDate: date, vendor, status, lines,
      total: lines.reduce((s, l) => s + l.total, 0),
    };
  };

  const inv1 = buildInv(batch1Ids, "MA-20260201", "2026-01-22", "M&A Transport", "paid");
  if (inv1) invoices.push(inv1);
  const inv2 = buildInv(batch2Ids, "MA-20260204", "2026-02-03", "M&A Transport", "paid");
  if (inv2) invoices.push(inv2);
  const inv3 = buildInv(batch3Ids, "MA-20260217", "2026-02-12", "M&A Transport", "paid");
  if (inv3) invoices.push(inv3);
  // MA-20260217-OUT removed — phantom invoice, containers go to Ready to Batch
  const invParma = buildInv(parmaIds, "PARMA-20260201", "2026-01-22", "Parma Transport", "paid");
  if (invParma) invoices.push(invParma);

  return invoices;
}

// ═══════════════════════════════════════════════════════════
// STORE CLASS
// ═══════════════════════════════════════════════════════════
class Store {
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (!localStorage.getItem(KEYS.initialized)) {
      this.seedAll();
    }
  }

  private seedAll() {
    localStorage.setItem(KEYS.containers, JSON.stringify(SEED_CONTAINERS));
    localStorage.setItem(KEYS.lumperInvoices, JSON.stringify(buildSeedLumperInvoices(SEED_CONTAINERS)));
    localStorage.setItem(KEYS.drayageInvoices, JSON.stringify(buildSeedDrayageInvoices(SEED_CONTAINERS)));
    localStorage.setItem(KEYS.clientInvoices, JSON.stringify([]));
    localStorage.setItem(KEYS.initialized, "true");
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }
  private notify() {
    Array.from(this.listeners).forEach((fn) => fn());
  }

  // ── Containers ──
  getContainers(): Container[] {
    try { return JSON.parse(localStorage.getItem(KEYS.containers) || "[]"); }
    catch { return []; }
  }

  getContainer(id: string): Container | undefined {
    return this.getContainers().find((c) => c.container === id || c.id === id);
  }

  addContainer(data: Partial<Container>): Container {
    const containers = this.getContainers();
    const calculated = calcBilling(data) as Container;
    const now = new Date().toISOString();
    const initStatus = data.status || "pending";
    const initTimestamps = data.statusTimestamps || {};
    // Auto-set timestamp for the initial status
    if (!initTimestamps.pending && initStatus === "pending") initTimestamps.pending = now;
    const newC: Container = {
      id: data.container || data.id || `C-${Date.now()}`,
      container: data.container || "",
      status: initStatus as Container["status"],
      statusTimestamps: initTimestamps,
      eta: data.eta || "",
      period: data.period || "",
      po: data.po || "",
      cartons: data.cartons || 0,
      skuCount: data.skuCount || 0,
      pallets: calculated.pallets || 0,
      billableCuft: calculated.billableCuft || 0,
      billed: false,
      billingPeriod: data.period || "",
      inExtensiv: data.inExtensiv ?? true,
      plReceived: data.plReceived ?? false,
      doReceived: data.doReceived ?? false,
      handlingRevenue: calculated.handlingRevenue || 0,
      storageRevenue: calculated.storageRevenue || 0,
      drayageRevenue: calculated.drayageRevenue || 0,
      chassisRevenue: calculated.chassisRevenue || 0,
      shrinkWrapRevenue: calculated.shrinkWrapRevenue || 0,
      totalRevenue: calculated.totalRevenue || 0,
      fernandoRate: data.fernandoRate || RATES.fernandoBaseRate,
      fernandoTotal: data.fernandoRate || RATES.fernandoBaseRate,
      fernandoUnloadDate: data.fernandoUnloadDate || "",
      maDrayageCost: calculated.maDrayageCost || 0,
      maChassisCost: calculated.maChassisCost || 0,
      maChassisDays: data.maChassisDays || 0,
      maPickup: data.maPickup || "",
      maReturn: data.maReturn || "",
      palletCost: calculated.palletCost || 0,
      totalCost: calculated.totalCost || 0,
      grossMargin: calculated.grossMargin || 0,
      notes: data.notes || "",
      carrier: data.carrier || "M&A Transport",
    };
    containers.push(newC);
    localStorage.setItem(KEYS.containers, JSON.stringify(containers));
    this.notify();
    return newC;
  }

  updateContainer(id: string, updates: Partial<Container>): Container | null {
    const containers = this.getContainers();
    const idx = containers.findIndex((c) => c.container === id || c.id === id);
    if (idx === -1) return null;
    const existing = containers[idx];
    // Safe status change — NEVER clear existing data when status changes
    // Only update the status field and add timestamps
    const merged = { ...existing, ...updates };
    // Ensure statusTimestamps exists
    merged.statusTimestamps = { ...(existing.statusTimestamps || {}), ...(updates.statusTimestamps || {}) };
    const calculated = calcBilling(merged) as Container;
    containers[idx] = { ...merged, ...calculated };
    localStorage.setItem(KEYS.containers, JSON.stringify(containers));
    this.notify();
    return containers[idx];
  }

  /** Change container status with timestamp tracking and auto-assign logic */
  changeStatus(id: string, newStatus: Container["status"], unloadDate?: string): Container | null {
    const c = this.getContainer(id);
    if (!c) return null;
    const now = new Date().toISOString();
    const timestamps: Record<string, string | undefined> = { ...(c.statusTimestamps || {}) };

    // Status progression order for auto-assign
    const FLOW = [
      { status: "pending", tsKey: "pending" },
      { status: "on-the-water", tsKey: "onTheWater" },
      { status: "available-for-pickup", tsKey: "availableForPickup" },
      { status: "in-transit", tsKey: "inTransit" },
      { status: "unloaded", tsKey: "unloaded" },
      { status: "returned-to-pier", tsKey: "returnedToPier" },
    ] as const;

    const targetIdx = FLOW.findIndex((f) => f.status === newStatus);

    if (newStatus === "returned-to-pier") {
      // Auto-assign all previous statuses with timestamps if not already set
      for (let i = 0; i <= targetIdx; i++) {
        if (!timestamps[FLOW[i].tsKey]) {
          timestamps[FLOW[i].tsKey] = now;
        }
      }
    } else if (targetIdx >= 0) {
      // Set timestamp for this status
      timestamps[FLOW[targetIdx].tsKey] = now;
    }

    // For unloaded status, set the fernandoUnloadDate
    const updates: Partial<Container> = {
      status: newStatus,
      statusTimestamps: timestamps,
    };

    if (newStatus === "unloaded" || newStatus === "returned-to-pier") {
      if (!c.fernandoUnloadDate) {
        updates.fernandoUnloadDate = unloadDate || new Date().toISOString().split("T")[0];
      }
    }

    return this.updateContainer(id, updates);
  }

  /** Mark container as arrived/unloaded — auto-generates payable records */
  markUnloaded(id: string, data: {
    cartons: number;
    skuCount: number;
    pallets?: number;
    fernandoRate?: number;
    fernandoUnloadDate: string;
    maPickup?: string;
    maReturn?: string;
    maChassisDays?: number;
  }): Container | null {
    return this.updateContainer(id, {
      ...data,
      status: "unloaded",
      fernandoTotal: data.fernandoRate || RATES.fernandoBaseRate,
    });
  }

  /** Toggle inbound tracking fields */
  toggleTracking(id: string, field: "inExtensiv" | "plReceived" | "doReceived"): void {
    const c = this.getContainer(id);
    if (!c) return;
    this.updateContainer(id, { [field]: !c[field] });
  }

  /** Batch import from Extensiv — returns { added, changed, unchanged } */
  importExtensiv(rows: Array<{
    container: string;
    status: string;
    arrival: string;
    po: string;
    cartons: number;
    skuCount: number;
    notes: string;
  }>): { added: string[]; changed: Array<{ container: string; field: string; old: string; new_: string }[]>; unchanged: string[] } {
    const containers = this.getContainers();
    const byId = new Map(containers.map((c) => [c.container, c]));
    const added: string[] = [];
    const changed: Array<{ container: string; field: string; old: string; new_: string }[]> = [];
    const unchanged: string[] = [];

    for (const row of rows) {
      const existing = byId.get(row.container);
      if (!existing) {
        added.push(row.container);
        continue;
      }
      // Check for changes
      const diffs: { container: string; field: string; old: string; new_: string }[] = [];
      const statusMap: Record<string, string> = {
        RECEIVED: "unloaded",
        "IN TRANSIT": "on-the-water",
        CANCELED: "canceled",
      };
      const mappedStatus = statusMap[row.status] || row.status;
      if (existing.status !== mappedStatus && mappedStatus !== existing.status) {
        diffs.push({ container: row.container, field: "status", old: existing.status, new_: mappedStatus });
      }
      if (row.cartons > 0 && existing.cartons !== row.cartons) {
        diffs.push({ container: row.container, field: "cartons", old: String(existing.cartons), new_: String(row.cartons) });
      }
      if (row.po && existing.po !== row.po) {
        diffs.push({ container: row.container, field: "po", old: existing.po, new_: row.po });
      }
      if (row.arrival && existing.eta !== row.arrival) {
        diffs.push({ container: row.container, field: "eta", old: existing.eta, new_: row.arrival });
      }
      if (diffs.length > 0) {
        changed.push(diffs);
      } else {
        unchanged.push(row.container);
      }
    }
    return { added, changed, unchanged };
  }

  /** Apply an Extensiv import — add new containers */
  applyExtensivImport(rows: Array<{
    container: string;
    status: string;
    arrival: string;
    po: string;
    cartons: number;
    skuCount: number;
    notes: string;
  }>): void {
    const statusMap: Record<string, Container["status"]> = {
      RECEIVED: "unloaded",
      "IN TRANSIT": "on-the-water",
      CANCELED: "canceled",
    };
    for (const row of rows) {
      const existing = this.getContainer(row.container);
      if (existing) continue;
      // Derive period from arrival date
      let period = "";
      if (row.arrival) {
        try {
          const d = new Date(row.arrival);
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const day = d.getDate();
          const wk = day <= 7 ? "Wk1" : day <= 14 ? "Wk2" : day <= 21 ? "Wk3" : "Wk4";
          period = `${months[d.getMonth()]} ${wk}`;
        } catch { /* ignore */ }
      }
      const mappedStatus = statusMap[row.status] || "pending";
      // When imported as received/unloaded, set the unload date from arrival
      let unloadDate = "";
      if (mappedStatus === "unloaded" && row.arrival) {
        try {
          const d = new Date(row.arrival);
          unloadDate = d.toISOString().split("T")[0];
        } catch { /* ignore */ }
      }
      this.addContainer({
        container: row.container,
        status: mappedStatus,
        eta: row.arrival,
        period,
        po: row.po,
        cartons: row.cartons,
        skuCount: row.skuCount,
        notes: row.notes,
        inExtensiv: true,
        fernandoUnloadDate: unloadDate,
      });
    }
  }

  /** Apply a single change from Extensiv diff */
  applyExtensivChange(container: string, field: string, value: string): void {
    const updates: Partial<Container> = {};
    if (field === "status") {
      updates.status = value as Container["status"];
      // When status changes to unloaded/returned-to-pier, auto-set fernandoUnloadDate
      if (value === "unloaded" || value === "returned-to-pier") {
        const existing = this.getContainer(container);
        if (existing && !existing.fernandoUnloadDate) {
          // Use the container's ETA as the unload date
          updates.fernandoUnloadDate = existing.eta ? new Date(existing.eta).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        }
      }
    }
    else if (field === "cartons") updates.cartons = parseInt(value) || 0;
    else if (field === "po") updates.po = value;
    else if (field === "eta") updates.eta = value;
    this.updateContainer(container, updates);
  }

  // ── Lumper Invoices ──
  getLumperInvoices(): LumperInvoice[] {
    try { return JSON.parse(localStorage.getItem(KEYS.lumperInvoices) || "[]"); }
    catch { return []; }
  }

  createLumperInvoice(invoice: LumperInvoice): void {
    const invoices = this.getLumperInvoices();
    invoices.push(invoice);
    localStorage.setItem(KEYS.lumperInvoices, JSON.stringify(invoices));
    this.notify();
  }

  markLumperPaid(invoiceNumber: string): void {
    const invoices = this.getLumperInvoices();
    const inv = invoices.find((i) => i.invoiceNumber === invoiceNumber);
    if (inv) {
      inv.status = "paid";
      localStorage.setItem(KEYS.lumperInvoices, JSON.stringify(invoices));
      this.notify();
    }
  }

  deleteLumperInvoice(invoiceNumber: string): void {
    const invoices = this.getLumperInvoices().filter((i) => i.invoiceNumber !== invoiceNumber);
    localStorage.setItem(KEYS.lumperInvoices, JSON.stringify(invoices));
    this.notify();
  }

  removeContainerFromLumperInvoice(invoiceNumber: string, containerId: string): void {
    const invoices = this.getLumperInvoices();
    const inv = invoices.find((i) => i.invoiceNumber === invoiceNumber);
    if (!inv) return;
    inv.lines = inv.lines.filter((l) => l.container !== containerId);
    inv.total = inv.lines.reduce((s, l) => s + l.rate, 0);
    if (inv.lines.length === 0) {
      // Remove empty invoice entirely
      const filtered = invoices.filter((i) => i.invoiceNumber !== invoiceNumber);
      localStorage.setItem(KEYS.lumperInvoices, JSON.stringify(filtered));
    } else {
      localStorage.setItem(KEYS.lumperInvoices, JSON.stringify(invoices));
    }
    this.notify();
  }

  // ── Drayage Invoices ──
  getDrayageInvoices(): DrayageInvoice[] {
    try { return JSON.parse(localStorage.getItem(KEYS.drayageInvoices) || "[]"); }
    catch { return []; }
  }

  createDrayageInvoice(invoice: DrayageInvoice): void {
    const invoices = this.getDrayageInvoices();
    invoices.push(invoice);
    localStorage.setItem(KEYS.drayageInvoices, JSON.stringify(invoices));
    this.notify();
  }

  markDrayagePaid(invoiceNumber: string): void {
    const invoices = this.getDrayageInvoices();
    const inv = invoices.find((i) => i.invoiceNumber === invoiceNumber);
    if (inv) {
      inv.status = "paid";
      localStorage.setItem(KEYS.drayageInvoices, JSON.stringify(invoices));
      this.notify();
    }
  }

  deleteDrayageInvoice(invoiceNumber: string): void {
    const invoices = this.getDrayageInvoices().filter((i) => i.invoiceNumber !== invoiceNumber);
    localStorage.setItem(KEYS.drayageInvoices, JSON.stringify(invoices));
    this.notify();
  }

  removeContainerFromDrayageInvoice(invoiceNumber: string, containerId: string): void {
    const invoices = this.getDrayageInvoices();
    const inv = invoices.find((i) => i.invoiceNumber === invoiceNumber);
    if (!inv) return;
    inv.lines = inv.lines.filter((l) => l.container !== containerId);
    inv.total = inv.lines.reduce((s, l) => s + l.total, 0);
    if (inv.lines.length === 0) {
      const filtered = invoices.filter((i) => i.invoiceNumber !== invoiceNumber);
      localStorage.setItem(KEYS.drayageInvoices, JSON.stringify(filtered));
    } else {
      localStorage.setItem(KEYS.drayageInvoices, JSON.stringify(invoices));
    }
    this.notify();
  }

  // ── Outbound (Freddy) Invoices ──
  getOutboundInvoices(): OutboundInvoice[] {
    try { return JSON.parse(localStorage.getItem(KEYS.outboundInvoices) || "[]"); }
    catch { return []; }
  }

  createOutboundInvoice(inv: OutboundInvoice): void {
    const invoices = this.getOutboundInvoices();
    invoices.push(inv);
    localStorage.setItem(KEYS.outboundInvoices, JSON.stringify(invoices));
    this.notify();
  }

  markOutboundPaid(invoiceNumber: string): void {
    const invoices = this.getOutboundInvoices();
    const inv = invoices.find((i) => i.invoiceNumber === invoiceNumber);
    if (inv) { inv.status = "paid"; localStorage.setItem(KEYS.outboundInvoices, JSON.stringify(invoices)); this.notify(); }
  }

  deleteOutboundInvoice(invoiceNumber: string): void {
    const invoices = this.getOutboundInvoices().filter((i) => i.invoiceNumber !== invoiceNumber);
    localStorage.setItem(KEYS.outboundInvoices, JSON.stringify(invoices));
    this.notify();
  }

  // ── Client Invoices ──
  getClientInvoices(): ClientInvoice[] {
    try { return JSON.parse(localStorage.getItem(KEYS.clientInvoices) || "[]"); }
    catch { return []; }
  }

  createClientInvoice(invoice: ClientInvoice): void {
    const invoices = this.getClientInvoices();
    invoices.push(invoice);
    localStorage.setItem(KEYS.clientInvoices, JSON.stringify(invoices));
    // Mark containers as billed
    const containers = this.getContainers();
    for (const line of invoice.lines) {
      const idx = containers.findIndex((c) => c.container === line.container);
      if (idx !== -1) {
        containers[idx].billed = true;
        containers[idx].billingPeriod = invoice.period;
      }
    }
    localStorage.setItem(KEYS.containers, JSON.stringify(containers));
    this.notify();
  }

  // ── Monthly Storage ──
  getMonthlyStorageSummary(): MonthlyStorageSummary[] {
    return calculateMonthlyStorage(this.getContainers());
  }

  // ── Export DO Tracker format ──
  exportDOTracker(): Array<{
    container: string;
    inExtensiv: string;
    plReceived: string;
    doReceived: string;
    eta: string;
    status: string;
    cartons: number;
    po: string;
    actionNeeded: string;
  }> {
    return this.getContainers()
      .filter((c) => c.status !== "canceled")
      .map((c) => {
        const actions: string[] = [];
        if (!c.inExtensiv) actions.push("Add to Extensiv");
        if (!c.plReceived) actions.push("Need PL");
        if (!c.doReceived) actions.push("Need DO");
        if (c.status === "pending" || c.status === "in-transit") actions.push("Awaiting arrival");
        return {
          container: c.container,
          inExtensiv: c.inExtensiv ? "YES" : "NO",
          plReceived: c.plReceived ? "YES" : "NO",
          doReceived: c.doReceived ? "YES" : "NO",
          eta: c.eta,
          status: c.status.toUpperCase(),
          cartons: c.cartons,
          po: c.po,
          actionNeeded: actions.length > 0 ? actions.join(", ") : "Complete",
        };
      });
  }

  // ── Find invoices for a container ──
  getInvoicesForContainer(containerId: string): { lumper: { invoiceNumber: string; status: string } | null; drayage: { invoiceNumber: string; status: string } | null; client: { invoiceNumber: string; status: string } | null } {
    const lumperInvs = this.getLumperInvoices();
    const drayageInvs = this.getDrayageInvoices();
    const clientInvs = this.getClientInvoices();
    const lumper = lumperInvs.find((i) => i.lines.some((l) => l.container === containerId));
    const drayage = drayageInvs.find((i) => i.lines.some((l) => l.container === containerId));
    const client = clientInvs.find((i) => i.lines.some((l) => l.container === containerId));
    return {
      lumper: lumper ? { invoiceNumber: lumper.invoiceNumber, status: lumper.status } : null,
      drayage: drayage ? { invoiceNumber: drayage.invoiceNumber, status: drayage.status } : null,
      client: client ? { invoiceNumber: client.invoiceNumber, status: client.status } : null,
    };
  }

  // ── Reset ──
  resetToSeed(): void {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    this.seedAll();
    this.notify();
  }
}

export const store = new Store();
