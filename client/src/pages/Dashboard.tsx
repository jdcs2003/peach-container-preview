import Layout from "@/components/Layout";
import { store, RATES, type Container } from "@/data/store";
import { useStore } from "@/hooks/useStore";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import {
  Package, DollarSign, TrendingUp, TrendingDown, Truck, HardHat,
  Clock, AlertCircle, CheckCircle2, ArrowUpRight, Warehouse, AlertTriangle,
  BarChart3, Download, ChevronUp, ChevronDown, Filter, X
} from "lucide-react";
import { exportContainersToExcel, exportCustomerView } from "@/lib/exportExcel";
import { toast } from "sonner";

const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n);

const ALL_STATUSES = ["unloaded", "billed", "in-transit", "received", "pending", "projected", "on-hold", "canceled"] as const;

const STATUS_COLORS: Record<string, string> = {
  unloaded: "bg-emerald-100 text-emerald-700",
  billed: "bg-blue-100 text-blue-700",
  "in-transit": "bg-amber-100 text-amber-700",
  received: "bg-teal-100 text-teal-700",
  pending: "bg-slate-100 text-slate-600",
  projected: "bg-purple-100 text-purple-600",
  canceled: "bg-red-100 text-red-600",
  "on-hold": "bg-orange-100 text-orange-700",
};

