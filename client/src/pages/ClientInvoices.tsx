/**
 * Client Invoices — shows all invoices generated for Diamond Home.
 * Can export each to Excel, mark as sent/paid.
 */
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/useStore";
import { store } from "@/data/store";
import { exportClientInvoiceToExcel } from "@/lib/exportExcel";
import { toast } from "sonner";
import { Link } from "wouter";
import { ArrowLeft, FileText, Download, DollarSign, Send, Check } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export default function ClientInvoices() {
  const invoices = useStore(() => store.getClientInvoices());

  const totalDraft = invoices.filter(i => i.status === "draft").reduce((s, i) => s + i.total, 0);
  const totalSent = invoices.filter(i => i.status === "sent").reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);

  return (
    <Layout>
      <div className="space-y-5 max-w-6xl">
        <div>
          <Link href="/"><span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center gap-1 mb-2"><ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard</span></Link>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-700" /></div>
              <div>
                <h1 className="text-xl font-bold">Client Invoices — Diamond Home</h1>
                <p className="text-sm text-muted-foreground">{invoices.length} invoices generated</p>
              </div>
            </div>
            <Link href="/batch-invoice"><Button className="gap-2"><FileText className="w-4 h-4" /> New Invoice</Button></Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wider">Draft</div><div className="text-lg font-bold font-mono text-amber-600">{fmt(totalDraft)}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wider">Sent</div><div className="text-lg font-bold font-mono text-blue-600">{fmt(totalSent)}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground uppercase tracking-wider">Paid</div><div className="text-lg font-bold font-mono text-emerald-600">{fmt(totalPaid)}</div></CardContent></Card>
        </div>

        {invoices.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No client invoices yet. Use the Batch Invoice Builder to generate invoices.</p>
              <Link href="/batch-invoice"><Button variant="outline" className="mt-3 gap-2"><FileText className="w-4 h-4" /> Go to Batch Builder</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invoices.map(inv => (
              <Card key={inv.invoiceNumber}>
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {inv.invoiceNumber}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status === "paid" ? "bg-emerald-100 text-emerald-700" : inv.status === "sent" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{inv.status.toUpperCase()}</span>
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => { exportClientInvoiceToExcel(inv); toast.success("Excel downloaded"); }}><Download className="w-3 h-3" /> Excel</Button>
                      {inv.status === "draft" && <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => toast.info("Mark as sent — coming soon")}><Send className="w-3 h-3" /> Mark Sent</Button>}
                      {inv.status === "sent" && <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => toast.info("Mark as paid — coming soon")}><Check className="w-3 h-3" /> Mark Paid</Button>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-xs text-muted-foreground mb-2">Date: {inv.invoiceDate} · Period: {inv.period} · {inv.lines.length} containers</div>
                  <div className="overflow-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-2 py-1.5 text-left font-semibold">Container</th>
                          <th className="px-2 py-1.5 text-left font-semibold">PO</th>
                          <th className="px-2 py-1.5 text-right font-semibold">Cartons</th>
                          <th className="px-2 py-1.5 text-right font-semibold">Handling</th>
                          <th className="px-2 py-1.5 text-right font-semibold">Storage</th>
                          <th className="px-2 py-1.5 text-right font-semibold">Drayage</th>
                          <th className="px-2 py-1.5 text-right font-semibold">Chassis</th>
                          <th className="px-2 py-1.5 text-right font-semibold">Shrink Wrap</th>
                          <th className="px-2 py-1.5 text-right font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {inv.lines.map((l, idx) => (
                          <tr key={idx} className="hover:bg-muted/30">
                            <td className="px-2 py-1.5 font-mono font-semibold">{l.container}</td>
                            <td className="px-2 py-1.5 font-mono text-muted-foreground">{l.po}</td>
                            <td className="px-2 py-1.5 text-right font-mono">{l.cartons.toLocaleString()}</td>
                            <td className="px-2 py-1.5 text-right font-mono">{fmt(l.handlingRevenue)}</td>
                            <td className="px-2 py-1.5 text-right font-mono">{fmt(l.storageRevenue)}</td>
                            <td className="px-2 py-1.5 text-right font-mono">{fmt(l.drayageRevenue)}</td>
                            <td className="px-2 py-1.5 text-right font-mono">{fmt(l.chassisRevenue)}</td>
                            <td className="px-2 py-1.5 text-right font-mono">{fmt(l.shrinkWrapRevenue)}</td>
                            <td className="px-2 py-1.5 text-right font-mono font-semibold text-emerald-700">{fmt(l.totalRevenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 font-bold">
                          <td colSpan={8} className="px-2 py-2 text-right">TOTAL</td>
                          <td className="px-2 py-2 text-right font-mono text-emerald-700">{fmt(inv.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
