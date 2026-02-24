import Layout from "@/components/Layout";
import { store, type LumperInvoice } from "@/data/store";
import { useStore } from "@/hooks/useStore";
import { exportLumperInvoiceToExcel } from "@/lib/exportExcel";
import { Link } from "wouter";
import { useState } from "react";
import { ArrowLeft, Download, CheckCircle2, Clock, Plus, HardHat, FileText, AlertCircle, ChevronDown, ChevronUp, Check } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function LumperInvoices() {
  const invoices = useStore(() => store.getLumperInvoices());
  const containers = useStore(() => store.getContainers());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [provider, setProvider] = useState("Fernando Palma");

  // Containers that are unloaded but not yet on any lumper invoice
  const invoicedContainers = new Set(invoices.flatMap((i) => i.lines.map((l) => l.container)));
  const readyToBatch = containers.filter(
    (c) => (c.status === "unloaded" || c.status === "received") && c.fernandoUnloadDate && !invoicedContainers.has(c.container)
  );

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalDue = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  const totalContainers = invoices.reduce((s, i) => s + i.lines.length, 0);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const createInvoice = () => {
    if (selected.size === 0) return;
    const selContainers = containers.filter((c) => selected.has(c.container));
    const lines = selContainers.map((c) => ({
      container: c.container,
      cartons: c.cartons,
      skuCount: c.skuCount,
      rate: c.fernandoRate,
      unloadDate: c.fernandoUnloadDate || new Date().toISOString().slice(0, 10),
    }));
    const total = lines.reduce((s, l) => s + l.rate, 0);
    const invNum = `FP-2026-${String(invoices.length + 1).padStart(3, "0")}`;
    store.createLumperInvoice({
      invoiceNumber: invNum,
      invoiceDate: new Date().toISOString().slice(0, 10),
      vendor: provider,
      status: "due",
      lines,
      total,
    });
    setSelected(new Set());
    toast.success(`Created lumper invoice ${invNum} for ${selContainers.length} containers`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/"><span className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-1 cursor-pointer"><ArrowLeft className="w-3 h-3" /> Dashboard</span></Link>
            <h1 className="text-2xl font-bold tracking-tight">Lumper Invoices</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Fernando Palma — Container Unload Services</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
            <HardHat className="w-5 h-5 text-blue-600 mb-1" />
            <div className="text-xl font-bold font-mono">{totalContainers}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Containers Unloaded</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <Clock className="w-5 h-5 text-amber-600 mb-1" />
            <div className="text-xl font-bold font-mono text-amber-700">{readyToBatch.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Ready to Batch</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <FileText className="w-5 h-5 text-muted-foreground mb-1" />
            <div className="text-xl font-bold font-mono">{invoices.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Invoices</div>
          </div>
        </div>

        {/* Ready to Batch — always visible */}
        <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-800">
            <HardHat className="w-4 h-4" /> Ready to Batch ({readyToBatch.length})
            <span className="text-xs font-normal text-amber-600 ml-1">— Unloaded containers not yet on a lumper invoice</span>
          </h3>
          {readyToBatch.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No containers ready to batch. Containers appear here after they are unloaded by Freddy.</p>
          ) : (
            <>
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-amber-100/50 text-muted-foreground">
                      <th className="text-center px-3 py-2 w-8">
                        <input type="checkbox" checked={selected.size === readyToBatch.length && readyToBatch.length > 0}
                          onChange={() => { selected.size === readyToBatch.length ? setSelected(new Set()) : setSelected(new Set(readyToBatch.map((c) => c.container))); }} />
                      </th>
                      <th className="text-left px-3 py-2 font-medium">Container</th>
                      <th className="text-left px-3 py-2 font-medium">Period</th>
                      <th className="text-right px-3 py-2 font-medium">Cartons</th>
                      <th className="text-right px-3 py-2 font-medium">SKUs</th>
                      <th className="text-right px-3 py-2 font-medium">Rate</th>
                      <th className="text-left px-3 py-2 font-medium">Unload Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readyToBatch.map((c) => (
                      <tr key={c.container} className={`border-t border-amber-200/50 hover:bg-amber-100/30 ${selected.has(c.container) ? "bg-amber-100/50" : ""}`}>
                        <td className="text-center px-3 py-2"><input type="checkbox" checked={selected.has(c.container)} onChange={() => toggleSelect(c.container)} /></td>
                        <td className="px-3 py-2"><Link href={`/container/${c.container}`}><span className="font-mono font-semibold text-primary hover:underline cursor-pointer">{c.container}</span></Link></td>
                        <td className="px-3 py-2">{c.period}</td>
                        <td className="px-3 py-2 text-right font-mono">{c.cartons.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-mono">{c.skuCount}</td>
                        <td className="px-3 py-2 text-right font-mono">{fmt(c.fernandoRate)}</td>
                        <td className="px-3 py-2">{c.fernandoUnloadDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-3">
                <select value={provider} onChange={(e) => setProvider(e.target.value)} className="px-3 py-2 text-sm border border-border rounded-md bg-background">
                  <option value="Fernando Palma">Fernando Palma</option>
                  <option value="Other">Other</option>
                </select>
                <button onClick={createInvoice} disabled={selected.size === 0}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50 hover:opacity-90 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Create Invoice ({selected.size} containers · {fmt(containers.filter((c) => selected.has(c.container)).reduce((s, c) => s + c.fernandoRate, 0))})
                </button>
              </div>
            </>
          )}
        </div>

        {/* Invoice List */}
        <div className="space-y-3">
          {invoices.length === 0 && readyToBatch.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <HardHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No lumper invoices yet. Containers appear in Ready to Batch after they are unloaded.</p>
            </div>
          )}
          {invoices.map((inv) => (
            <div key={inv.invoiceNumber} className={`bg-card border rounded-lg overflow-hidden border-l-4 ${inv.status === "paid" ? "border-l-emerald-500" : "border-l-red-500"}`}>
              <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/30"
                onClick={() => setExpanded(expanded === inv.invoiceNumber ? null : inv.invoiceNumber)}>
                <div className="flex items-center gap-3">
                  <FileText className={`w-5 h-5 ${inv.status === "paid" ? "text-emerald-600" : "text-red-600"}`} />
                  <div>
                    <span className="font-mono font-semibold text-sm">{inv.invoiceNumber}</span>
                    <p className="text-xs text-muted-foreground">{inv.invoiceDate} · {inv.lines.length} containers</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${inv.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                    {inv.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-lg">{fmt(inv.total)}</span>
                  <button onClick={(e) => { e.stopPropagation(); exportLumperInvoiceToExcel(inv); toast.success("Exported"); }} className="p-1 hover:bg-accent rounded"><Download className="w-3.5 h-3.5" /></button>
                  {inv.status !== "paid" && (
                    <button onClick={(e) => { e.stopPropagation(); store.markLumperPaid(inv.invoiceNumber); toast.success("Marked as paid"); }}
                      className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Mark Paid
                    </button>
                  )}
                  {expanded === inv.invoiceNumber ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
              {expanded === inv.invoiceNumber && (
                <div className="border-t border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground">
                        <th className="text-left px-3 py-2 font-medium">Container</th>
                        <th className="text-right px-3 py-2 font-medium">Cartons</th>
                        <th className="text-right px-3 py-2 font-medium">SKUs</th>
                        <th className="text-left px-3 py-2 font-medium">Unload Date</th>
                        <th className="text-right px-3 py-2 font-medium">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.lines.map((l) => (
                        <tr key={l.container} className="border-t border-border hover:bg-muted/30">
                          <td className="px-3 py-2">
                            <Link href={`/container/${l.container}`}><span className="font-mono font-semibold text-primary hover:underline cursor-pointer">{l.container}</span></Link>
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{l.cartons.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right font-mono">{l.skuCount}</td>
                          <td className="px-3 py-2">{l.unloadDate}</td>
                          <td className="px-3 py-2 text-right font-mono font-medium">{fmt(l.rate)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border bg-muted/30">
                        <td colSpan={4} className="px-3 py-2 font-semibold text-right">Total</td>
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