function StatusBadge({ status }: { status: string }) {
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_COLORS[status] || "bg-gray-100"}`}>{status}</span>;
}

type SortKey = "container" | "status" | "period" | "eta" | "cartons" | "cuft" | "revenue" | "cost" | "margin" | "billed";
type SortDir = "asc" | "desc";

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (column !== sortKey) return <ChevronUp className="w-3 h-3 opacity-20 inline ml-0.5" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3 h-3 text-primary inline ml-0.5" />
    : <ChevronDown className="w-3 h-3 text-primary inline ml-0.5" />;
}

function sortContainers(list: Container[], key: SortKey, dir: SortDir): Container[] {
  const sorted = [...list].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "container": cmp = a.container.localeCompare(b.container); break;
      case "status": cmp = a.status.localeCompare(b.status); break;
      case "period": cmp = a.period.localeCompare(b.period); break;
      case "eta": cmp = (a.eta || "").localeCompare(b.eta || ""); break;
      case "cartons": cmp = a.cartons - b.cartons; break;
      case "cuft": cmp = a.billableCuft - b.billableCuft; break;
      case "revenue": cmp = a.totalRevenue - b.totalRevenue; break;
      case "cost": cmp = a.totalCost - b.totalCost; break;
      case "margin": cmp = a.grossMargin - b.grossMargin; break;
      case "billed": cmp = (a.billed ? 1 : 0) - (b.billed ? 1 : 0); break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

export default function Dashboard() {
  const containers = useStore(() => store.getContainers());
  const monthlyStorage = useStore(() => store.getMonthlyStorageSummary());
  const lumperInvoices = useStore(() => store.getLumperInvoices());
  const drayageInvoices = useStore(() => store.getDrayageInvoices());

  const [sortKey, setSortKey] = useState<SortKey>("container");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [showBulkBar, setShowBulkBar] = useState(false);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const active = containers.filter((c) => c.status !== "canceled");
  const unloaded = active.filter((c) => c.status === "unloaded" || c.status === "billed");
  const inTransit = active.filter((c) => c.status === "in-transit");
  const pending = active.filter((c) => c.status === "pending" || c.status === "projected");
  const onHold = active.filter((c) => c.status === "on-hold");
  const unbilled = active.filter((c) => !c.billed && (c.status === "unloaded" || c.status === "received"));

  const totalRev = active.reduce((s, c) => s + c.totalRevenue, 0);
  const totalCost = active.reduce((s, c) => s + c.totalCost, 0);
  const storageTopUp = monthlyStorage.reduce((s, m) => s + m.minimumTopUp, 0);
  const storageProRate = monthlyStorage.reduce((s, m) => s + m.proRateDiscount, 0);
  const netStorageAdj = storageTopUp - storageProRate;
  const adjustedRev = totalRev + netStorageAdj;
  const margin = adjustedRev - totalCost;

  const lumperPaid = lumperInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const lumperDue = lumperInvoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  const drayagePaid = drayageInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const drayageDue = drayageInvoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0);

  // Filter + sort
  const filtered = statusFilter === "all"
    ? active
    : statusFilter === "canceled"
      ? containers.filter((c) => c.status === "canceled")
      : active.filter((c) => c.status === statusFilter);
  const sorted = useMemo(() => sortContainers(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
    setShowBulkBar(next.size > 0);
  };

  const toggleAll = () => {
    if (selected.size === sorted.length) {
      setSelected(new Set());
      setShowBulkBar(false);
    } else {
      setSelected(new Set(sorted.map((c) => c.container)));
      setShowBulkBar(true);
    }
  };

  const applyBulkStatus = () => {
    if (!bulkStatus || selected.size === 0) return;
    selected.forEach((cid) => {
      store.updateContainer(cid, { status: bulkStatus as any });
    });
    toast.success(`Updated ${selected.size} containers to "${bulkStatus}"`);
    setSelected(new Set());
    setShowBulkBar(false);
    setBulkStatus("");
  };

  const thClass = "px-3 py-2 font-medium cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap";

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Container Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Diamond Home — SC-144 · {active.length} containers · {unbilled.length} unbilled
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/container/new">
              <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90">+ Add Container</button>
            </Link>
            <Link href="/extensiv-import">
              <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent">Import Extensiv</button>
            </Link>
            <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent" onClick={() => { exportContainersToExcel(active); toast.success("Exported all columns"); }}>
              <Download className="w-3.5 h-3.5 inline mr-1" />Export All
            </button>
            <button className="px-3 py-1.5 text-sm bg-[#1F4E79] text-white rounded-md hover:opacity-90" onClick={() => { exportCustomerView(active); toast.success("Exported DO Tracker for client"); }}>
              <Download className="w-3.5 h-3.5 inline mr-1" />Customer View
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {[
            { label: "Total", value: active.length, icon: Package, color: "text-blue-600", bg: "bg-blue-50", border: "border-l-blue-500" },
            { label: "Unloaded", value: unloaded.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-l-emerald-500" },
            { label: "In Transit", value: inTransit.length, icon: Truck, color: "text-amber-600", bg: "bg-amber-50", border: "border-l-amber-500" },
            { label: "Pending", value: pending.length, icon: Clock, color: "text-slate-500", bg: "bg-slate-50", border: "border-l-slate-400" },
            { label: "On Hold", value: onHold.length, icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50", border: "border-l-orange-500" },
            { label: "Revenue", value: fmtK(adjustedRev), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-l-green-500" },
            { label: "Margin", value: fmtK(margin), icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50", border: "border-l-blue-500" },
          ].map((s) => (
            <div key={s.label} className={`bg-card border border-border border-l-4 ${s.border} rounded-lg p-3`}>
              <div className={`w-7 h-7 rounded-md ${s.bg} flex items-center justify-center mb-1`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
              <div className="text-lg font-bold font-mono">{s.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Revenue / Cost / Monthly Storage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-green-600" /> Revenue (Unloaded)</h3>
            <div className="space-y-1.5 text-sm">
              {[
                ["IB Handling", unloaded.reduce((s, c) => s + c.handlingRevenue, 0)],
                ["Storage", unloaded.reduce((s, c) => s + c.storageRevenue, 0)],
                ["Drayage", unloaded.reduce((s, c) => s + c.drayageRevenue, 0)],
                ["Chassis", unloaded.reduce((s, c) => s + c.chassisRevenue, 0)],
                ["Shrink Wrap", unloaded.reduce((s, c) => s + c.shrinkWrapRevenue, 0)],
              ].map(([l, v]) => (
                <div key={l as string} className="flex justify-between"><span className="text-muted-foreground">{l as string}</span><span className="font-mono">{fmt(v as number)}</span></div>
              ))}
              {netStorageAdj !== 0 && (
                <div className="flex justify-between text-amber-700"><span>Monthly Storage Adj</span><span className="font-mono">{fmt(netStorageAdj)}</span></div>
              )}
              <div className="border-t pt-1.5 flex justify-between font-semibold"><span>Total</span><span className="font-mono text-green-700">{fmt(adjustedRev)}</span></div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><TrendingDown className="w-4 h-4 text-red-600" /> Costs (Unloaded)</h3>
            <div className="space-y-1.5 text-sm">
              {[
                ["M&A Drayage", unloaded.reduce((s, c) => s + c.maDrayageCost, 0)],
                ["M&A Chassis", unloaded.reduce((s, c) => s + c.maChassisCost, 0)],
                ["Lumper", unloaded.reduce((s, c) => s + c.fernandoTotal, 0)],
                ["Pallets", unloaded.reduce((s, c) => s + c.palletCost, 0)],
              ].map(([l, v]) => (
                <div key={l as string} className="flex justify-between"><span className="text-muted-foreground">{l as string}</span><span className="font-mono">{fmt(v as number)}</span></div>
              ))}
              <div className="border-t pt-1.5 flex justify-between font-semibold"><span>Total</span><span className="font-mono text-red-600">{fmt(totalCost)}</span></div>
            </div>
          </div>

          <div className="bg-card border border-border border-l-4 border-l-amber-500 rounded-lg p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-1"><Warehouse className="w-4 h-4 text-amber-600" /> Monthly Storage Min</h3>
            <p className="text-[10px] text-muted-foreground mb-3">65,000 cuft × $0.24 = $15,600/mo floor</p>
            {monthlyStorage.map((m) => (
              <div key={m.month} className="space-y-1 pb-2 mb-2 border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                <div className="flex justify-between text-sm font-semibold"><span>{m.month}</span><span className="text-xs text-muted-foreground">{m.containerCount} ctrs</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Actual ({m.actualStorageCuft.toLocaleString()} cuft)</span><span className="font-mono">{fmt(m.actualStorageRevenue)}</span></div>
                {m.minimumApplies && (
                  <div className="flex justify-between text-xs text-amber-700"><span><AlertTriangle className="w-3 h-3 inline mr-1" />Top-up</span><span className="font-mono font-semibold">+{fmt(m.minimumTopUp)}</span></div>
                )}
                {m.proRateDiscount > 0 && (
                  <div className="flex justify-between text-xs text-blue-700"><span>Pro-rate</span><span className="font-mono">-{fmt(m.proRateDiscount)}</span></div>
                )}
                <div className="flex justify-between text-xs font-semibold pt-0.5"><span>Net</span><span className="font-mono">{fmt(m.netStorage)}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Payables Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><HardHat className="w-4 h-4" /> Lumper Payables</h3>
              <Link href="/lumper-invoices"><span className="text-xs text-primary hover:underline flex items-center gap-1">View All <ArrowUpRight className="w-3 h-3" /></span></Link>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-mono text-emerald-700">{fmt(lumperPaid)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Due</span><span className="font-mono text-red-600">{fmt(lumperDue)}</span></div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Truck className="w-4 h-4" /> Drayage Payables</h3>
              <Link href="/drayage-invoices"><span className="text-xs text-primary hover:underline flex items-center gap-1">View All <ArrowUpRight className="w-3 h-3" /></span></Link>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-mono text-emerald-700">{fmt(drayagePaid)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Due</span><span className="font-mono text-red-600">{fmt(drayageDue)}</span></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/inbound-tracking", label: "Inbound Tracking", sub: "DO / PL / Extensiv status" },
            { href: "/lumper-invoices", label: "Lumper Payables", sub: "Fernando Palma invoices" },
            { href: "/drayage-invoices", label: "Drayage Payables", sub: "M&A Transport invoices" },
            { href: "/batch-invoice", label: "Batch Invoice", sub: "Bill Diamond Home" },
          ].map((q) => (
            <Link key={q.href} href={q.href}>
              <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors cursor-pointer">
                <div className="text-sm font-medium">{q.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{q.sub}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Container Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Table Header with Filter */}
          <div className="p-3 border-b border-border flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">All Containers</h3>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setSelected(new Set()); setShowBulkBar(false); }}
                className="text-xs border border-border rounded-md px-2 py-1 bg-background"
              >
                <option value="all">All Active ({active.length})</option>
                {ALL_STATUSES.map((s) => {
                  const count = s === "canceled"
                    ? containers.filter((c) => c.status === "canceled").length
                    : active.filter((c) => c.status === s).length;
                  return count > 0 ? <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)} ({count})</option> : null;
                })}
              </select>
              <span className="text-xs text-muted-foreground">{sorted.length} shown</span>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {showBulkBar && selected.size > 0 && (
            <div className="px-3 py-2 bg-primary/5 border-b border-border flex items-center gap-3">
              <span className="text-xs font-semibold text-primary">{selected.size} selected</span>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="text-xs border border-border rounded-md px-2 py-1 bg-background"
              >
                <option value="">Change status to...</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <button
                onClick={applyBulkStatus}
                disabled={!bulkStatus}
                className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-md disabled:opacity-40 hover:opacity-90"
              >
                Apply
              </button>
              <button
                onClick={() => { setSelected(new Set()); setShowBulkBar(false); }}
                className="text-xs text-muted-foreground hover:text-foreground ml-auto flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="px-3 py-2 w-8">
                    <input
                      type="checkbox"
                      checked={sorted.length > 0 && selected.size === sorted.length}
                      onChange={toggleAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className={`text-left ${thClass}`} onClick={() => handleSort("container")}>
                    Container <SortIcon column="container" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={`text-left ${thClass}`} onClick={() => handleSort("status")}>
                    Status <SortIcon column="status" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={`text-left ${thClass}`} onClick={() => handleSort("period")}>
                    Period <SortIcon column="period" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={`text-left ${thClass}`} onClick={() => handleSort("eta")}>
                    ETA <SortIcon column="eta" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={`text-right ${thClass}`} onClick={() => handleSort("cartons")}>
                    Cartons <SortIcon column="cartons" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={`text-right ${thClass}`} onClick={() => handleSort("cuft")}>
                    CuFt <SortIcon column="cuft" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={`text-right ${thClass}`} onClick={() => handleSort("revenue")}>
                    Revenue <SortIcon column="revenue" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={`text-right ${thClass}`} onClick={() => handleSort("cost")}>
                    Cost <SortIcon column="cost" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={`text-right ${thClass}`} onClick={() => handleSort("margin")}>
                    Margin <SortIcon column="margin" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th className={`text-center ${thClass}`} onClick={() => handleSort("billed")}>
                    Billed <SortIcon column="billed" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => (
                  <tr key={c.id} className={`border-t border-border hover:bg-muted/30 ${selected.has(c.container) ? "bg-primary/5" : ""}`}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(c.container)}
                        onChange={() => toggleSelect(c.container)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/container/${c.container}`}>
                        <span className="text-primary font-mono font-medium hover:underline cursor-pointer">{c.container}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-2 text-muted-foreground">{c.period}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.eta || "TBD"}</td>
                    <td className="px-3 py-2 text-right font-mono">{c.cartons > 0 ? c.cartons.toLocaleString() : "—"}</td>
                    <td className="px-3 py-2 text-right font-mono">{c.billableCuft > 0 ? c.billableCuft.toLocaleString() : "—"}</td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-600">{c.totalRevenue > 0 ? fmt(c.totalRevenue) : "—"}</td>
                    <td className="px-3 py-2 text-right font-mono text-red-500">{c.totalCost > 0 ? fmt(c.totalCost) : "—"}</td>
                    <td className="px-3 py-2 text-right font-mono font-medium">{c.grossMargin !== 0 ? fmt(c.grossMargin) : "—"}</td>
                    <td className="px-3 py-2 text-center">
                      {c.billed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" /> :
                       c.status === "unloaded" ? <AlertCircle className="w-3.5 h-3.5 text-amber-500 mx-auto" /> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
