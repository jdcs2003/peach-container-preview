/*
 * Design: Industrial Logistics — Peach/Orange branding, slate sidebar
 * Dense data table, monospace financials, color-coded statuses
 * Now uses the reactive store for live data.
 */
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useStore } from "@/hooks/useStore";
import { exportContainersToExcel } from "@/lib/exportExcel";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package, TrendingUp, TrendingDown, BarChart3,
  Truck, Clock, Search, ArrowUpRight, PlusCircle,
  Layers, Download, HardHat, DollarSign
} from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n);

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    unloaded: "bg-emerald-100 text-emerald-800",
    received: "bg-blue-100 text-blue-800",
    in_transit: "bg-amber-100 text-amber-800",
    pending: "bg-slate-100 text-slate-600",
    projected: "bg-purple-100 text-purple-700",
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${map[status] || "bg-gray-100"}`}>{status.replace("_", " ")}</span>;
}

function BillingBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    billed: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    unbilled: "bg-red-100 text-red-700",
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${map[status] || "bg-gray-100"}`}>{status}</span>;
}

export default function Dashboard() {
  const { store } = useStore();
  const allContainers = store.getContainers();
  const lumperInvoices = store.getLumperInvoices();
  const drayageInvoices = store.getDrayageInvoices();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  const stats = useMemo(() => {
    const unloaded = allContainers.filter(c => c.status === "unloaded");
    const totalRev = unloaded.reduce((s, c) => s + c.totalRevenue, 0);
    const totalCost = unloaded.reduce((s, c) => s + c.totalCost, 0);
    const inTransit = allContainers.filter(c => c.status === "in_transit").length;
    const pending = allContainers.filter(c => c.status === "pending").length;
    const projected = allContainers.filter(c => c.status === "projected").length;
    return {
      total: allContainers.length,
      unloaded: unloaded.length,
      inTransit,
      pending,
      projected,
      totalRev,
      totalCost,
      margin: totalRev - totalCost,
    };
  }, [allContainers]);

  const periods = useMemo(() => Array.from(new Set(allContainers.map(c => c.period))), [allContainers]);

  const filtered = useMemo(() => {
    return allContainers.filter(c => {
      if (search && !c.containerNumber.toLowerCase().includes(search.toLowerCase()) && !c.po.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (periodFilter !== "all" && c.period !== periodFilter) return false;
      return true;
    });
  }, [allContainers, search, statusFilter, periodFilter]);

  // Lumper summary
  const lumperPaid = lumperInvoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const lumperDue = lumperInvoices.filter(i => i.status === "due").reduce((s, i) => s + i.total, 0);
  const lumperContainers = lumperInvoices.reduce((s, i) => s + i.containers.length, 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Container Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Diamond Home — SC-144 Warehouse · {allContainers.length} containers tracked</p>
          </div>
          <div className="flex gap-2">
            <Link href="/container/new">
              <Button className="gap-2"><PlusCircle className="w-4 h-4" /> Add Container</Button>
            </Link>
            <Link href="/batch-invoice">
              <Button variant="outline" className="gap-2"><Layers className="w-4 h-4" /> Batch Invoice</Button>
            </Link>
            <Button variant="outline" className="gap-2" onClick={() => { exportContainersToExcel(allContainers); toast.success("Excel exported"); }}>
              <Download className="w-4 h-4" /> Export All
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <Package className="w-5 h-5 text-emerald-600 mb-1" />
              <div className="text-2xl font-bold font-mono">{stats.total}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Containers</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <TrendingUp className="w-5 h-5 text-green-600 mb-1" />
              <div className="text-2xl font-bold font-mono text-green-700">{fmtK(stats.totalRev)}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Revenue</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <TrendingDown className="w-5 h-5 text-red-600 mb-1" />
              <div className="text-2xl font-bold font-mono text-red-600">{fmtK(stats.totalCost)}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Costs</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <BarChart3 className="w-5 h-5 text-blue-600 mb-1" />
              <div className="text-2xl font-bold font-mono text-blue-700">{fmtK(stats.margin)}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Gross Margin</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <Clock className="w-5 h-5 text-amber-600 mb-1" />
              <div className="text-2xl font-bold font-mono">{stats.pending + stats.inTransit}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Awaiting Unload</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <Truck className="w-5 h-5 text-purple-600 mb-1" />
              <div className="text-2xl font-bold font-mono">{stats.projected}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Projected</div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue & Cost Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" /> Revenue Breakdown (Unloaded)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ["IB Handling ($550 min)", allContainers.filter(c=>c.status==="unloaded").reduce((s,c)=>s+c.handlingRevenue,0)],
                ["Storage ($0.18/cuft)", allContainers.filter(c=>c.status==="unloaded").reduce((s,c)=>s+c.storageRevenue,0)],
                ["Drayage Pass-through ($495)", allContainers.filter(c=>c.status==="unloaded").reduce((s,c)=>s+c.drayageRevenue,0)],
                ["Chassis Revenue ($40/day)", allContainers.filter(c=>c.status==="unloaded").reduce((s,c)=>s+c.chassisRevenue,0)],
                ["Shrink Wrap ($2.50/pallet)", allContainers.filter(c=>c.status==="unloaded").reduce((s,c)=>s+c.shrinkWrapRevenue,0)],
              ].map(([label, val]) => (
                <div key={label as string} className="flex justify-between">
                  <span className="text-muted-foreground">{label as string}</span>
                  <span className="font-mono font-medium">{fmt(val as number)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Revenue</span>
                <span className="font-mono text-green-700">{fmt(stats.totalRev)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" /> Cost Breakdown (Unloaded)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ["M&A Drayage ($425/container)", allContainers.filter(c=>c.status==="unloaded").reduce((s,c)=>s+c.maDrayageCost,0)],
                ["M&A Chassis ($30/day)", allContainers.filter(c=>c.status==="unloaded").reduce((s,c)=>s+c.maChassisCost,0)],
                ["Lumper (Fernando/Freddie)", allContainers.filter(c=>c.status==="unloaded").reduce((s,c)=>s+c.lumperCost,0)],
                ["Pallets ($4.50/pallet)", allContainers.filter(c=>c.status==="unloaded").reduce((s,c)=>s+c.palletCost,0)],
              ].map(([label, val]) => (
                <div key={label as string} className="flex justify-between">
                  <span className="text-muted-foreground">{label as string}</span>
                  <span className="font-mono font-medium">{fmt(val as number)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Costs</span>
                <span className="font-mono text-red-600">{fmt(stats.totalCost)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lumper & Drayage Quick Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><HardHat className="w-4 h-4" /> Lumper Invoices</CardTitle>
                <Link href="/lumper-invoices"><span className="text-xs text-primary hover:underline flex items-center gap-1">View <ArrowUpRight className="w-3 h-3" /></span></Link>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-mono font-medium text-emerald-700">{fmt(lumperPaid)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Due</span><span className="font-mono font-medium text-red-600">{fmt(lumperDue)}</span></div>
              <div className="flex justify-between border-t pt-1 font-semibold"><span>Total ({lumperContainers} ctnrs)</span><span className="font-mono">{fmt(lumperPaid + lumperDue)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Truck className="w-4 h-4" /> Drayage Invoices</CardTitle>
                <Link href="/drayage-invoices"><span className="text-xs text-primary hover:underline flex items-center gap-1">View <ArrowUpRight className="w-3 h-3" /></span></Link>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {drayageInvoices.map(inv => (
                <div key={inv.invoiceNumber} className="flex justify-between">
                  <span className="text-muted-foreground">{inv.invoiceNumber} ({inv.containers.length} ctnrs)</span>
                  <span className={`font-mono font-medium ${inv.status === "paid" ? "text-emerald-700" : "text-red-600"}`}>{fmt(inv.total)} {inv.status.toUpperCase()}</span>
                </div>
              ))}
              {drayageInvoices.length === 0 && <div className="text-muted-foreground text-xs">No drayage invoices yet</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4" /> Client Invoices</CardTitle>
                <Link href="/client-invoices"><span className="text-xs text-primary hover:underline flex items-center gap-1">View <ArrowUpRight className="w-3 h-3" /></span></Link>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {store.getClientInvoices().length === 0 ? (
                <div className="text-muted-foreground text-xs">No client invoices yet. Use Batch Invoice to create.</div>
              ) : (
                store.getClientInvoices().map(inv => (
                  <div key={inv.invoiceNumber} className="flex justify-between">
                    <span className="text-muted-foreground">{inv.invoiceNumber} ({inv.lines.length} ctnrs)</span>
                    <span className={`font-mono font-medium ${inv.status === "paid" ? "text-emerald-700" : "text-amber-600"}`}>{fmt(inv.total)} {inv.status.toUpperCase()}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search container # or PO..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">All Statuses</option>
            <option value="unloaded">Unloaded</option>
            <option value="received">Received</option>
            <option value="in_transit">In Transit</option>
            <option value="pending">Pending</option>
            <option value="projected">Projected</option>
          </select>
          <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">All Periods</option>
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">{filtered.length} containers</span>
        </div>

        {/* Container Table */}
        <div className="border rounded-lg overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-3 py-2.5 font-semibold text-xs uppercase tracking-wider">Container</th>
                <th className="px-3 py-2.5 font-semibold text-xs uppercase tracking-wider">PO</th>
                <th className="px-3 py-2.5 font-semibold text-xs uppercase tracking-wider">Period</th>
                <th className="px-3 py-2.5 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="px-3 py-2.5 font-semibold text-xs uppercase tracking-wider">ETA / Arrival</th>
                <th className="px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-right">Cartons</th>
                <th className="px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-right">Revenue</th>
                <th className="px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-right">Cost</th>
                <th className="px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-right">Margin</th>
                <th className="px-3 py-2.5 font-semibold text-xs uppercase tracking-wider">Billing</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2">
                    <Link href={`/container/${c.containerNumber}`}>
                      <span className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer">{c.containerNumber}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{c.po || "—"}</td>
                  <td className="px-3 py-2 text-xs">{c.period}</td>
                  <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-2 text-xs font-mono text-muted-foreground">
                    {c.status === "pending" || c.status === "in_transit" || c.status === "projected"
                      ? (c.eta || "TBD")
                      : (c.arrivalDate || "—")}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{c.cartons > 0 ? c.cartons.toLocaleString() : "—"}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs font-medium text-green-700">{c.totalRevenue > 0 ? fmt(c.totalRevenue) : "—"}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-red-600">{c.totalCost > 0 ? fmt(c.totalCost) : "—"}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs font-semibold">{c.grossMargin > 0 ? fmt(c.grossMargin) : "—"}</td>
                  <td className="px-3 py-2"><BillingBadge status={c.billingStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rate Card Reference */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rate Card Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Handling</span><span className="font-mono">$0.15/carton</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Handling Min</span><span className="font-mono">$550/container</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Drayage (bill)</span><span className="font-mono">$495/container</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Drayage (pay M&A)</span><span className="font-mono">$425/container</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Chassis (bill)</span><span className="font-mono">$40/day</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Chassis (pay M&A)</span><span className="font-mono">$30/day</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Storage</span><span className="font-mono">$0.18/cuft</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shrink Wrap</span><span className="font-mono">$2.50/pallet</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Lumper (Fernando)</span><span className="font-mono">$260-300/ctnr</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Lumper (Freddie)</span><span className="font-mono">$425-600/ctnr</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pallets</span><span className="font-mono">$4.50/pallet</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Min CuFt/Case</span><span className="font-mono">1.3 cuft</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
