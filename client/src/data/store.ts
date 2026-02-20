/**
 * Central state management with localStorage persistence.
 * All containers, lumper invoices, and drayage invoices live here.
 * Billing calculations are auto-generated from container data.
 */
import { allContainers as seedContainers, RATES, type Container, type ContainerStatus, type BillingStatus, type PayableStatus, type DrayageSource } from "./containers";
import { lumperInvoices as seedLumperInvoices, type LumperInvoice } from "./lumperInvoices";

// ═══════════════════════════════════════════════════════════
// RE-EXPORT TYPES
// ═══════════════════════════════════════════════════════════
export type { Container, ContainerStatus, BillingStatus, PayableStatus, DrayageSource, LumperInvoice };
export { RATES };

// ═══════════════════════════════════════════════════════════
// DRAYAGE INVOICE TYPE
// ═══════════════════════════════════════════════════════════
export interface DrayageInvoiceContainer {
  containerNumber: string;
  pullDate: string;
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
  status: "paid" | "due";
  containers: DrayageInvoiceContainer[];
  total: number;
}

// ═══════════════════════════════════════════════════════════
// CLIENT INVOICE TYPE (bill to Diamond Home)
// ═══════════════════════════════════════════════════════════
export interface ClientInvoiceLine {
  containerNumber: string;
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
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════
const KEYS = {
  containers: "pw_containers",
  lumperInvoices: "pw_lumper_invoices",
  drayageInvoices: "pw_drayage_invoices",
  clientInvoices: "pw_client_invoices",
  initialized: "pw_initialized_v2",
};

// ═══════════════════════════════════════════════════════════
// BILLING CALCULATOR
// ═══════════════════════════════════════════════════════════
export function calculateBilling(c: Partial<Container>): Partial<Container> {
  const cartons = c.cartons || 0;
  const inbCuft = c.inbCuft || 0;
  const pallets = c.pallets || 0;
  const chassisDays = c.chassisDays || 0;
  const lumperRate = c.lumperRate || RATES.unloadFernando;

  // Billable cuft = max(inbCuft, cartons × 1.3)
  const billableCuft = c.billableCuft || Math.max(inbCuft, cartons * RATES.minCuftPerCase);

  // Revenue
  const handlingCalc = cartons * RATES.handling;
  const handlingRevenue = Math.max(handlingCalc, RATES.handlingMin);
  const storageRevenue = Math.round(billableCuft * RATES.storage * 100) / 100;
  const drayageRevenue = (c.drayageSource && c.drayageSource !== "pending") ? RATES.drayageBill : 0;
  const chassisRevenue = chassisDays * RATES.chassisBill;
  const shrinkWrapRevenue = pallets * RATES.shrinkWrap;
  const totalRevenue = handlingRevenue + storageRevenue + drayageRevenue + chassisRevenue + shrinkWrapRevenue;

  // Costs
  const lumperCost = (c.status === "unloaded" || c.status === "received") ? lumperRate : 0;
  const palletCost = pallets * RATES.palletCost;
  const maDrayageCost = (c.drayageSource === "m&a") ? RATES.drayagePay : 0;
  const maChassisCost = (c.drayageSource === "m&a") ? chassisDays * RATES.chassisPay : 0;
  const maDrayageTotal = maDrayageCost + maChassisCost;
  const totalCost = lumperCost + palletCost + maDrayageTotal;

  return {
    ...c,
    billableCuft,
    handlingCalc,
    handlingRevenue,
    storageRevenue,
    drayageRevenue,
    chassisRevenue,
    shrinkWrapRevenue,
    totalRevenue,
    lumperCost,
    palletCost,
    maDrayageCost,
    maChassisCost,
    maDrayageTotal,
    totalCost,
    grossMargin: totalRevenue - totalCost,
  };
}

// ═══════════════════════════════════════════════════════════
// SEED DRAYAGE INVOICES
// ═══════════════════════════════════════════════════════════
const seedDrayageInvoices: DrayageInvoice[] = [
  {
    invoiceNumber: "MA-20260201",
    invoiceDate: "2026-02-01",
    vendor: "M&A Transport",
    status: "paid",
    containers: seedContainers
      .filter(c => c.maDrayageInvoice === "MA-20260201")
      .map(c => ({
        containerNumber: c.containerNumber,
        pullDate: c.pullDate,
        returnDate: c.returnDate,
        chassisDays: c.chassisDays,
        containerFee: c.maDrayageCost,
        chassisFee: c.maChassisCost,
        total: c.maDrayageTotal,
      })),
    total: seedContainers.filter(c => c.maDrayageInvoice === "MA-20260201").reduce((s, c) => s + c.maDrayageTotal, 0),
  },
  {
    invoiceNumber: "MA-20260204",
    invoiceDate: "2026-02-04",
    vendor: "M&A Transport",
    status: "paid",
    containers: seedContainers
      .filter(c => c.maDrayageInvoice === "MA-20260204")
      .map(c => ({
        containerNumber: c.containerNumber,
        pullDate: c.pullDate,
        returnDate: c.returnDate,
        chassisDays: c.chassisDays,
        containerFee: c.maDrayageCost,
        chassisFee: c.maChassisCost,
        total: c.maDrayageTotal,
      })),
    total: seedContainers.filter(c => c.maDrayageInvoice === "MA-20260204").reduce((s, c) => s + c.maDrayageTotal, 0),
  },
];

// ═══════════════════════════════════════════════════════════
// STORE CLASS
// ═══════════════════════════════════════════════════════════
class Store {
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Seed data on first load
    if (!localStorage.getItem(KEYS.initialized)) {
      localStorage.setItem(KEYS.containers, JSON.stringify(seedContainers));
      localStorage.setItem(KEYS.lumperInvoices, JSON.stringify(seedLumperInvoices));
      localStorage.setItem(KEYS.drayageInvoices, JSON.stringify(seedDrayageInvoices));
      localStorage.setItem(KEYS.clientInvoices, JSON.stringify([]));
      localStorage.setItem(KEYS.initialized, "true");
    }
  }

