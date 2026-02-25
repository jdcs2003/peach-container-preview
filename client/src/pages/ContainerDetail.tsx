import Layout from "@/components/Layout";
import { store, RATES } from "@/data/store";
import { useStore } from "@/hooks/useStore";
import { Link, useParams } from "wouter";
import { useState } from "react";
import { ArrowLeft, Package, DollarSign, Truck, HardHat, Edit2, Save, X, Calendar, BarChart3, Download, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  "on-the-water": "bg-cyan-100 text-cyan-700",
  "available-for-pickup": "bg-amber-100 text-amber-700",
  "in-transit": "bg-indigo-100 text-indigo-700",
  unloaded: "bg-emerald-100 text-emerald-700",
  "returned-to-pier": "bg-teal-100 text-teal-700",
  billed: "bg-purple-100 text-purple-700",
  canceled: "bg-red-100 text-red-700",
  "on-hold": "bg-orange-100 text-orange-700",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  "on-the-water": "On the Water",
  "available-for-pickup": "Available for Pick-up",
  "in-transit": "In Transit",
  unloaded: "Unloaded",
  "returned-to-pier": "Returned to Pier",
  billed: "Billed",
  canceled: "Canceled",
  "on-hold": "On Hold",
};

function InvoiceBadge({ inv }: { inv: { invoiceNumber: string; status: string } | null }) {
  if (!inv) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">UNBATCHED</span>;
  const isPaid = inv.status === "paid";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${isPaid ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
      {inv.invoiceNumber} {isPaid ? "PAID" : "DUE"}
    </span>
  );
}

