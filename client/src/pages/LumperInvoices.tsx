import Layout from "@/components/Layout";
import { store, type LumperInvoice, type OutboundInvoice, type OutboundLine } from "@/data/store";
import { useStore } from "@/hooks/useStore";
import { exportLumperInvoiceToExcel } from "@/lib/exportExcel";
import { Link } from "wouter";
import { useState } from "react";
import { ArrowLeft, Download, CheckCircle2, Clock, Plus, HardHat, FileText, AlertCircle, ChevronDown, ChevronUp, Check, X, Trash2, Package, Tag, ShoppingCart, DollarSign } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function LumperInvoices() {
  const invoices = useStore(() => store.getLumperInvoices());
  const containers = useStore(() => store.getContainers());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [provider, setProvider] = useState("Fernando Palma");
  const outboundInvoices = useStore(() => store.getOutboundInvoices());
  const [expandedOb, setExpandedOb] = useState<string | null>(null);

  // Outbound daily line entry state
  const [obLines, setObLines] = useState<{ date: string; cases: string; orders: string }[]>([
    { date: new Date().toISOString().slice(0, 10), cases: "", orders: "" },
  ]);
  const [obNotes, setObNotes] = useState("");

  // Containers that are unloaded but not yet on any lumper invoice
  const invoicedContainers = new Set(invoices.flatMap((i) => i.lines.map((l) => l.container)));
  const readyToBatch = containers.filter(
    (c) => (c.status === "unloaded" || c.status === "received") && c.fernandoUnloadDate && !invoicedContainers.has(c.container)
  );

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const totalDue = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  const totalContainers = invoices.reduce((s, i) => s + i.lines.length, 0);

  // Outbound totals
  const obTotalPaid = outboundInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const obTotalDue = outboundInvoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0);

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

  // Calculate outbound line preview
  const parsedObLines = obLines.map((l) => {
    const cases = parseInt(l.cases) || 0;
    const orders = parseInt(l.orders) || 0;
    const labelPay = Math.round(cases * 0.13 * 100) / 100;
    const pickPay = Math.round(cases * 0.10 * 100) / 100;
    return { date: l.date, cases, orders, labelPay, pickPay, comp: Math.round((labelPay + pickPay) * 100) / 100 };
  });
  const obTotalCases = parsedObLines.reduce((s, l) => s + l.cases, 0);
  const obTotalOrders = parsedObLines.reduce((s, l) => s + l.orders, 0);
  const obTotalLabel = parsedObLines.reduce((s, l) => s + l.labelPay, 0);
  const obTotalPick = parsedObLines.reduce((s, l) => s + l.pickPay, 0);
  const obPoFee = Math.round(obTotalOrders * 2.50 * 100) / 100;
  const obGrandTotal = Math.round((obTotalLabel + obTotalPick + obPoFee) * 100) / 100;

  const addObLine = () => setObLines([...obLines, { date: new Date().toISOString().slice(0, 10), cases: "", orders: "" }]);
  const removeObLine = (idx: number) => setObLines(obLines.filter((_, i) => i !== idx));
  const updateObLine = (idx: number, field: string, value: string) => {
    const next = [...obLines];
    (next[idx] as any)[field] = value;
    setObLines(next);
  };

  const createOutboundInvoice = () => {
    if (obTotalCases === 0 && obTotalOrders === 0) return;
    const invNum = `FP-OB-${String(outboundInvoices.length + 1).padStart(3, "0")}`;
    const lines: OutboundLine[] = parsedObLines.filter((l) => l.cases > 0 || l.orders > 0);
    store.createOutboundInvoice({
      invoiceNumber: invNum,
      invoiceDate: new Date().toISOString().slice(0, 10),
      vendor: "Fernando Palma",
      status: "due",
      lines,
      totalCases: obTotalCases,
      totalOrders: obTotalOrders,
      totalLabelPay: Math.round(obTotalLabel * 100) / 100,
      totalPickPay: Math.round(obTotalPick * 100) / 100,
      poFee: obPoFee,
      total: obGrandTotal,
      notes: obNotes,
    });
    setObLines([{ date: new Date().toISOString().slice(0, 10), cases: "", orders: "" }]);
    setObNotes("");
    toast.success(`Created outbound invoice ${invNum} — ${fmt(obGrandTotal)}`);
  };

  // Combined wire total (all due invoices — inbound + outbound)
  const combinedDue = totalDue + obTotalDue;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/"><span className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-1 cursor-pointer"><ArrowLeft className="w-3 h-3" /> Dashboard</span></Link>
            <h1 className="text-2xl font-bold tracking-tight">Lumper Invoices</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Fernando Palma — Container Unload & Outbound Services</p>
          </div>
        </div>

        {/* Combined Wire Amount */}
        {combinedDue > 0 && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-orange-600" />
              <div>
                <div className="text-sm font-semibold text-orange-800">Total Wire Amount Due</div>
                <div className="text-xs text-orange-600">Inbound ({fmt(totalDue)}) + Outbound ({fmt(obTotalDue)})</div>
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-orange-700">{fmt(combinedDue)}</div>
          </div>
        )}

        {/* ═══ INBOUND SECTION ═══ */}
        <div>
          <h2 className="text-lg font-bold tracking-tight mb-3 flex items-center gap-2"><HardHat className="w-5 h-5 text-amber-600" /> Inbound — Container Unload</h2>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
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
          <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-4 mb-4">
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

          {/* Inbound Invoice List */}
          <div className="space-y-3">
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
                    <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete invoice ${inv.invoiceNumber}? All containers will return to Ready to Batch.`)) { store.deleteLumperInvoice(inv.invoiceNumber); toast.success(`Deleted ${inv.invoiceNumber}`); } }} className="p-1 hover:bg-red-100 rounded text-red-400 hover:text-red-600 transition-colors" title="Delete Invoice"><Trash2 className="w-3.5 h-3.5" /></button>
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
                          <th className="w-8"></th>
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
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); if (confirm(`Remove ${l.container} from ${inv.invoiceNumber}?`)) { store.removeContainerFromLumperInvoice(inv.invoiceNumber, l.container); toast.success(`Removed ${l.container} from batch`); } }}
                                className="text-red-400 hover:text-red-600 transition-colors" title="Remove from batch"
                              ><X className="w-3.5 h-3.5" /></button>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-border bg-muted/30">
                          <td colSpan={4} className="px-3 py-2 font-semibold text-right">Total</td>
                          <td className="px-3 py-2 text-right font-mono font-bold">{fmt(inv.total)}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ OUTBOUND SECTION ═══ */}
        <div className="border-t-2 border-border pt-6">
          <h2 className="text-lg font-bold tracking-tight mb-1 flex items-center gap-2"><Package className="w-5 h-5 text-indigo-600" /> Outbound — Labeling, Picking & PO Fees</h2>
          <p className="text-sm text-muted-foreground mb-4">Fernando Palma — $0.13/case label · $0.10/case pick · $2.50/PO</p>

          {/* Outbound Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-1" />
              <div className="text-xl font-bold font-mono text-emerald-700">{fmt(obTotalPaid)}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Outbound Paid</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-red-600 mb-1" />
              <div className="text-xl font-bold font-mono text-red-600">{fmt(obTotalDue)}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Outbound Due</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <Tag className="w-5 h-5 text-indigo-600 mb-1" />
              <div className="text-xl font-bold font-mono text-indigo-700">{outboundInvoices.reduce((s, i) => s + i.totalCases, 0).toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Cases</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <FileText className="w-5 h-5 text-muted-foreground mb-1" />
              <div className="text-xl font-bold font-mono">{outboundInvoices.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Outbound Invoices</div>
            </div>
          </div>

          {/* Create Outbound Invoice — Daily Line Entry */}
          <div className="bg-indigo-50/50 border border-indigo-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-indigo-800">
              <Plus className="w-4 h-4" /> Create Outbound Invoice
            </h3>

            {/* Daily lines table */}
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-indigo-100/50 text-muted-foreground">
                    <th className="text-left px-2 py-2 font-medium">Date</th>
                    <th className="text-right px-2 py-2 font-medium">Boxes</th>
                    <th className="text-right px-2 py-2 font-medium">Orders</th>
                    <th className="text-right px-2 py-2 font-medium">Label ($0.13)</th>
                    <th className="text-right px-2 py-2 font-medium">Case Pick ($0.10)</th>
                    <th className="text-right px-2 py-2 font-medium">Comp</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {obLines.map((line, idx) => {
                    const p = parsedObLines[idx];
                    return (
                      <tr key={idx} className="border-t border-indigo-200/50">
                        <td className="px-2 py-1.5">
                          <input type="date" value={line.date} onChange={(e) => updateObLine(idx, "date", e.target.value)}
                            className="px-2 py-1 text-xs border border-border rounded bg-background w-32" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={line.cases} onChange={(e) => updateObLine(idx, "cases", e.target.value)}
                            placeholder="0" className="px-2 py-1 text-xs border border-border rounded bg-background w-20 text-right font-mono" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={line.orders} onChange={(e) => updateObLine(idx, "orders", e.target.value)}
                            placeholder="0" className="px-2 py-1 text-xs border border-border rounded bg-background w-16 text-right font-mono" />
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono">{p ? fmt(p.labelPay) : "$0.00"}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{p ? fmt(p.pickPay) : "$0.00"}</td>
                        <td className="px-2 py-1.5 text-right font-mono font-semibold">{p ? fmt(p.comp) : "$0.00"}</td>
                        <td className="px-2 py-1.5 text-center">
                          {obLines.length > 1 && (
                            <button onClick={() => removeObLine(idx)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totals row */}
                  <tr className="border-t-2 border-indigo-300 bg-indigo-100/30 font-semibold">
                    <td className="px-2 py-2">Total</td>
                    <td className="px-2 py-2 text-right font-mono">{obTotalCases.toLocaleString()}</td>
                    <td className="px-2 py-2 text-right font-mono">{obTotalOrders}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmt(obTotalLabel)}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmt(obTotalPick)}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmt(obTotalLabel + obTotalPick)}</td>
                    <td></td>
                  </tr>
                  <tr className="bg-indigo-100/30">
                    <td colSpan={5} className="px-2 py-1.5 text-right text-xs font-medium">Per Order $2.50 × {obTotalOrders}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-semibold">{fmt(obPoFee)}</td>
                    <td></td>
                  </tr>
                  <tr className="bg-indigo-200/40 font-bold">
                    <td colSpan={5} className="px-2 py-2 text-right">Total</td>
                    <td className="px-2 py-2 text-right font-mono text-indigo-700 text-sm">{fmt(obGrandTotal)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={addObLine} className="px-3 py-1.5 text-xs border border-indigo-300 rounded hover:bg-indigo-100 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Day
              </button>
              <input type="text" value={obNotes} onChange={(e) => setObNotes(e.target.value)}
                placeholder="Notes (e.g. Week of 2/17)" className="px-3 py-1.5 text-xs border border-border rounded bg-background w-48" />
              <button onClick={createOutboundInvoice} disabled={obTotalCases === 0 && obTotalOrders === 0}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded text-xs disabled:opacity-50 hover:bg-indigo-700 flex items-center gap-1.5 ml-auto">
                <Plus className="w-3.5 h-3.5" /> Create Outbound Invoice ({fmt(obGrandTotal)})
              </button>
            </div>
          </div>

          {/* Outbound Invoice List */}
          <div className="space-y-3">
            {outboundInvoices.map((inv) => (
              <div key={inv.invoiceNumber} className={`bg-card border rounded-lg overflow-hidden border-l-4 ${inv.status === "paid" ? "border-l-emerald-500" : "border-l-indigo-500"}`}>
                <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/30"
                  onClick={() => setExpandedOb(expandedOb === inv.invoiceNumber ? null : inv.invoiceNumber)}>
                  <div className="flex items-center gap-3">
                    <Package className={`w-5 h-5 ${inv.status === "paid" ? "text-emerald-600" : "text-indigo-600"}`} />
                    <div>
                      <span className="font-mono font-semibold text-sm">{inv.invoiceNumber}</span>
                      <p className="text-xs text-muted-foreground">{inv.invoiceDate} · {inv.totalCases.toLocaleString()} cases · {inv.totalOrders} POs{inv.notes ? ` · ${inv.notes}` : ""}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${inv.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"}`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-lg">{fmt(inv.total)}</span>
                    {inv.status !== "paid" && (
                      <button onClick={(e) => { e.stopPropagation(); store.markOutboundPaid(inv.invoiceNumber); toast.success("Marked as paid"); }}
                        className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Mark Paid
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete outbound invoice ${inv.invoiceNumber}?`)) { store.deleteOutboundInvoice(inv.invoiceNumber); toast.success(`Deleted ${inv.invoiceNumber}`); } }}
                      className="p-1 hover:bg-red-100 rounded text-red-400 hover:text-red-600 transition-colors" title="Delete Invoice"><Trash2 className="w-3.5 h-3.5" /></button>
                    {expandedOb === inv.invoiceNumber ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
                {expandedOb === inv.invoiceNumber && (
                  <div className="border-t border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50 text-muted-foreground">
                          <th className="text-left px-3 py-2 font-medium">Date</th>
                          <th className="text-right px-3 py-2 font-medium">Boxes</th>
                          <th className="text-right px-3 py-2 font-medium">Orders</th>
                          <th className="text-right px-3 py-2 font-medium">Label</th>
                          <th className="text-right px-3 py-2 font-medium">Case Pick</th>
                          <th className="text-right px-3 py-2 font-medium">Comp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.lines.map((l, idx) => (
                          <tr key={idx} className="border-t border-border hover:bg-muted/30">
                            <td className="px-3 py-2">{l.date}</td>
                            <td className="px-3 py-2 text-right font-mono">{l.cases.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right font-mono">{l.orders}</td>
                            <td className="px-3 py-2 text-right font-mono">{fmt(l.labelPay)}</td>
                            <td className="px-3 py-2 text-right font-mono">{fmt(l.pickPay)}</td>
                            <td className="px-3 py-2 text-right font-mono font-semibold">{fmt(l.comp)}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                          <td className="px-3 py-2">Total</td>
                          <td className="px-3 py-2 text-right font-mono">{inv.totalCases.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right font-mono">{inv.totalOrders}</td>
                          <td className="px-3 py-2 text-right font-mono">{fmt(inv.totalLabelPay)}</td>
                          <td className="px-3 py-2 text-right font-mono">{fmt(inv.totalPickPay)}</td>
                          <td className="px-3 py-2 text-right font-mono">{fmt(inv.totalLabelPay + inv.totalPickPay)}</td>
                        </tr>
                        <tr className="bg-muted/30">
                          <td colSpan={5} className="px-3 py-1.5 text-right text-xs font-medium">Per Order $2.50 × {inv.totalOrders}</td>
                          <td className="px-3 py-1.5 text-right font-mono font-semibold">{fmt(inv.poFee)}</td>
                        </tr>
                        <tr className="bg-muted/50 font-bold">
                          <td colSpan={5} className="px-3 py-2 text-right">Total</td>
                          <td className="px-3 py-2 text-right font-mono text-indigo-700">{fmt(inv.total)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
