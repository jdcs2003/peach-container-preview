/*
 * Drayage Invoices — M&A Transport
 * Uses reactive store for live data
 */
import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/useStore";
import { type DrayageInvoice } from "@/data/store";
import { exportDrayageInvoiceToExcel } from "@/lib/exportExcel";
import { Truck, ChevronDown, ChevronUp, ArrowLeft, FileText, CheckCircle2, AlertCircle, Download, Check } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

function InvoiceCard({ invoice, onMarkPaid }: { invoice: DrayageInvoice; onMarkPaid: (num: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const isPaid = invoice.status === "paid";
  const totalChassis = invoice.containers.reduce((s, c) => s + c.chassisDays, 0);

  return (
    <Card className={`border-l-4 ${isPaid ? "border-l-emerald-500" : "border-l-red-500"}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className={`w-5 h-5 ${isPaid ? "text-emerald-600" : "text-red-600"}`} />
            <div>
              <CardTitle className="text-sm font-semibold font-mono">{invoice.invoiceNumber}</CardTitle>
              <p className="text-xs text-muted-foreground">{invoice.invoiceDate} · {invoice.containers.length} containers · {totalChassis} chassis days</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono font-bold text-lg">{fmt(invoice.total)}</div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${isPaid ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>
                {isPaid ? "PAID" : "DUE"}
              </span>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); exportDrayageInvoiceToExcel(invoice); toast.success("Excel downloaded"); }}>
                <Download className="w-3 h-3" />
              </Button>
              {!isPaid && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-emerald-600" onClick={(e) => { e.stopPropagation(); onMarkPaid(invoice.invoiceNumber); }}>
                  <Check className="w-3 h-3" />
                </Button>
              )}
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left font-semibold">Container #</th>
                  <th className="px-3 py-2 text-left font-semibold">Pull Date</th>
                  <th className="px-3 py-2 text-left font-semibold">Return Date</th>
                  <th className="px-3 py-2 text-right font-semibold">Chassis Days</th>
                  <th className="px-3 py-2 text-right font-semibold">Container Fee</th>
                  <th className="px-3 py-2 text-right font-semibold">Chassis Fee</th>
                  <th className="px-3 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.containers.map((c, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-3 py-1.5">
                      <Link href={`/container/${c.containerNumber}`}>
                        <span className="font-mono font-semibold text-primary hover:underline cursor-pointer">{c.containerNumber}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-muted-foreground">{c.pullDate || "—"}</td>
                    <td className="px-3 py-1.5 font-mono text-muted-foreground">{c.returnDate || "—"}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{c.chassisDays}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{fmt(c.containerFee)}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{fmt(c.chassisFee)}</td>
                    <td className="px-3 py-1.5 text-right font-mono font-medium">{fmt(c.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 font-semibold">
                  <td className="px-3 py-2" colSpan={3}>Total</td>
                  <td className="px-3 py-2 text-right font-mono">{totalChassis}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(invoice.containers.reduce((s, c) => s + c.containerFee, 0))}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(invoice.containers.reduce((s, c) => s + c.chassisFee, 0))}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(invoice.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="text-xs text-muted-foreground bg-muted/20 rounded-md p-3">
            <strong>Rates:</strong> $425/container + $30/day chassis (pay to M&A) → Bill client $495/container + $40/day chassis
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function DrayageInvoices() {
  const { store } = useStore();
  const invoices = store.getDrayageInvoices();
  const allContainers = store.getContainers();

  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalDue = invoices.filter(i => i.status === "due").reduce((s, i) => s + i.total, 0);
  const totalContainers = invoices.reduce((s, i) => s + i.containers.length, 0);
  const outNow = allContainers.filter(c => c.status === "in_transit").length;

  const handleMarkPaid = (num: string) => { store.markDrayageInvoicePaid(num); toast.success(`Invoice ${num} marked as paid`); };

  // Pending containers not yet on an M&A invoice
  const pendingMA = allContainers.filter(c => c.maDrayageStatus === "pending" && c.drayageSource === "m&a");

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/">
            <span className="text-muted-foreground hover:text-foreground cursor-pointer"><ArrowLeft className="w-5 h-5" /></span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Drayage Invoices</h1>
            <p className="text-sm text-muted-foreground mt-0.5">M&A Transport — Container Drayage & Chassis</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-1" />
              <div className="text-xl font-bold font-mono text-emerald-700">{fmt(totalPaid)}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Paid</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <AlertCircle className="w-5 h-5 text-red-600 mb-1" />
              <div className="text-xl font-bold font-mono text-red-600">{fmt(totalDue)}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Amount Due</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <Truck className="w-5 h-5 text-blue-600 mb-1" />
              <div className="text-xl font-bold font-mono">{totalContainers}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Containers Pulled</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <AlertCircle className="w-5 h-5 text-amber-600 mb-1" />
              <div className="text-xl font-bold font-mono text-amber-700">{outNow}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Currently Out</div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice List */}
        <div className="space-y-3">
          {invoices.map(inv => (
            <InvoiceCard key={inv.invoiceNumber} invoice={inv} onMarkPaid={handleMarkPaid} />
          ))}
        </div>

        {/* Pending Containers */}
        {pendingMA.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Pending — Not Yet Invoiced by M&A</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-3 py-2 text-left font-semibold">Container #</th>
                      <th className="px-3 py-2 text-left font-semibold">Status</th>
                      <th className="px-3 py-2 text-left font-semibold">Pull Date</th>
                      <th className="px-3 py-2 text-right font-semibold">Est. Chassis Days</th>
                      <th className="px-3 py-2 text-right font-semibold">Est. Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pendingMA.map(c => (
                      <tr key={c.id} className="hover:bg-muted/30">
                        <td className="px-3 py-1.5">
                          <Link href={`/container/${c.containerNumber}`}>
                            <span className="font-mono font-semibold text-primary hover:underline cursor-pointer">{c.containerNumber}</span>
                          </Link>
                        </td>
                        <td className="px-3 py-1.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${c.status === "in_transit" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                            {c.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 font-mono text-muted-foreground">{c.pullDate || "TBD"}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{c.chassisDays}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{fmt(c.maDrayageTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
