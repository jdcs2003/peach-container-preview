import Layout from "@/components/Layout";
import { store, RATES, type Container } from "@/data/store";
import { useStore } from "@/hooks/useStore";
import { Link } from "wouter";
import {
  Package, DollarSign, TrendingUp, TrendingDown, Truck, HardHat,
  Clock, AlertCircle, CheckCircle2, ArrowUpRight, Warehouse, AlertTriangle,
  BarChart3, Download
} from "lucide-react";
import { exportContainersToExcel } from "@/lib/exportExcel";
import { toast } from "sonner";

const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n);

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    unloaded: "bg-emerald-100 text-emerald-700",
    billed: "bg-blue-100 text-blue-700",
    "in-transit": "bg-amber-100 text-amber-700",
    received: "bg-teal-100 text-teal-700",
    pending: "bg-slate-100 text-slate-600",
    projected: "bg-purple-100 text-purple-600",
    canceled: "bg-red-100 text-red-600",
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${map[status] || "bg-gray-100"}`}>{status}</span>;
}

export default function Dashboard() {
  const containers = useStore(() => store.getContainers());
  const monthlyStorage = useStore(() => store.getMonthlyStorageSummary());
  const lumperInvoices = useStore(() => store.getLumperInvoices());
  const drayageInvoices = useStore(() => store.getDrayageInvoices());

  const active = containers.filter((c) => c.status !== "canceled");
  const unloaded = active.filter((c) => c.status === "unloaded" || c.status === "billed");
  const inTransit = active.filter((c) => c.status === "in-transit");
  const pending = active.filter((c) => c.status === "pending" || c.status === "projected");
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
            <button className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent" onClick={() => { exportContainersToExcel(active); toast.success("Exported"); }}>
              <Download className="w-3.5 h-3.5 inline mr-1" />Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total", value: active.length, icon: Package, color: "text-blue-600", bg: "bg-blue-50", border: "border-l-blue-500" },
            { label: "Unloaded", value: unloaded.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-l-emerald-500" },
            { label: "In Transit", value: inTransit.length, icon: Truck, color: "text-amber-600", bg: "bg-amber-50", border: "border-l-amber-500" },
            { label: "Pending", value: pending.length, icon: Clock, color: "text-slate-500", bg: "bg-slate-50", border: "border-l-slate-400" },
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
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold">All Containers</h3>
            <span className="text-xs text-muted-foreground">{active.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="text-left px-3 py-2 font-medium">Container</th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                  <th className="text-left px-3 py-2 font-medium">Period</th>
                  <th className="text-left px-3 py-2 font-medium">ETA</th>
                  <th className="text-right px-3 py-2 font-medium">Cartons</th>
                  <th className="text-right px-3 py-2 font-medium">CuFt</th>
                  <th className="text-right px-3 py-2 font-medium">Revenue</th>
                  <th className="text-right px-3 py-2 font-medium">Cost</th>
                  <th className="text-right px-3 py-2 font-medium">Margin</th>
                  <th className="text-center px-3 py-2 font-medium">Billed</th>
                </tr>
              </thead>
              <tbody>
                {active.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30">
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