  // ── Subscriptions ──
  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }
  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // ── Containers ──
  getContainers(): Container[] {
    try {
      return JSON.parse(localStorage.getItem(KEYS.containers) || "[]");
    } catch { return []; }
  }

  getContainer(containerNumber: string): Container | undefined {
    return this.getContainers().find(c => c.containerNumber === containerNumber);
  }

  addContainer(data: Partial<Container>): Container {
    const containers = this.getContainers();
    const maxId = containers.reduce((m, c) => Math.max(m, c.id), 0);
    const calculated = calculateBilling(data);
    const newContainer: Container = {
      id: maxId + 1,
      containerNumber: data.containerNumber || "",
      po: data.po || "",
      period: data.period || "",
      invoiceNumber: data.invoiceNumber || "",
      arrivalDate: data.arrivalDate || "",
      eta: data.eta || "",
      status: data.status || "pending",
      notes: data.notes || "",
      cartons: data.cartons || 0,
      inbCuft: data.inbCuft || 0,
      billableCuft: calculated.billableCuft || 0,
      pallets: data.pallets || 0,
      skuCount: data.skuCount || 0,
      pullDate: data.pullDate || "",
      returnDate: data.returnDate || "",
      chassisDays: data.chassisDays || 0,
      ssl: data.ssl || "",
      drayageSource: data.drayageSource || "m&a",
      handlingCalc: calculated.handlingCalc || 0,
      handlingRevenue: calculated.handlingRevenue || 0,
      drayageRevenue: calculated.drayageRevenue || 0,
      chassisRevenue: calculated.chassisRevenue || 0,
      storageRevenue: calculated.storageRevenue || 0,
      shrinkWrapRevenue: calculated.shrinkWrapRevenue || 0,
      totalRevenue: calculated.totalRevenue || 0,
      lumperVendor: data.lumperVendor || "Fernando Palma",
      lumperRate: data.lumperRate || RATES.unloadFernando,
      lumperCost: calculated.lumperCost || 0,
      lumperStatus: data.lumperStatus || "pending",
      lumperInvoice: data.lumperInvoice || "",
      dateUnloaded: data.dateUnloaded || "",
      palletCost: calculated.palletCost || 0,
      maDrayageCost: calculated.maDrayageCost || 0,
      maChassisCost: calculated.maChassisCost || 0,
      maDrayageTotal: calculated.maDrayageTotal || 0,
      maDrayageStatus: data.maDrayageStatus || "pending",
      maDrayageInvoice: data.maDrayageInvoice || "",
      totalCost: calculated.totalCost || 0,
      grossMargin: calculated.grossMargin || 0,
      billingStatus: data.billingStatus || "unbilled",
    };
    containers.push(newContainer);
    localStorage.setItem(KEYS.containers, JSON.stringify(containers));
    this.notify();
    return newContainer;
  }

  updateContainer(containerNumber: string, updates: Partial<Container>): Container | null {
    const containers = this.getContainers();
    const idx = containers.findIndex(c => c.containerNumber === containerNumber);
    if (idx === -1) return null;

    const merged = { ...containers[idx], ...updates };
    const calculated = calculateBilling(merged);
    const updated: Container = {
      ...merged,
      billableCuft: calculated.billableCuft || merged.billableCuft,
      handlingCalc: calculated.handlingCalc || 0,
      handlingRevenue: calculated.handlingRevenue || 0,
      drayageRevenue: calculated.drayageRevenue || 0,
      chassisRevenue: calculated.chassisRevenue || 0,
      storageRevenue: calculated.storageRevenue || 0,
      shrinkWrapRevenue: calculated.shrinkWrapRevenue || 0,
      totalRevenue: calculated.totalRevenue || 0,
      lumperCost: calculated.lumperCost || 0,
      palletCost: calculated.palletCost || 0,
      maDrayageCost: calculated.maDrayageCost || 0,
      maChassisCost: calculated.maChassisCost || 0,
      maDrayageTotal: calculated.maDrayageTotal || 0,
      totalCost: calculated.totalCost || 0,
      grossMargin: calculated.grossMargin || 0,
    };
    containers[idx] = updated;
    localStorage.setItem(KEYS.containers, JSON.stringify(containers));
    this.notify();
    return updated;
  }

  /** Mark container as arrived/unloaded — auto-generates M&A and lumper payable records */
  markArrived(containerNumber: string, data: {
    arrivalDate: string;
    cartons: number;
    inbCuft: number;
    pallets: number;
    skuCount: number;
    pullDate: string;
    returnDate: string;
    chassisDays: number;
    ssl: string;
    lumperVendor: string;
    lumperRate: number;
    dateUnloaded: string;
  }): Container | null {
    return this.updateContainer(containerNumber, {
      ...data,
      status: "unloaded",
      drayageSource: "m&a",
      lumperStatus: "due",
      maDrayageStatus: "due",
    });
  }

  // ── Lumper Invoices ──
  getLumperInvoices(): LumperInvoice[] {
    try {
      return JSON.parse(localStorage.getItem(KEYS.lumperInvoices) || "[]");
    } catch { return []; }
  }

  createLumperInvoice(invoice: LumperInvoice): void {
    const invoices = this.getLumperInvoices();
    invoices.push(invoice);
    localStorage.setItem(KEYS.lumperInvoices, JSON.stringify(invoices));
    // Update container references
    const containers = this.getContainers();
    for (const line of invoice.containers) {
      const idx = containers.findIndex(c => c.containerNumber === line.containerNumber);
      if (idx !== -1) {
        containers[idx].lumperInvoice = invoice.invoiceNumber;
        containers[idx].lumperStatus = "due";
      }
    }
    localStorage.setItem(KEYS.containers, JSON.stringify(containers));
    this.notify();
  }

  markLumperInvoicePaid(invoiceNumber: string): void {
    const invoices = this.getLumperInvoices();
    const inv = invoices.find(i => i.invoiceNumber === invoiceNumber);
    if (inv) {
      inv.status = "paid";
      localStorage.setItem(KEYS.lumperInvoices, JSON.stringify(invoices));
      // Update containers
      const containers = this.getContainers();
      for (const line of inv.containers) {
        const idx = containers.findIndex(c => c.containerNumber === line.containerNumber);
        if (idx !== -1) containers[idx].lumperStatus = "paid";
      }
      localStorage.setItem(KEYS.containers, JSON.stringify(containers));
      this.notify();
    }
  }

  // ── Drayage Invoices ──
  getDrayageInvoices(): DrayageInvoice[] {
    try {
      return JSON.parse(localStorage.getItem(KEYS.drayageInvoices) || "[]");
    } catch { return []; }
  }

  createDrayageInvoice(invoice: DrayageInvoice): void {
    const invoices = this.getDrayageInvoices();
    invoices.push(invoice);
    localStorage.setItem(KEYS.drayageInvoices, JSON.stringify(invoices));
    // Update container references
    const containers = this.getContainers();
    for (const line of invoice.containers) {
      const idx = containers.findIndex(c => c.containerNumber === line.containerNumber);
      if (idx !== -1) {
        containers[idx].maDrayageInvoice = invoice.invoiceNumber;
        containers[idx].maDrayageStatus = "due";
      }
    }
    localStorage.setItem(KEYS.containers, JSON.stringify(containers));
    this.notify();
  }

  markDrayageInvoicePaid(invoiceNumber: string): void {
    const invoices = this.getDrayageInvoices();
    const inv = invoices.find(i => i.invoiceNumber === invoiceNumber);
    if (inv) {
      inv.status = "paid";
      localStorage.setItem(KEYS.drayageInvoices, JSON.stringify(invoices));
      const containers = this.getContainers();
      for (const line of inv.containers) {
        const idx = containers.findIndex(c => c.containerNumber === line.containerNumber);
        if (idx !== -1) containers[idx].maDrayageStatus = "paid";
      }
      localStorage.setItem(KEYS.containers, JSON.stringify(containers));
      this.notify();
    }
  }

  // ── Client Invoices ──
  getClientInvoices(): ClientInvoice[] {
    try {
      return JSON.parse(localStorage.getItem(KEYS.clientInvoices) || "[]");
    } catch { return []; }
  }

  createClientInvoice(invoice: ClientInvoice): void {
    const invoices = this.getClientInvoices();
    invoices.push(invoice);
    localStorage.setItem(KEYS.clientInvoices, JSON.stringify(invoices));
    // Mark containers as billed
    const containers = this.getContainers();
    for (const line of invoice.lines) {
      const idx = containers.findIndex(c => c.containerNumber === line.containerNumber);
      if (idx !== -1) {
        containers[idx].billingStatus = "billed";
        containers[idx].invoiceNumber = invoice.invoiceNumber;
      }
    }
    localStorage.setItem(KEYS.containers, JSON.stringify(containers));
    this.notify();
  }

  // ── Reset ──
  resetToSeed(): void {
    localStorage.removeItem(KEYS.initialized);
    localStorage.removeItem(KEYS.containers);
    localStorage.removeItem(KEYS.lumperInvoices);
    localStorage.removeItem(KEYS.drayageInvoices);
    localStorage.removeItem(KEYS.clientInvoices);
    // Re-seed
    localStorage.setItem(KEYS.containers, JSON.stringify(seedContainers));
    localStorage.setItem(KEYS.lumperInvoices, JSON.stringify(seedLumperInvoices));
    localStorage.setItem(KEYS.drayageInvoices, JSON.stringify(seedDrayageInvoices));
    localStorage.setItem(KEYS.clientInvoices, JSON.stringify([]));
    localStorage.setItem(KEYS.initialized, "true");
    this.notify();
  }
}

export const store = new Store();
