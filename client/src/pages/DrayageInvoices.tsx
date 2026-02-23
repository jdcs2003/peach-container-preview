import Layout from "@/components/Layout";
import { store, type DrayageInvoice } from "@/data/store";
import { useStore } from "@/hooks/useStore";
import { exportDrayageInvoiceToExcel } from "@/lib/exportExcel";
import { Link } from "wouter";
import { useState } from "react";
import { ArrowLeft, Download, CheckCircle2, Plus, Truck, FileText, AlertCircle, ChevronDown, ChevronUp, Check } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DrayageInvoices() {
  const invoices = useStore(() => store.getDrayageInvoices());
  const containers = useStore(() => store.getContainers());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showPush, setShowPush] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const invoicedContainers = new Set(invoices.flatMap((i) => i.lines.map((l) => l.container)));
  const pushable = containers.filter((c) => c.maPickup && !invoicedContainers.has(c.container) && c.status !== "canceled");

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalDue = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  const totalContainers = invoices.reduce((s, i) => s + i.lines.length, 0);

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const createInvoice = () => {
    if (selected.size === 0) return;
    const sel = containers.filter((c) => selected.has(c.container));
    const lines = sel.map((c) => ({
      container: c.container, pickup: c.maPickup, returnDate: c.maReturn,
      chassisDays: c.maChassisDays, containerFee: c.maDrayageCost, chassisFee: c.maChassisCost,
      total: c.maDrayageCost + c.maChassisCost,
    }));
    const total = lines.reduce((s, l) => s + l.total, 0);
    const invNum = `MA-2026-${String(invoices.length + 1).padStart(3, "0")}`;
    store.createDrayageInvoice({ invoiceNumber: invNum, invoiceDate: new Date().toISOString().slice(0, 10), vendor: "M&A Transport", status: "due", lines, total });
    setSelected(new Set()); setShowPush(false);
    toast.success(`Created drayage invoice ${invNum} for ${sel.length} containers`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/"><span className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-1 cursor-pointer"><ArrowLeft className="w-3 h-3" /> Dashboard</span></Link>
            <h1 className="text-2xl font-bold tracking-tight">Drayage Invoices</h1>
            <p className="text-sm text-muted-foreground mt-0.5">M&A Transport — Container Drayage & Chassis</p>
          </div>
          <button onClick={() => setShowPush(!showPush)} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Push to Drayage Payable
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-1" />
            <div className="text-xl font-bold font-mono text-emerald-700">{fmt(totalPaid)}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Paid</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-red-600 mb-1" />
            <div className="text-xl font-bold font-mono text-red-600">{fmt(totalDue)}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Amount Due</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Truck className="w-5 h-5 text-blue-600 mb-1" />
            <div className="text-xl font-bold font-mono">{totalContainers}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Containers Hauled</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <FileText className="w-5 h-5 text-muted-foreground mb-1" />
            <div className="text-xl font-bold font-mono">{invoices.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Invoices</div>
          </div>
        </div>

        {showPush && (
          <div className="bg-card border-2 border-primary/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Truck className="w-4 h-4" /> Select Containers to Create Drayage Invoice</h3>
            {pushable.length === 0 ? (
              <p className="text-sm text-muted-foreground">No containers with M&A pickup data that aren't already on a drayage invoice.</p>
            ) : (
              <>
                <div className="overflow-x-auto mb-3">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted/50 text-muted-foreground">
                      <th className="text-center px-3 py-2 w-8"><input type="checkbox" checked={selected.size === pushable.length && pushable.length > 0} onChange={() => { selected.size === pushable.length ? setSelected(new Set()) : setSelected(new Set(pushable.map((c) => c.container))); }} /></th>
                      <th className="text-left px-3 py-2 font-medium">Container</th>
                      <th className="text-left px-3 py-2 font-medium">Pickup</th>
                      <th className="text-left px-3 py-2 font-medium">Return</th>
                      <th className="text-right px-3 py-2 font-medium">Days</th>
                      <th className="text-right px-3 py-2 font-medium">Drayage</th>
                      <th className="text-right px-3 py-2 font-medium">Chassis</th>
                      <th className="text-right px-3 py-2 font-medium">Total</th>
                    </tr></thead>
                    <tbody>
                      {pushable.map((c) => (
                        <tr key={c.container} className="border-t border-border hover:bg-muted/30">
                          <td className="text-center px-3 py-2"><input type="checkbox" checked={selected.has(c.container)} onChange={() => toggleSelect(c.container)} /></td>
                          <td className="px-3 py-2 font-mono font-semibold">{c.container}</td>
                          <td className="px-3 py-2">{c.maPickup}</td>
                          <td className="px-3 py-2">{c.maReturn || "—"}</td>
                          <td className="px-3 py-2 text-right font-mono">{c.maChassisDays}</td>
                          <td className="px-3 py-2 text-right font-mono">{fmt(c.maDrayageCost)}</td>
                          <td className="px-3 py-2 text-right font-mono">{fmt(c.maChassisCost)}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold">{fmt(c.maDrayageCost + c.maChassisCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={createInvoice} disabled={selected.size === 0} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50 hover:opacity-90">
                  Create Invoice ({selected.size} containers · {fmt(containers.filter((c) => selected.has(c.container)).reduce((s, c) => s + c.maDrayageCost + c.maChassisCost, 0))})
                </button>
              </>
            )}
          </div>
        )}

        <div className="space-y-3">
          {invoices.length === 0 && (
            <div className="text-center py-12 text-muted-foreground"><Truck className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No drayage invoices yet.</p></div>
          )}
          {invoices.map((inv) => (
            <div key={inv.invoiceNumber} className={`bg-card border rounded-lg overflow-hidden border-l-4 ${inv.status === "paid" ? "border-l-emerald-500" : "border-l-red-500"}`}>
              <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/30" onClick={() => setExpanded(expanded === inv.invoiceNumber ? null : inv.invoiceNumber)}>
                <div className="flex items-center gap-3">
                  <Truck className={`w-5 h-5 ${inv.status === "paid" ? "text-emerald-600" : "text-red-600"}`} />
                  <div>
                    <span className="font-mono font-semibold text-sm">{inv.invoiceNumber}</span>
                    <p className="text-xs text-muted-foreground">{inv.invoiceDate} · {inv.lines.length} containers</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${inv.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>{inv.status}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-lg">{fmt(inv.total)}</span>
                  <button onClick={(e) => { e.stopPropagation(); exportDrayageInvoiceToExcel(inv); toast.success("Exported"); }} className="p-1 hover:bg-accent rounded"><Download className="w-3.5 h-3.5" /></button>
                  {inv.status !== "paid" && (
                    <button onClick={(e) => { e.stopPropagation(); store.markDrayagePaid(inv.invoiceNumber); toast.success("Marked as paid"); }} className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 flex items-center gap-1"><Check className="w-3 h-3" /> Mark Paid</button>
                  )}
                  {expanded === inv.invoiceNumber ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
              {expanded === inv.invoiceNumber && (
                <div className="border-t border-border">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted/50 text-muted-foreground">
                      <th className="text-left px-3 py-2 font-medium">Container</th>
                      <th className="text-left px-3 py-2 font-medium">Pickup</th>
                      <th className="text-left px-3 py-2 font-medium">Return</th>
                      <th className="text-right px-3 py-2 font-medium">Days</th>
                      <th className="text-right px-3 py-2 font-medium">Drayage</th>
                      <th className="text-right px-3 py-2 font-medium">Chassis</th>
                      <th className="text-right px-3 py-2 font-medium">Total</th>
                    </tr></thead>
                    <tbody>
                      {inv.lines.map((l) => (
                        <tr key={l.container} className="border-t border-border hover:bg-muted/30">
                          <td className="px-3 py-2"><Link href={`/container/${l.container}`}><span className="font-mono font-semibold text-primary hover:underline cursor-pointer">{l.container}</span></Link></td>
                          <td className="px-3 py-2">{l.pickup}</td>
                          <td className="px-3 py-2">{l.returnDate || "—"}</td>
                          <td className="px-3 py-2 text-right font-mono">{l.chassisDays}</td>
                          <td className="px-3 py-2 text-right font-mono">{fmt(l.containerFee)}</td>
                          <td className="px-3 py-2 text-right font-mono">{fmt(l.chassisFee)}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold">{fmt(l.total)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border bg-muted/30">
                        <td colSpan={6} className="px-3 py-2 font-semibold text-right">Total</td>
                        <td className="px-3 py-2 text-right font-mono font-bold">{fmt(inv.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
