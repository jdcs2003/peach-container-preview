import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { allContainers, maInvoices } from "@/data/containers";
import { Link } from "wouter";
import { ArrowLeft, Truck, FileText, CheckCircle2, AlertTriangle } from "lucide-react";

const fmt = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD" });

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
    payable: "bg-amber-100 text-amber-800 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status.toUpperCase()}
    </span>
  );
}

export default function MAInvoices() {
  // Group containers by invoice
  const invoice1Containers = allContainers.filter(c => c.drayageInvoice === "MA-020126");
  const invoice2Containers = allContainers.filter(c => c.drayageInvoice === "MA-20260204");
  const noInvoice = allContainers.filter(c => !c.drayageInvoice && c.carrier !== "" && c.carrier !== "Overflow Capacity");

  return (
    <Layout>
      <div className="space-y-5 max-w-5xl">
        {/* Header */}
        <div>
          <Link href="/">
            <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </span>
          </Link>
          <h1 className="text-2xl font-bold mt-1">M&A Transport Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Drayage & chassis invoices from M&A Transport · Rates: $425/container + $30/day chassis
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total M&A Paid</div>
              <div className="text-2xl font-bold font-financial text-emerald-700">{fmt(6930)}</div>
              <div className="text-xs text-muted-foreground">12 containers · Invoice MA-020126</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Amount Due</div>
              <div className="text-2xl font-bold font-financial text-amber-700">{fmt(3970)}</div>
              <div className="text-xs text-muted-foreground">8 containers · Invoice MA-20260204</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total M&A Cost</div>
              <div className="text-2xl font-bold font-financial text-blue-700">{fmt(10900)}</div>
              <div className="text-xs text-muted-foreground">20 containers · 80 chassis days</div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice 1: MA-020126 */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="font-mono">MA-020126</span>
                <StatusPill status="paid" />
              </CardTitle>
              <div className="text-xs text-muted-foreground">Invoice Date: Feb 1, 2026</div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="px-4 pb-2 text-xs text-muted-foreground">
              12 containers · 61 chassis days · Terms: Net 7 (after confirmation)
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-y bg-muted/50">
                  <th className="text-left p-2.5 font-semibold">#</th>
                  <th className="text-left p-2.5 font-semibold">Container</th>
                  <th className="text-left p-2.5 font-semibold">Pull Date</th>
                  <th className="text-left p-2.5 font-semibold">Return Date</th>
                  <th className="text-center p-2.5 font-semibold">Chassis Days</th>
                  <th className="text-right p-2.5 font-semibold">Container Fee</th>
                  <th className="text-right p-2.5 font-semibold">Chassis Fee</th>
                  <th className="text-right p-2.5 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice1Containers.map((c, i) => (
                  <tr key={c.containerNumber} className="border-b hover:bg-muted/30">
                    <td className="p-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="p-2.5">
                      <Link href={`/container/${c.containerNumber}`}>
                        <span className="font-mono font-semibold text-primary hover:underline cursor-pointer">
                          {c.containerNumber}
                        </span>
                      </Link>
                    </td>
                    <td className="p-2.5">{c.pullDate}</td>
                    <td className="p-2.5">{c.returnDate}</td>
                    <td className="p-2.5 text-center font-financial">{c.chassisDays}</td>
                    <td className="p-2.5 text-right font-financial">{fmt(c.containerFee)}</td>
                    <td className="p-2.5 text-right font-financial">{fmt(c.chassisFee)}</td>
                    <td className="p-2.5 text-right font-financial font-medium">{fmt(c.drayageTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold bg-muted/30">
                  <td className="p-2.5" colSpan={4}>Invoice Total</td>
                  <td className="p-2.5 text-center font-financial">61</td>
                  <td className="p-2.5 text-right font-financial">{fmt(5100)}</td>
                  <td className="p-2.5 text-right font-financial">{fmt(1830)}</td>
                  <td className="p-2.5 text-right font-financial text-emerald-700">{fmt(6930)}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>

        {/* Invoice 2: MA-20260204 */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="font-mono">MA-20260204</span>
                <StatusPill status="payable" />
              </CardTitle>
              <div className="text-xs text-muted-foreground">Invoice Date: Feb 4, 2026</div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="px-4 pb-2 text-xs text-muted-foreground">
              8 new returns · 19 chassis days · Previously paid: {fmt(5630)} (10 containers)
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-y bg-muted/50">
                  <th className="text-left p-2.5 font-semibold">#</th>
                  <th className="text-left p-2.5 font-semibold">Container</th>
                  <th className="text-left p-2.5 font-semibold">SSL</th>
                  <th className="text-left p-2.5 font-semibold">Pull Date</th>
                  <th className="text-left p-2.5 font-semibold">Return Date</th>
                  <th className="text-center p-2.5 font-semibold">Chassis Days</th>
                  <th className="text-right p-2.5 font-semibold">Container Fee</th>
                  <th className="text-right p-2.5 font-semibold">Chassis Fee</th>
                  <th className="text-right p-2.5 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice2Containers.map((c, i) => (
                  <tr key={c.containerNumber} className="border-b hover:bg-muted/30">
                    <td className="p-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="p-2.5">
                      <Link href={`/container/${c.containerNumber}`}>
                        <span className="font-mono font-semibold text-primary hover:underline cursor-pointer">
                          {c.containerNumber}
                        </span>
                      </Link>
                    </td>
                    <td className="p-2.5 text-muted-foreground">—</td>
                    <td className="p-2.5">{c.pullDate}</td>
                    <td className="p-2.5">{c.returnDate}</td>
                    <td className="p-2.5 text-center font-financial">{c.chassisDays}</td>
                    <td className="p-2.5 text-right font-financial">{fmt(c.containerFee)}</td>
                    <td className="p-2.5 text-right font-financial">{fmt(c.chassisFee)}</td>
                    <td className="p-2.5 text-right font-financial font-medium">{fmt(c.drayageTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold bg-muted/30">
                  <td className="p-2.5" colSpan={5}>New Returns Total</td>
                  <td className="p-2.5 text-center font-financial">19</td>
                  <td className="p-2.5 text-right font-financial">{fmt(3400)}</td>
                  <td className="p-2.5 text-right font-financial">{fmt(570)}</td>
                  <td className="p-2.5 text-right font-financial text-amber-700">{fmt(3970)}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>

        {/* Overflow / No Invoice */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Containers Without M&A Invoice
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xs text-muted-foreground mb-3">
              These containers used Overflow Capacity carriers or have no carrier assigned yet. Drayage costs need to be entered manually.
            </div>
            <div className="space-y-2">
              {allContainers
                .filter(c => c.drayageInvoice === "" && c.containerFee === 0)
                .map(c => (
                  <div key={c.containerNumber} className="flex items-center justify-between border rounded-md p-2">
                    <div className="flex items-center gap-3">
                      <Link href={`/container/${c.containerNumber}`}>
                        <span className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer">
                          {c.containerNumber}
                        </span>
                      </Link>
                      <span className="text-[10px] text-muted-foreground">{c.carrier || "No carrier"}</span>
                      <span className="text-[10px] text-muted-foreground">{c.period}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      NEEDS DRAYAGE INFO
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Rate Reference */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold">Rate Reference</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-semibold text-emerald-700 mb-1.5">Revenue Rates (Bill to Diamond Home)</div>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>IB Handling</span><span className="font-financial">$0.15/carton ($550 min)</span></div>
                  <div className="flex justify-between"><span>Monthly Storage</span><span className="font-financial">$0.18/cuft (1 cuft min/ctn)</span></div>
                  <div className="flex justify-between"><span>Drayage Pass-through</span><span className="font-financial">$495/container</span></div>
                  <div className="flex justify-between"><span>Chassis</span><span className="font-financial">$40/day</span></div>
                  <div className="flex justify-between"><span>Shrink Wrap</span><span className="font-financial">$2.50/pallet</span></div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-red-700 mb-1.5">Cost Rates (Payables)</div>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>M&A Container Drayage</span><span className="font-financial">$425/container</span></div>
                  <div className="flex justify-between"><span>M&A Chassis</span><span className="font-financial">$30/day (both days count)</span></div>
                  <div className="flex justify-between"><span>Fernando Unload</span><span className="font-financial">$260/container</span></div>
                  <div className="flex justify-between"><span>Pallets</span><span className="font-financial">$4.50/pallet</span></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
