import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { allContainers, getStats, type Container } from "@/data/containers";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Package, DollarSign, TrendingUp, TrendingDown, BarChart3,
  Search, Truck, Clock, CheckCircle2, AlertTriangle
} from "lucide-react";

const fmt = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD" });

const fmtShort = (v: number) => {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return fmt(v);
};

function StatusPill({ status, type }: { status: string; type: string }) {
  const colors: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
    payable: "bg-amber-100 text-amber-800 border-amber-200",
    pending: "bg-slate-100 text-slate-600 border-slate-200",
    no_drayage: "bg-slate-50 text-slate-400 border-slate-100",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    in_progress: "bg-blue-100 text-blue-800 border-blue-200",
    waiting: "bg-amber-100 text-amber-800 border-amber-200",
    not_required: "bg-slate-50 text-slate-400 border-slate-100",
    invoiced: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status.replace(/_/g, " ").toUpperCase()}
    </span>
  );
}

export default function Dashboard() {
  const stats = getStats();
  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterDrayage, setFilterDrayage] = useState("");
  const [sortCol, setSortCol] = useState<string>("containerNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let list = [...allContainers];
    if (search) {
      const s = search.toUpperCase();
      list = list.filter(c => c.containerNumber.includes(s) || c.poNumber.includes(s));
    }
    if (filterPeriod) list = list.filter(c => c.period === filterPeriod);
    if (filterDrayage) list = list.filter(c => c.drayageStatus === filterDrayage);

    list.sort((a, b) => {
      const av = (a as any)[sortCol];
      const bv = (b as any)[sortCol];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return list;
  }, [search, filterPeriod, filterDrayage, sortCol, sortDir]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const SortHeader = ({ col, children, align }: { col: string; children: React.ReactNode; align?: string }) => (
    <th
      className={`p-2.5 font-semibold text-xs cursor-pointer hover:bg-slate-100 select-none ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"}`}
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortCol === col && <span className="text-primary">{sortDir === "asc" ? "↑" : "↓"}</span>}
      </span>
    </th>
  );

  return (
    <Layout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Container Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Diamond Home — SC-144 Warehouse · 46 containers tracked
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div className="text-xl font-bold font-financial">{stats.total}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Containers</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-xl font-bold font-financial text-emerald-700">{fmtShort(stats.totalRevenue)}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Revenue</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-xl font-bold font-financial text-red-700">{fmtShort(stats.totalCost)}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Costs</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div className={`text-xl font-bold font-financial ${stats.grossMargin >= 0 ? "text-blue-700" : "text-red-700"}`}>
                {fmtShort(stats.grossMargin)}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Gross Margin</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-xl font-bold font-financial">{stats.waitingUnload}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Waiting Unload</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-slate-400">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <Truck className="w-5 h-5 text-slate-600" />
              </div>
              <div className="text-xl font-bold font-financial">{stats.maPaid + stats.maPayable}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">M&A Returned</div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue/Cost Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">IB Handling (46 × $550 min)</span><span className="font-financial font-medium">{fmt(stats.ibHandlingTotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Monthly Storage ($0.18/cuft)</span><span className="font-financial font-medium">{fmt(stats.storageTotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Drayage Pass-through ($495)</span><span className="font-financial font-medium">{fmt(allContainers.filter(c => c.drayageRevenue > 0).length * 495)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Chassis Revenue ($40/day)</span><span className="font-financial font-medium">{fmt(allContainers.reduce((s, c) => s + c.chassisRevenue, 0))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shrink Wrap ($2.50 × 20 pallets)</span><span className="font-financial font-medium">{fmt(allContainers.reduce((s, c) => s + c.palletRevenue, 0))}</span></div>
                <div className="flex justify-between border-t pt-1.5 font-semibold"><span>Total Revenue</span><span className="font-financial text-emerald-700">{fmt(stats.totalRevenue)}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" /> Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">M&A Drayage ($425/container)</span><span className="font-financial font-medium">{fmt(allContainers.reduce((s, c) => s + c.maDrayageCost, 0))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">M&A Chassis ($30/day)</span><span className="font-financial font-medium">{fmt(allContainers.reduce((s, c) => s + c.maChassisCost, 0))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fernando Unload ($260/container)</span><span className="font-financial font-medium">{fmt(stats.totalFernandoCost)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pallets ($4.50 × 20 est.)</span><span className="font-financial font-medium">{fmt(allContainers.reduce((s, c) => s + c.palletCost, 0))}</span></div>
                <div className="flex justify-between border-t pt-1.5 font-semibold"><span>Total Costs</span><span className="font-financial text-red-700">{fmt(stats.totalCost)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* M&A Invoice Quick View */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Truck className="w-4 h-4" /> M&A Transport Invoices
              </CardTitle>
              <Link href="/ma-invoices">
                <span className="text-xs text-primary hover:underline cursor-pointer">View Details →</span>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-semibold">MA-020126</span>
                  <StatusPill status="paid" type="billing" />
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>12 containers · 61 chassis days</div>
                  <div className="font-financial font-medium text-foreground">{fmt(6930)}</div>
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-semibold">MA-20260204</span>
                  <StatusPill status="payable" type="billing" />
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>8 new returns · 19 chassis days</div>
                  <div className="font-financial font-medium text-foreground">{fmt(3970)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Container Table */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm font-semibold">All Containers ({filtered.length})</CardTitle>
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search container #..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 h-8 text-xs w-48"
                  />
                </div>
                <select
                  className="border rounded-md px-2 py-1.5 text-xs h-8 bg-background"
                  value={filterPeriod}
                  onChange={e => setFilterPeriod(e.target.value)}
                >
                  <option value="">All Periods</option>
                  <option value="Week 1">Week 1</option>
                  <option value="Week 2">Week 2</option>
                  <option value="Week 3">Week 3</option>
                </select>
                <select
                  className="border rounded-md px-2 py-1.5 text-xs h-8 bg-background"
                  value={filterDrayage}
                  onChange={e => setFilterDrayage(e.target.value)}
                >
                  <option value="">All Drayage</option>
                  <option value="paid">Paid</option>
                  <option value="payable">Payable</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-y bg-muted/50">
                    <SortHeader col="containerNumber">Container #</SortHeader>
                    <SortHeader col="period">Period</SortHeader>
                    <SortHeader col="totalCartons" align="right">Cartons</SortHeader>
                    <SortHeader col="billableCuft" align="right">Bill. CuFt</SortHeader>
                    <SortHeader col="carrier">Carrier</SortHeader>
                    <SortHeader col="chassisDays" align="center">Chassis</SortHeader>
                    <SortHeader col="totalRevenue" align="right">Revenue</SortHeader>
                    <SortHeader col="totalCost" align="right">Cost</SortHeader>
                    <SortHeader col="grossMargin" align="right">Margin</SortHeader>
                    <th className="p-2.5 text-center text-xs font-semibold">Drayage</th>
                    <th className="p-2.5 text-center text-xs font-semibold">Unload</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.containerNumber} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-2.5">
                        <Link href={`/container/${c.containerNumber}`}>
                          <span className="font-mono font-semibold text-primary hover:underline cursor-pointer">
                            {c.containerNumber}
                          </span>
                        </Link>
                      </td>
                      <td className="p-2.5">
                        <span className="text-muted-foreground">{c.period}</span>
                      </td>
                      <td className="p-2.5 text-right font-financial">{c.totalCartons.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-financial">{c.billableCuft.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="p-2.5">
                        <span className={`text-[10px] ${c.carrierType === "house" ? "text-blue-700" : c.carrierType === "overflow" ? "text-amber-700" : "text-slate-400"}`}>
                          {c.carrier || "—"}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-financial">
                        {c.chassisDays > 0 ? `${c.chassisDays}d` : "—"}
                      </td>
                      <td className="p-2.5 text-right font-financial text-emerald-700 font-medium">
                        {fmt(c.totalRevenue)}
                      </td>
                      <td className="p-2.5 text-right font-financial text-red-700 font-medium">
                        {c.totalCost > 0 ? fmt(c.totalCost) : "—"}
                      </td>
                      <td className="p-2.5 text-right font-financial font-medium">
                        <span className={c.grossMargin >= 0 ? "text-blue-700" : "text-red-700"}>
                          {fmt(c.grossMargin)}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <StatusPill status={c.drayageStatus} type="drayage" />
                      </td>
                      <td className="p-2.5 text-center">
                        <StatusPill status={c.unloadStatus} type="unload" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
