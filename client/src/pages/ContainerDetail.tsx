import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { allContainers } from "@/data/containers";
import { useParams } from "wouter";
import { Link } from "wouter";
import { ArrowLeft, Package, DollarSign, Truck, Calendar, BarChart3 } from "lucide-react";

const fmt = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD" });

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
    payable: "bg-amber-100 text-amber-800 border-amber-200",
    pending: "bg-slate-100 text-slate-600 border-slate-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    waiting: "bg-amber-100 text-amber-800 border-amber-200",
    invoiced: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status.replace(/_/g, " ").toUpperCase()}
    </span>
  );
}

export default function ContainerDetail() {
  const params = useParams<{ id: string }>();
  const container = allContainers.find(c => c.containerNumber === params.id);

  if (!container) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold">Container not found</h2>
          <Link href="/"><span className="text-primary hover:underline mt-2 inline-block">← Back to Dashboard</span></Link>
        </div>
      </Layout>
    );
  }

  const c = container;
  const marginPct = c.totalRevenue > 0 ? ((c.grossMargin / c.totalRevenue) * 100).toFixed(1) : "0.0";

  return (
    <Layout>
      <div className="space-y-5 max-w-5xl">
        {/* Back + Header */}
        <div>
          <Link href="/">
            <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </span>
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono">{c.containerNumber}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>PO #{c.poNumber}</span>
                <span>·</span>
                <span>{c.period}</span>
                <span>·</span>
                <StatusPill status={c.billingStatus} />
              </div>
            </div>
          </div>
        </div>

        {/* Margin Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Revenue</div>
              <div className="text-2xl font-bold font-financial text-emerald-700">{fmt(c.totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cost</div>
              <div className="text-2xl font-bold font-financial text-red-700">{fmt(c.totalCost)}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Margin ({marginPct}%)</div>
              <div className={`text-2xl font-bold font-financial ${c.grossMargin >= 0 ? "text-blue-700" : "text-red-700"}`}>
                {fmt(c.grossMargin)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Container Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Container Info
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-muted-foreground">ETA</div>
                <div className="font-medium">{c.eta || "—"}</div>
                <div className="text-muted-foreground">Arrival Date</div>
                <div className="font-medium">{c.arrivalDate || "—"}</div>
                <div className="text-muted-foreground">Total Cartons</div>
                <div className="font-financial font-medium">{c.totalCartons.toLocaleString()}</div>
                <div className="text-muted-foreground">Actual CuFt</div>
                <div className="font-financial font-medium">{c.actualCuft.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <div className="text-muted-foreground">Billable CuFt</div>
                <div className="font-financial font-medium">{c.billableCuft.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <div className="text-muted-foreground">SKU Count</div>
                <div className="font-financial font-medium">{c.skuCount}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Truck className="w-4 h-4" /> Drayage & Chassis
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-muted-foreground">Carrier</div>
                <div className="font-medium">{c.carrier || "Not assigned"}</div>
                <div className="text-muted-foreground">Pull Date</div>
                <div className="font-medium">{c.pullDate || "—"}</div>
                <div className="text-muted-foreground">Return Date</div>
                <div className="font-medium">{c.returnDate || "—"}</div>
                <div className="text-muted-foreground">Chassis Days</div>
                <div className="font-financial font-medium">{c.chassisDays > 0 ? `${c.chassisDays} days` : "—"}</div>
                <div className="text-muted-foreground">Drayage Status</div>
                <div><StatusPill status={c.drayageStatus} /></div>
                <div className="text-muted-foreground">Invoice</div>
                <div className="font-mono text-xs">{c.drayageInvoice || "—"}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Detail */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Revenue Detail (Bill to Diamond Home)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1.5 font-semibold text-xs">Line Item</th>
                  <th className="text-right py-1.5 font-semibold text-xs">Rate</th>
                  <th className="text-right py-1.5 font-semibold text-xs">Qty</th>
                  <th className="text-right py-1.5 font-semibold text-xs">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-1.5">IB Handling</td>
                  <td className="py-1.5 text-right font-financial text-muted-foreground">$0.15/ctn</td>
                  <td className="py-1.5 text-right font-financial">{c.totalCartons.toLocaleString()} ctns</td>
                  <td className="py-1.5 text-right font-financial font-medium">
                    {fmt(c.handlingRevenue)}
                    {c.ibNote === "Minimum" && <span className="text-[10px] text-amber-600 ml-1">(MIN)</span>}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5">Monthly Storage</td>
                  <td className="py-1.5 text-right font-financial text-muted-foreground">$0.18/cuft</td>
                  <td className="py-1.5 text-right font-financial">{c.billableCuft.toLocaleString(undefined, { maximumFractionDigits: 0 })} cuft</td>
                  <td className="py-1.5 text-right font-financial font-medium">{fmt(c.storageRevenue)}</td>
                </tr>
                {c.drayageRevenue > 0 && (
                  <tr className="border-b">
                    <td className="py-1.5">Drayage Pass-through</td>
                    <td className="py-1.5 text-right font-financial text-muted-foreground">$495/cntr</td>
                    <td className="py-1.5 text-right font-financial">1</td>
                    <td className="py-1.5 text-right font-financial font-medium">{fmt(c.drayageRevenue)}</td>
                  </tr>
                )}
                {c.chassisRevenue > 0 && (
                  <tr className="border-b">
                    <td className="py-1.5">Chassis</td>
                    <td className="py-1.5 text-right font-financial text-muted-foreground">$40/day</td>
                    <td className="py-1.5 text-right font-financial">{c.chassisDays} days</td>
                    <td className="py-1.5 text-right font-financial font-medium">{fmt(c.chassisRevenue)}</td>
                  </tr>
                )}
                <tr className="border-b">
                  <td className="py-1.5">Shrink Wrap</td>
                  <td className="py-1.5 text-right font-financial text-muted-foreground">$2.50/pallet</td>
                  <td className="py-1.5 text-right font-financial">20 pallets</td>
                  <td className="py-1.5 text-right font-financial font-medium">{fmt(c.palletRevenue)}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="py-2" colSpan={3}>Total Revenue</td>
                  <td className="py-2 text-right font-financial text-emerald-700">{fmt(c.totalRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Cost Detail */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Cost Detail (Payables)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1.5 font-semibold text-xs">Vendor</th>
                  <th className="text-left py-1.5 font-semibold text-xs">Line Item</th>
                  <th className="text-right py-1.5 font-semibold text-xs">Rate</th>
                  <th className="text-right py-1.5 font-semibold text-xs">Amount</th>
                </tr>
              </thead>
              <tbody>
                {c.maDrayageCost > 0 && (
                  <tr className="border-b">
                    <td className="py-1.5">M&A Transport</td>
                    <td className="py-1.5">Container Drayage</td>
                    <td className="py-1.5 text-right font-financial text-muted-foreground">$425/cntr</td>
                    <td className="py-1.5 text-right font-financial font-medium">{fmt(c.maDrayageCost)}</td>
                  </tr>
                )}
                {c.maChassisCost > 0 && (
                  <tr className="border-b">
                    <td className="py-1.5">M&A Transport</td>
                    <td className="py-1.5">Chassis ({c.chassisDays} days)</td>
                    <td className="py-1.5 text-right font-financial text-muted-foreground">$30/day</td>
                    <td className="py-1.5 text-right font-financial font-medium">{fmt(c.maChassisCost)}</td>
                  </tr>
                )}
                <tr className="border-b">
                  <td className="py-1.5">Fernando Barrera</td>
                  <td className="py-1.5">Container Unload</td>
                  <td className="py-1.5 text-right font-financial text-muted-foreground">$260/cntr</td>
                  <td className="py-1.5 text-right font-financial font-medium">{fmt(c.fernandoUnloadCost)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5">Pallet Supplier</td>
                  <td className="py-1.5">Pallets (est. 20)</td>
                  <td className="py-1.5 text-right font-financial text-muted-foreground">$4.50/pallet</td>
                  <td className="py-1.5 text-right font-financial font-medium">{fmt(c.palletCost)}</td>
                </tr>
                <tr className="font-semibold">
                  <td className="py-2" colSpan={3}>Total Cost</td>
                  <td className="py-2 text-right font-financial text-red-700">{fmt(c.totalCost)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
