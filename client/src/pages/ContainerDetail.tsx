/*
 * Container Detail — full billing breakdown for a single container
 */
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { allContainers } from "@/data/containers";
import { useParams, Link } from "wouter";
import { ArrowLeft, Package, DollarSign, Truck, Calendar, BarChart3, HardHat } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    unloaded: "bg-emerald-100 text-emerald-800",
    received: "bg-blue-100 text-blue-800",
    in_transit: "bg-amber-100 text-amber-800",
    pending: "bg-slate-100 text-slate-600",
    projected: "bg-purple-100 text-purple-700",
    billed: "bg-emerald-100 text-emerald-800",
    unbilled: "bg-red-100 text-red-700",
    paid: "bg-emerald-100 text-emerald-800",
    due: "bg-red-100 text-red-700",
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${map[status] || "bg-gray-100 text-gray-600"}`}>{status.replace("_", " ")}</span>;
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
                {c.po && <span>PO #{c.po}</span>}
                {c.po && <span>·</span>}
                <span>{c.period}</span>
                <span>·</span>
                <StatusBadge status={c.status} />
                <span>·</span>
                <StatusBadge status={c.billingStatus} />
              </div>
            </div>
          </div>
        </div>

        {/* Margin Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Revenue</div>
              <div className="text-2xl font-bold font-mono text-emerald-700">{fmt(c.totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cost</div>
              <div className="text-2xl font-bold font-mono text-red-700">{fmt(c.totalCost)}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Margin ({marginPct}%)</div>
              <div className={`text-2xl font-bold font-mono ${c.grossMargin >= 0 ? "text-blue-700" : "text-red-700"}`}>
                {fmt(c.grossMargin)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Container Info + Drayage */}
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
                <div className="text-muted-foreground">Invoice #</div>
                <div className="font-mono font-medium">{c.invoiceNumber || "—"}</div>
                <div className="text-muted-foreground">Total Cartons</div>
                <div className="font-mono font-medium">{c.cartons > 0 ? c.cartons.toLocaleString() : "—"}</div>
                <div className="text-muted-foreground">Inbound CuFt</div>
                <div className="font-mono font-medium">{c.inbCuft > 0 ? c.inbCuft.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</div>
                <div className="text-muted-foreground">Billable CuFt</div>
                <div className="font-mono font-medium">{c.billableCuft > 0 ? c.billableCuft.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</div>
                <div className="text-muted-foreground">Pallets</div>
                <div className="font-mono font-medium">{c.pallets > 0 ? c.pallets : "—"}</div>
                <div className="text-muted-foreground">SKU Count</div>
                <div className="font-mono font-medium">{c.skuCount > 0 ? c.skuCount : "—"}</div>
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
                <div className="text-muted-foreground">Drayage Source</div>
                <div className="font-medium capitalize">{c.drayageSource}</div>
                <div className="text-muted-foreground">SSL</div>
                <div className="font-medium">{c.ssl || "—"}</div>
                <div className="text-muted-foreground">Pull Date</div>
                <div className="font-medium">{c.pullDate || "—"}</div>
                <div className="text-muted-foreground">Return Date</div>
                <div className="font-medium">{c.returnDate || "—"}</div>
                <div className="text-muted-foreground">Chassis Days</div>
                <div className="font-mono font-medium">{c.chassisDays > 0 ? `${c.chassisDays} days` : "—"}</div>
                <div className="text-muted-foreground">M&A Status</div>
                <div><StatusBadge status={c.maDrayageStatus} /></div>
                <div className="text-muted-foreground">M&A Invoice</div>
                <div className="font-mono text-xs">{c.maDrayageInvoice || "—"}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lumper Info */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HardHat className="w-4 h-4" /> Lumper / Unload
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 text-sm">
              <div className="text-muted-foreground">Vendor</div>
              <div className="font-medium">{c.lumperVendor || "Not assigned"}</div>
              <div className="text-muted-foreground">Rate</div>
              <div className="font-mono font-medium">{c.lumperRate > 0 ? fmt(c.lumperRate) : "—"}</div>
              <div className="text-muted-foreground">Date Unloaded</div>
              <div className="font-medium">{c.dateUnloaded || "—"}</div>
              <div className="text-muted-foreground">Status</div>
              <div><StatusBadge status={c.lumperStatus} /></div>
              <div className="text-muted-foreground">Invoice</div>
              <div className="font-mono text-xs">{c.lumperInvoice || "—"}</div>
            </div>
          </CardContent>
        </Card>

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
                  <td className="py-1.5 text-right font-mono text-muted-foreground">$0.15/ctn</td>
                  <td className="py-1.5 text-right font-mono">{c.cartons > 0 ? `${c.cartons.toLocaleString()} ctns` : "—"}</td>
                  <td className="py-1.5 text-right font-mono font-medium">
                    {fmt(c.handlingRevenue)}
                    {c.handlingCalc < 550 && c.handlingRevenue === 550 && <span className="text-[10px] text-amber-600 ml-1">(MIN)</span>}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5">Monthly Storage</td>
                  <td className="py-1.5 text-right font-mono text-muted-foreground">$0.18/cuft</td>
                  <td className="py-1.5 text-right font-mono">{c.billableCuft > 0 ? `${c.billableCuft.toLocaleString(undefined, { maximumFractionDigits: 0 })} cuft` : "—"}</td>
                  <td className="py-1.5 text-right font-mono font-medium">{fmt(c.storageRevenue)}</td>
                </tr>
                {c.drayageRevenue > 0 && (
                  <tr className="border-b">
                    <td className="py-1.5">Drayage Pass-through</td>
                    <td className="py-1.5 text-right font-mono text-muted-foreground">$495/cntr</td>
                    <td className="py-1.5 text-right font-mono">1</td>
                    <td className="py-1.5 text-right font-mono font-medium">{fmt(c.drayageRevenue)}</td>
                  </tr>
                )}
                {c.chassisRevenue > 0 && (
                  <tr className="border-b">
                    <td className="py-1.5">Chassis</td>
                    <td className="py-1.5 text-right font-mono text-muted-foreground">$40/day</td>
                    <td className="py-1.5 text-right font-mono">{c.chassisDays} days</td>
                    <td className="py-1.5 text-right font-mono font-medium">{fmt(c.chassisRevenue)}</td>
                  </tr>
                )}
                {c.shrinkWrapRevenue > 0 && (
                  <tr className="border-b">
                    <td className="py-1.5">Shrink Wrap</td>
                    <td className="py-1.5 text-right font-mono text-muted-foreground">$2.50/pallet</td>
                    <td className="py-1.5 text-right font-mono">{c.pallets} pallets</td>
                    <td className="py-1.5 text-right font-mono font-medium">{fmt(c.shrinkWrapRevenue)}</td>
                  </tr>
                )}
                <tr className="font-semibold">
                  <td className="py-2" colSpan={3}>Total Revenue</td>
                  <td className="py-2 text-right font-mono text-emerald-700">{fmt(c.totalRevenue)}</td>
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
                  <th className="text-right py-1.5 font-semibold text-xs">Amount</th>
                  <th className="text-center py-1.5 font-semibold text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {c.maDrayageCost > 0 && (
                  <tr className="border-b">
                    <td className="py-1.5">M&A Transport</td>
                    <td className="py-1.5">Container Drayage ($425)</td>
                    <td className="py-1.5 text-right font-mono font-medium">{fmt(c.maDrayageCost)}</td>
                    <td className="py-1.5 text-center"><StatusBadge status={c.maDrayageStatus} /></td>
                  </tr>
                )}
                {c.maChassisCost > 0 && (
                  <tr className="border-b">
                    <td className="py-1.5">M&A Transport</td>
                    <td className="py-1.5">Chassis ({c.chassisDays} days × $30)</td>
                    <td className="py-1.5 text-right font-mono font-medium">{fmt(c.maChassisCost)}</td>
                    <td className="py-1.5 text-center"><StatusBadge status={c.maDrayageStatus} /></td>
                  </tr>
                )}
                {c.lumperCost > 0 && (
                  <tr className="border-b">
                    <td className="py-1.5">{c.lumperVendor}</td>
                    <td className="py-1.5">Container Unload</td>
                    <td className="py-1.5 text-right font-mono font-medium">{fmt(c.lumperCost)}</td>
                    <td className="py-1.5 text-center"><StatusBadge status={c.lumperStatus} /></td>
                  </tr>
                )}
                {c.palletCost > 0 && (
                  <tr className="border-b">
                    <td className="py-1.5">Pallet Supplier</td>
                    <td className="py-1.5">Pallets ({c.pallets} × $4.50)</td>
                    <td className="py-1.5 text-right font-mono font-medium">{fmt(c.palletCost)}</td>
                    <td className="py-1.5 text-center"><StatusBadge status="paid" /></td>
                  </tr>
                )}
                <tr className="font-semibold">
                  <td className="py-2" colSpan={2}>Total Cost</td>
                  <td className="py-2 text-right font-mono text-red-700">{fmt(c.totalCost)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Notes */}
        {c.notes && (
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</div>
              <p className="text-sm">{c.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
