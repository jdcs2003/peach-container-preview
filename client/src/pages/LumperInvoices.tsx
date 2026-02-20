/*
 * Lumper Invoices — Fernando Palma unload invoices
 * Shows each invoice with container-level detail, outbound work, and totals
 */
import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lumperInvoices, getLumperSummary, type LumperInvoice } from "@/data/lumperInvoices";
import { HardHat, ChevronDown, ChevronUp, ArrowLeft, FileText, CheckCircle2, AlertCircle } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

function InvoiceCard({ invoice }: { invoice: LumperInvoice }) {
  const [expanded, setExpanded] = useState(false);
  const isPaid = invoice.status === "paid";

  return (
    <Card className={`border-l-4 ${isPaid ? "border-l-emerald-500" : "border-l-red-500"}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className={`w-5 h-5 ${isPaid ? "text-emerald-600" : "text-red-600"}`} />
            <div>
              <CardTitle className="text-sm font-semibold font-mono">{invoice.invoiceNumber}</CardTitle>
              <p className="text-xs text-muted-foreground">{invoice.invoiceDate} · {invoice.vendor} · {invoice.containers.length} containers</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono font-bold text-lg">{fmt(invoice.total)}</div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${isPaid ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>
                {isPaid ? "PAID" : "DUE"}
              </span>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Container Unloads */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Container Unloads</h4>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-3 py-2 text-left font-semibold">Container #</th>
                    <th className="px-3 py-2 text-right font-semibold">SKUs</th>
                    <th className="px-3 py-2 text-right font-semibold">Cases</th>
                    <th className="px-3 py-2 text-left font-semibold">Date Unloaded</th>
                    <th className="px-3 py-2 text-right font-semibold">Rate</th>
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
                      <td className="px-3 py-1.5 text-right font-mono">{c.skus}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{c.cases.toLocaleString()}</td>
                      <td className="px-3 py-1.5 font-mono text-muted-foreground">{c.dateUnloaded}</td>
                      <td className="px-3 py-1.5 text-right font-mono font-medium">{fmt(c.payRate)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 font-semibold">
                    <td className="px-3 py-2" colSpan={4}>Unload Subtotal</td>
                    <td className="px-3 py-2 text-right font-mono">{fmt(invoice.subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Outbound Work */}
          {invoice.outbound && invoice.outbound.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Outbound / Labeling Work</h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-3 py-2 text-left font-semibold">Date</th>
                      <th className="px-3 py-2 text-right font-semibold">Boxes</th>
                      <th className="px-3 py-2 text-right font-semibold">Label Rate</th>
                      <th className="px-3 py-2 text-right font-semibold">Case Rate</th>
                      <th className="px-3 py-2 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoice.outbound.map((ob, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-3 py-1.5 font-mono text-muted-foreground">{ob.date}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{ob.boxes.toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-right font-mono">${ob.perLabel.toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">${ob.perCase.toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-medium">{fmt(ob.boxes * (ob.perLabel + ob.perCase))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 font-semibold">
                      <td className="px-3 py-2" colSpan={4}>Outbound Subtotal</td>
                      <td className="px-3 py-2 text-right font-mono">{fmt(invoice.outboundSubtotal || 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Additional Fees & Total */}
          <div className="border rounded-md p-3 bg-muted/20 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Unload Subtotal</span><span className="font-mono">{fmt(invoice.subtotal)}</span></div>
            {invoice.outboundSubtotal && <div className="flex justify-between"><span className="text-muted-foreground">Outbound Subtotal</span><span className="font-mono">{fmt(invoice.outboundSubtotal)}</span></div>}
            {invoice.adminFee && <div className="flex justify-between"><span className="text-muted-foreground">Admin Fee</span><span className="font-mono">{fmt(invoice.adminFee)}</span></div>}
            {invoice.trainingFee && <div className="flex justify-between"><span className="text-muted-foreground">Training Fee</span><span className="font-mono">{fmt(invoice.trainingFee)}</span></div>}
            {invoice.waitingFee && <div className="flex justify-between"><span className="text-muted-foreground">Waiting Fee</span><span className="font-mono">{fmt(invoice.waitingFee)}</span></div>}
            <div className="flex justify-between border-t pt-1.5 font-bold text-base">
              <span>Invoice Total</span>
              <span className="font-mono">{fmt(invoice.total)}</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function LumperInvoices() {
  const summary = getLumperSummary();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/">
            <span className="text-muted-foreground hover:text-foreground cursor-pointer"><ArrowLeft className="w-5 h-5" /></span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Lumper Invoices</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Fernando Palma — Container Unload & Outbound Work</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-1" />
              <div className="text-xl font-bold font-mono text-emerald-700">{fmt(summary.totalPaid)}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Paid</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <AlertCircle className="w-5 h-5 text-red-600 mb-1" />
              <div className="text-xl font-bold font-mono text-red-600">{fmt(summary.totalDue)}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Amount Due</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <HardHat className="w-5 h-5 text-blue-600 mb-1" />
              <div className="text-xl font-bold font-mono">{summary.totalContainers}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Containers Unloaded</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-slate-400">
            <CardContent className="p-4">
              <FileText className="w-5 h-5 text-slate-600 mb-1" />
              <div className="text-xl font-bold font-mono">{lumperInvoices.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Invoices</div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice List */}
        <div className="space-y-3">
          {lumperInvoices.map(inv => (
            <InvoiceCard key={inv.invoiceNumber} invoice={inv} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
