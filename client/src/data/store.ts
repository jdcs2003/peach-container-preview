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
    if (!["unloaded", "billed", "received"].includes(c.status)) continue;
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
  containers: "pw_containers_v3",
  lumperInvoices: "pw_lumper_v3",
  drayageInvoices: "pw_drayage_v3",
  clientInvoices: "pw_client_v3",
  initialized: "pw_init_v3",
};

// ═══════════════════════════════════════════════════════════
// SEED INVOICES from actual data
// ═══════════════════════════════════════════════════════════
function buildSeedLumperInvoices(containers: Container[]): LumperInvoice[] {
  // Group unloaded containers by week for Fernando invoices
  const byWeek: Record<string, Container[]> = {};
  for (const c of containers) {
    if (c.fernandoUnloadDate && c.status !== "canceled") {
      const wk = c.period || "Unknown";
      if (!byWeek[wk]) byWeek[wk] = [];
      byWeek[wk].push(c);
    }
  }
  const invoices: LumperInvoice[] = [];
  const sortedWeeks = Object.keys(byWeek).sort();
  let invNum = 1;
  for (const wk of sortedWeeks) {
    const cs = byWeek[wk];
    const lines: LumperInvoiceLine[] = cs.map((c) => ({
      container: c.container,
      cartons: c.cartons,
      skuCount: c.skuCount,
      rate: c.fernandoRate,
      unloadDate: c.fernandoUnloadDate,
    }));
    const total = lines.reduce((s, l) => s + l.rate, 0);
    invoices.push({
      invoiceNumber: `FP-2026-${String(invNum).padStart(3, "0")}`,
      invoiceDate: cs[0]?.fernandoUnloadDate || "",
      vendor: "Fernando Palma",
      status: wk.startsWith("Jan") || wk === "Feb Wk1" || wk === "Feb Wk2" ? "paid" : "due",
      lines,
      total,
    });
    invNum++;
  }
  return invoices;
}

function buildSeedDrayageInvoices(containers: Container[]): DrayageInvoice[] {
  // Group by M&A pickup batches
  const withMA = containers.filter((c) => c.maPickup);
  if (withMA.length === 0) return [];
  
  // Group by pickup week
  const byWeek: Record<string, Container[]> = {};
  for (const c of withMA) {
    const d = new Date(c.maPickup);
    const wk = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
    if (!byWeek[wk]) byWeek[wk] = [];
    byWeek[wk].push(c);
  }
  
  const invoices: DrayageInvoice[] = [];
  let invNum = 1;
  for (const wk of Object.keys(byWeek).sort()) {
    const cs = byWeek[wk];
    const lines: DrayageInvoiceLine[] = cs.map((c) => ({
      container: c.container,
      pickup: c.maPickup,
      returnDate: c.maReturn,
      chassisDays: c.maChassisDays,
      containerFee: c.maDrayageCost,
      chassisFee: c.maChassisCost,
      total: c.maDrayageCost + c.maChassisCost,
    }));
    invoices.push({
      invoiceNumber: `MA-2026-${String(invNum).padStart(3, "0")}`,
      invoiceDate: cs[0]?.maPickup || "",
      vendor: "M&A Transport",
      status: "paid",
      lines,
      total: lines.reduce((s, l) => s + l.total, 0),
    });
    invNum++;
  }
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
    const newC: Container = {
      id: data.container || data.id || `C-${Date.now()}`,
      container: data.container || "",
      status: data.status || "pending",
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
    const merged = { ...containers[idx], ...updates };
    const calculated = calcBilling(merged) as Container;
    containers[idx] = { ...merged, ...calculated };
    localStorage.setItem(KEYS.containers, JSON.stringify(containers));
    this.notify();
    return containers[idx];
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
        "IN TRANSIT": "in-transit",
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
      "IN TRANSIT": "in-transit",
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
      this.addContainer({
        container: row.container,
        status: statusMap[row.status] || "pending",
        eta: row.arrival,
        period,
        po: row.po,
        cartons: row.cartons,
        skuCount: row.skuCount,
        notes: row.notes,
        inExtensiv: true,
      });
    }
  }

  /** Apply a single change from Extensiv diff */
  applyExtensivChange(container: string, field: string, value: string): void {
    const updates: Partial<Container> = {};
    if (field === "status") updates.status = value as Container["status"];
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

  // ── Reset ──
  resetToSeed(): void {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    this.seedAll();
    this.notify();
  }
}

export const store = new Store();