function CostDetail({ container: c }: { container: ReturnType<typeof store.getContainer> & {} }) {
  const invoices = useStore(() => store.getInvoicesForContainer(c.container));
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4" /> Cost Detail (Payables)</h3>
      <table className="w-full text-sm">
        <thead><tr className="border-b"><th className="text-left py-1.5 font-semibold text-xs">Vendor</th><th className="text-left py-1.5 font-semibold text-xs">Line Item</th><th className="text-left py-1.5 font-semibold text-xs">Invoice</th><th className="text-right py-1.5 font-semibold text-xs">Amount</th></tr></thead>
        <tbody>
          <tr className="border-b">
            <td className="py-1.5">Fernando Palma</td>
            <td className="py-1.5">Container Unload</td>
            <td className="py-1.5"><InvoiceBadge inv={invoices.lumper} /></td>
            <td className="py-1.5 text-right font-mono font-medium">{fmt(c.fernandoTotal)}</td>
          </tr>
          <tr className="border-b">
            <td className="py-1.5">M&A Transport</td>
            <td className="py-1.5">Drayage ($425/cntr)</td>
            <td className="py-1.5"><InvoiceBadge inv={invoices.drayage} /></td>
            <td className="py-1.5 text-right font-mono font-medium">{fmt(c.maDrayageCost)}</td>
          </tr>
          <tr className="border-b">
            <td className="py-1.5">M&A Transport</td>
            <td className="py-1.5">Chassis ({c.maChassisDays} days × $30)</td>
            <td className="py-1.5"><InvoiceBadge inv={invoices.drayage} /></td>
            <td className="py-1.5 text-right font-mono font-medium">{fmt(c.maChassisCost)}</td>
          </tr>
          <tr className="border-b">
            <td className="py-1.5">Pallet Supplier</td>
            <td className="py-1.5">Pallets ({c.pallets} × ${RATES.palletCost})</td>
            <td className="py-1.5"></td>
            <td className="py-1.5 text-right font-mono font-medium">{fmt(c.palletCost)}</td>
          </tr>
          <tr className="font-semibold bg-red-50/50">
            <td className="py-2" colSpan={3}>Total Cost</td>
            <td className="py-2 text-right font-mono text-red-700">{fmt(c.totalCost)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function ContainerDetail() {
  const { id } = useParams<{ id: string }>();
  const container = useStore(() => store.getContainer(id || ""));
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string | number>>({});

  if (!container) {
    return (
      <Layout>
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-xl font-semibold mb-2">Container Not Found</h2>
          <Link href="/"><span className="text-primary hover:underline cursor-pointer">Back to Dashboard</span></Link>
        </div>
      </Layout>
    );
  }

  const c = container;
  const marginPct = c.totalRevenue > 0 ? ((c.grossMargin / c.totalRevenue) * 100).toFixed(1) : "0.0";

  const startEdit = () => {
    setForm({
      status: c.status, cartons: c.cartons, skuCount: c.skuCount, pallets: c.pallets,
      billableCuft: c.billableCuft, maChassisDays: c.maChassisDays, maPickup: c.maPickup,
      maReturn: c.maReturn, fernandoRate: c.fernandoRate, fernandoUnloadDate: c.fernandoUnloadDate,
      eta: c.eta, po: c.po, notes: c.notes,
    });
    setEditing(true);
  };

  const saveEdit = () => {
    // If status changed, use changeStatus for safe timestamp tracking
    if (form.status !== c.status) {
      let unloadDate: string | undefined;
      let availableDate: string | undefined;
      if (form.status === "unloaded" || form.status === "returned-to-pier") {
        unloadDate = String(form.fernandoUnloadDate || "");
        if (!unloadDate) {
          unloadDate = prompt("Enter unload date (YYYY-MM-DD):", new Date().toISOString().split("T")[0]) || new Date().toISOString().split("T")[0];
          form.fernandoUnloadDate = unloadDate;
        }
      }
      if (form.status === "available-for-pickup" || form.status === "returned-to-pier") {
        availableDate = prompt("Enter date available for pick-up (YYYY-MM-DD):", new Date().toISOString().split("T")[0]) || new Date().toISOString().split("T")[0];
      }
      store.changeStatus(c.container, form.status as any, { unloadDate, availableDate });
    }
    // Update other fields without touching status (already handled above)
    store.updateContainer(c.container, {
      cartons: Number(form.cartons) || 0, skuCount: Number(form.skuCount) || 0,
      pallets: Number(form.pallets) || 0, billableCuft: Number(form.billableCuft) || 0,
      maChassisDays: Number(form.maChassisDays) || 0, maPickup: String(form.maPickup || ""),
      maReturn: String(form.maReturn || ""), fernandoRate: Number(form.fernandoRate) || RATES.fernandoBaseRate,
      fernandoUnloadDate: String(form.fernandoUnloadDate || ""), eta: String(form.eta || ""),
      po: String(form.po || ""), notes: String(form.notes || ""),
    });
    setEditing(false);
    toast.success("Container updated — billing recalculated");
  };

  const markUnloaded = () => {
    const dateStr = prompt("Enter unload date (YYYY-MM-DD):", new Date().toISOString().slice(0, 10));
    if (!dateStr) return;
    store.markUnloaded(c.container, {
      cartons: c.cartons, skuCount: c.skuCount,
      fernandoUnloadDate: dateStr,
      fernandoRate: c.fernandoRate || RATES.fernandoBaseRate,
    });
    toast.success("Container marked as unloaded — lumper payable generated");
  };

  const STATUS_FLOW = [
    { key: "pending" as const, label: "Pending", tsKey: "pending" as const },
    { key: "on-the-water" as const, label: "On the Water", tsKey: "onTheWater" as const },
    { key: "available-for-pickup" as const, label: "Avail Pickup", tsKey: "availableForPickup" as const },
    { key: "in-transit" as const, label: "In Transit", tsKey: "inTransit" as const },
    { key: "unloaded" as const, label: "Unloaded", tsKey: "unloaded" as const },
    { key: "returned-to-pier" as const, label: "Returned", tsKey: "returnedToPier" as const },
  ];
  const ts = c.statusTimestamps || {};
  const currentIdx = STATUS_FLOW.findIndex(s => s.key === c.status);

  return (
    <Layout>
      <div className="space-y-5 max-w-5xl">
        {/* Header */}
        <div>
          <Link href="/"><span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center gap-1 mb-2"><ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard</span></Link>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="w-5 h-5 text-primary" /></div>
            <div>
              <h1 className="text-xl font-bold font-mono">{c.container}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {c.po && <span>PO #{c.po}</span>}
                {c.po && <span>·</span>}
                <span>{c.period}</span>
                <span>·</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${statusColors[c.status] || "bg-gray-100 text-gray-600"}`}>{statusLabels[c.status] || c.status}</span>
              </div>
            </div>
            <div className="flex gap-2 ml-auto">
              {!editing && (c.status === "available-for-pickup" || c.status === "in-transit" || c.status === "on-the-water" || c.status === "pending") && (
                <button onClick={markUnloaded} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center gap-1.5">
                  <HardHat className="w-3.5 h-3.5" /> Mark Unloaded
                </button>
              )}
              {!editing ? (
                <button onClick={startEdit} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-1.5"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save</button>
                  <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm bg-muted text-muted-foreground rounded-md hover:bg-muted/80 flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Edit Container</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Status", key: "status", type: "select", options: ["pending", "on-the-water", "available-for-pickup", "in-transit", "unloaded", "returned-to-pier", "billed", "canceled", "on-hold"] },
                { label: "ETA", key: "eta", type: "date" },
                { label: "PO", key: "po", type: "text" },
                { label: "Cartons", key: "cartons", type: "number" },
                { label: "SKUs", key: "skuCount", type: "number" },
                { label: "Pallets", key: "pallets", type: "number" },
                { label: "Billable CuFt", key: "billableCuft", type: "number" },
                { label: "Chassis Days", key: "maChassisDays", type: "number" },
                { label: "M&A Pickup", key: "maPickup", type: "date" },
                { label: "M&A Return", key: "maReturn", type: "date" },
                { label: "Fernando Rate", key: "fernandoRate", type: "number" },
                { label: "Unload Date", key: "fernandoUnloadDate", type: "date" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{f.label}</label>
                  {f.type === "select" ? (
                    <select value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="w-full mt-0.5 px-2 py-1.5 text-sm border border-border rounded-md bg-background">
                      {f.options?.map((o) => <option key={o} value={o}>{statusLabels[o] || o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                      className="w-full mt-0.5 px-2 py-1.5 text-sm border border-border rounded-md bg-background font-mono" />
                  )}
                </div>
              ))}
              <div className="col-span-2 md:col-span-4">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Notes</label>
                <input type="text" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full mt-0.5 px-2 py-1.5 text-sm border border-border rounded-md bg-background" />
              </div>
            </div>
          </div>
        )}

        {/* Status Timeline */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4"><Clock className="w-4 h-4" /> Status Timeline</h3>
          <div className="flex items-center gap-0">
            {STATUS_FLOW.map((step, i) => {
              const tsVal = (ts as any)[step.tsKey];
              const isActive = step.key === c.status;
              const isPast = currentIdx >= 0 && i < currentIdx;
              const isFuture = currentIdx >= 0 && i > currentIdx;
              return (
                <div key={step.key} className="flex-1 relative">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      isActive ? "bg-primary text-primary-foreground border-primary" :
                      isPast ? "bg-emerald-500 text-white border-emerald-500" :
                      "bg-muted text-muted-foreground border-border"
                    }`}>
                      {isPast ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>
                    <div className={`text-[10px] mt-1 text-center font-semibold ${isActive ? "text-primary" : isPast ? "text-emerald-700" : "text-muted-foreground"}`}>{step.label}</div>
                    {tsVal && <div className="text-[9px] text-muted-foreground mt-0.5">{new Date(tsVal).toLocaleDateString()}</div>}
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={`absolute top-4 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-0.5 ${isPast ? "bg-emerald-500" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
          {(c.status === "on-hold" || c.status === "canceled" || c.status === "billed") && (
            <div className="mt-3 text-xs text-muted-foreground">Current status: <span className={`font-semibold px-1.5 py-0.5 rounded ${statusColors[c.status]}`}>{statusLabels[c.status]}</span></div>
          )}
        </div>

        {/* Margin Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 border-l-4 border-l-emerald-500">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Revenue</div>
            <div className="text-2xl font-bold font-mono text-emerald-700">{fmt(c.totalRevenue)}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 border-l-4 border-l-red-500">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cost</div>
            <div className="text-2xl font-bold font-mono text-red-700">{fmt(c.totalCost)}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 border-l-4 border-l-blue-500">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Margin ({marginPct}%)</div>
            <div className={`text-2xl font-bold font-mono ${c.grossMargin >= 0 ? "text-blue-700" : "text-red-700"}`}>{fmt(c.grossMargin)}</div>
          </div>
        </div>

        {/* Container Info + Drayage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Calendar className="w-4 h-4" /> Container Info</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              {[
                ["ETA", c.eta || "—"],
                ["Arrival Date", c.fernandoUnloadDate || "—"],
                ["Cartons", c.cartons > 0 ? c.cartons.toLocaleString() : "—"],
                ["Billable CuFt", c.billableCuft > 0 ? c.billableCuft.toLocaleString() : "—"],
                ["Pallets", c.pallets > 0 ? String(c.pallets) : "—"],
                ["SKU Count", c.skuCount > 0 ? String(c.skuCount) : "—"],
              ].map(([label, val]) => (
                <><div key={label} className="text-muted-foreground">{label}</div><div className="font-mono font-medium">{val}</div></>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Truck className="w-4 h-4" /> Drayage & Chassis (M&A)</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              {[
                ["Pickup", c.maPickup || "—"],
                ["Return", c.maReturn || "—"],
                ["Chassis Days", c.maChassisDays > 0 ? `${c.maChassisDays} days` : "—"],
                ["Drayage Cost", fmt(c.maDrayageCost)],
                ["Chassis Cost", fmt(c.maChassisCost)],
                ["Total M&A", fmt(c.maDrayageCost + c.maChassisCost)],
              ].map(([label, val]) => (
                <><div key={label} className="text-muted-foreground">{label}</div><div className="font-mono font-medium">{val}</div></>
              ))}
            </div>
          </div>
        </div>

        {/* Inbound Tracking */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Package className="w-4 h-4" /> Inbound Tracking</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              ["In Extensiv", c.inExtensiv],
              ["PL Received", c.plReceived],
              ["DO Received", c.doReceived],
            ].map(([label, val]) => (
              <div key={label as string} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${val ? "bg-emerald-500" : "bg-red-400"}`} />
                <span className="text-sm">{label as string}: <strong>{val ? "YES" : "NO"}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Detail */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-2 mb-3"><DollarSign className="w-4 h-4" /> Revenue (Bill to Diamond Home)</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-1.5 font-semibold text-xs">Line Item</th><th className="text-right py-1.5 font-semibold text-xs">Rate</th><th className="text-right py-1.5 font-semibold text-xs">Qty</th><th className="text-right py-1.5 font-semibold text-xs">Amount</th></tr></thead>
            <tbody>
              <tr className="border-b">
                <td className="py-1.5">IB Handling</td>
                <td className="py-1.5 text-right font-mono text-muted-foreground">$0.15/ctn</td>
                <td className="py-1.5 text-right font-mono">{c.cartons > 0 ? c.cartons.toLocaleString() : "—"}</td>
                <td className="py-1.5 text-right font-mono font-medium">{fmt(c.handlingRevenue)}{c.handlingRevenue === RATES.handlingMinimum && c.cartons * RATES.handlingPerCarton < RATES.handlingMinimum && <span className="text-[10px] text-amber-600 ml-1">(MIN)</span>}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5">Storage</td>
                <td className="py-1.5 text-right font-mono text-muted-foreground">${RATES.storagePerCuft}/cuft</td>
                <td className="py-1.5 text-right font-mono">{c.billableCuft > 0 ? c.billableCuft.toLocaleString() : "—"}</td>
                <td className="py-1.5 text-right font-mono font-medium">{fmt(c.storageRevenue)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5">Drayage Pass-through</td>
                <td className="py-1.5 text-right font-mono text-muted-foreground">${RATES.drayageRevenue}/cntr</td>
                <td className="py-1.5 text-right font-mono">1</td>
                <td className="py-1.5 text-right font-mono font-medium">{fmt(c.drayageRevenue)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5">Chassis</td>
                <td className="py-1.5 text-right font-mono text-muted-foreground">${RATES.chassisRevenuePerDay}/day</td>
                <td className="py-1.5 text-right font-mono">{c.maChassisDays} days</td>
                <td className="py-1.5 text-right font-mono font-medium">{fmt(c.chassisRevenue)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5">Shrink Wrap</td>
                <td className="py-1.5 text-right font-mono text-muted-foreground">${RATES.shrinkWrapPerPallet}/plt</td>
                <td className="py-1.5 text-right font-mono">{c.pallets} pallets</td>
                <td className="py-1.5 text-right font-mono font-medium">{fmt(c.shrinkWrapRevenue)}</td>
              </tr>
              <tr className="font-semibold bg-emerald-50/50">
                <td className="py-2" colSpan={3}>Total Revenue</td>
                <td className="py-2 text-right font-mono text-emerald-700">{fmt(c.totalRevenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cost Detail */}
        <CostDetail container={c} />

        {/* Gross Margin */}
        <div className={`border rounded-lg p-4 ${c.grossMargin >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Gross Margin ({marginPct}%)</div>
              <div className="text-xs text-muted-foreground">Revenue {fmt(c.totalRevenue)} − Cost {fmt(c.totalCost)}</div>
            </div>
            <div className={`text-3xl font-bold font-mono ${c.grossMargin >= 0 ? "text-emerald-700" : "text-red-600"}`}>{fmt(c.grossMargin)}</div>
          </div>
        </div>

        {/* Notes */}
        {c.notes && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">Notes</h3>
            <p className="text-sm text-muted-foreground">{c.notes}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
