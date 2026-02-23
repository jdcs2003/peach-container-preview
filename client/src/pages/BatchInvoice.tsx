/**
 * Batch Invoice Builder — select completed containers, generate:
 * 1. Lumper payable invoice (Fernando Palma)
 * 2. M&A drayage payable invoice
 * 3. Client billable invoice (Diamond Home)
 * Export any to Excel.
 */
import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/hooks/useStore";
import { store, type Container, type LumperInvoice, type DrayageInvoice, type ClientInvoice, RATES } from "@/data/store";
import { exportLumperInvoiceToExcel, exportDrayageInvoiceToExcel, exportClientInvoiceToExcel } from "@/lib/exportExcel";
import { toast } from "sonner";
import { Link } from "wouter";
import { ArrowLeft, FileText, HardHat, Truck, DollarSign, Download, Check, CheckSquare, Square } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

type InvoiceType = "lumper" | "drayage" | "client";

export default function BatchInvoice() {
  const containers = useStore(() => store.getContainers());

  const [invoiceType, setInvoiceType] = useState<InvoiceType>("lumper");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = useState("");
  const [generatedInvoice, setGeneratedInvoice] = useState<LumperInvoice | DrayageInvoice | ClientInvoice | null>(null);

  // Filter containers based on invoice type
  const eligible = useMemo(() => {
    return containers.filter(c => {
      if (invoiceType === "lumper") return (c.status === "unloaded" || c.status === "received") && c.fernandoTotal > 0;
      if (invoiceType === "drayage") return c.maDrayageCost > 0 || c.maChassisCost > 0;
      if (invoiceType === "client") return (c.status === "unloaded" || c.status === "received") && !c.billed;
      return false;
    });
  }, [containers, invoiceType]);

  const toggleSelect = (cn: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(cn)) next.delete(cn); else next.add(cn);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === eligible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible.map(c => c.container)));
    }
  };

  const selectedContainers = eligible.filter(c => selected.has(c.container));

  const totals = useMemo(() => {
    if (invoiceType === "lumper") return selectedContainers.reduce((s, c) => s + c.fernandoTotal, 0);
    if (invoiceType === "drayage") return selectedContainers.reduce((s, c) => s + c.maDrayageCost + c.maChassisCost, 0);
    return selectedContainers.reduce((s, c) => s + c.totalRevenue, 0);
  }, [selectedContainers, invoiceType]);

  const generateInvoice = () => {
    if (selectedContainers.length === 0) { toast.error("Select at least one container"); return; }
    if (!invoiceNumber.trim()) { toast.error("Enter an invoice number"); return; }

    if (invoiceType === "lumper") {
      const inv: LumperInvoice = {
        invoiceNumber,
        invoiceDate,
        vendor: "Fernando Palma",
        status: "due",
        lines: selectedContainers.map(c => ({
          container: c.container,
          cartons: c.cartons,
          skuCount: c.skuCount,
          rate: c.fernandoRate,
          unloadDate: c.fernandoUnloadDate,
        })),
        total: totals,
      };
      store.createLumperInvoice(inv);
      setGeneratedInvoice(inv);
      toast.success(`Lumper invoice ${invoiceNumber} created for ${selectedContainers.length} containers — ${fmt(totals)}`);
    } else if (invoiceType === "drayage") {
      const inv: DrayageInvoice = {
        invoiceNumber,
        invoiceDate,
        vendor: "M&A Transport",
        status: "due",
        lines: selectedContainers.map(c => ({
          container: c.container,
          pickup: c.maPickup,
          returnDate: c.maReturn,
          chassisDays: c.maChassisDays,
          containerFee: c.maDrayageCost,
          chassisFee: c.maChassisCost,
          total: c.maDrayageCost + c.maChassisCost,
        })),
        total: totals,
      };
      store.createDrayageInvoice(inv);
      setGeneratedInvoice(inv);
      toast.success(`Drayage invoice ${invoiceNumber} created for ${selectedContainers.length} containers — ${fmt(totals)}`);
    } else {
      const inv: ClientInvoice = {
        invoiceNumber,
        invoiceDate,
        client: "Diamond Home",
        period: period || "Custom",
        status: "draft",
        lines: selectedContainers.map(c => ({
          container: c.container,
          po: c.po,
          cartons: c.cartons,
          billableCuft: c.billableCuft,
          pallets: c.pallets,
          chassisDays: c.maChassisDays,
          handlingRevenue: c.handlingRevenue,
          storageRevenue: c.storageRevenue,
          drayageRevenue: c.drayageRevenue,
          chassisRevenue: c.chassisRevenue,
          shrinkWrapRevenue: c.shrinkWrapRevenue,
          totalRevenue: c.totalRevenue,
        })),
        total: totals,
      };
      store.createClientInvoice(inv);
      setGeneratedInvoice(inv);
      toast.success(`Client invoice ${invoiceNumber} created for ${selectedContainers.length} containers — ${fmt(totals)}`);
    }
    setSelected(new Set());
  };

  const exportGenerated = () => {
    if (!generatedInvoice) return;
    if (invoiceType === "lumper") exportLumperInvoiceToExcel(generatedInvoice as LumperInvoice);
    else if (invoiceType === "drayage") exportDrayageInvoiceToExcel(generatedInvoice as DrayageInvoice);
    else exportClientInvoiceToExcel(generatedInvoice as ClientInvoice);
    toast.success("Excel file downloaded");
  };

  const typeConfig = {
    lumper: { label: "Lumper Payable", icon: HardHat, color: "text-amber-700", vendor: "Fernando Palma" },
    drayage: { label: "M&A Drayage Payable", icon: Truck, color: "text-blue-700", vendor: "M&A Transport" },
    client: { label: "Client Invoice (Diamond Home)", icon: DollarSign, color: "text-emerald-700", vendor: "Diamond Home" },
  };
  const cfg = typeConfig[invoiceType];

  return (
    <Layout>
      <div className="space-y-5 max-w-6xl">
        {/* Header */}
        <div>
          <Link href="/"><span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center gap-1 mb-2"><ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard</span></Link>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div>
            <div>
              <h1 className="text-xl font-bold">Batch Invoice Builder</h1>
              <p className="text-sm text-muted-foreground">Select containers → Generate invoice → Export to Excel</p>
            </div>
          </div>
        </div>

        {/* Invoice Type Selector */}
        <div className="flex gap-2">
          {(["lumper", "drayage", "client"] as InvoiceType[]).map(t => {
            const Icon = typeConfig[t].icon;
            return (
              <Button key={t} variant={invoiceType === t ? "default" : "outline"} onClick={() => { setInvoiceType(t); setSelected(new Set()); setGeneratedInvoice(null); }} className="gap-2">
                <Icon className="w-4 h-4" /> {typeConfig[t].label}
              </Button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Container selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <cfg.icon className={`w-4 h-4 ${cfg.color}`} /> Select Containers for {cfg.label}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                    {selected.size === eligible.length && eligible.length > 0 ? "Deselect All" : "Select All"} ({eligible.length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {eligible.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">No eligible containers found for this invoice type.</div>
                ) : (
                  <div className="overflow-auto max-h-[500px]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                        <tr>
                          <th className="px-3 py-2 text-left w-8"></th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Container</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Period</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                          {invoiceType === "lumper" && (
                            <>
                              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">Cartons</th>
                              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">Rate</th>
                            </>
                          )}
                          {invoiceType === "drayage" && (
                            <>
                              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">Chassis Days</th>
                              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">Total</th>
                            </>
                          )}
                          {invoiceType === "client" && (
                            <>
                              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">Cartons</th>
                              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">Revenue</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {eligible.map(c => {
                          const isSelected = selected.has(c.container);
                          return (
                            <tr key={c.container} onClick={() => toggleSelect(c.container)} className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                              <td className="px-3 py-2">{isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground/40" />}</td>
                              <td className="px-3 py-2 font-mono text-xs font-semibold">{c.container}</td>
                              <td className="px-3 py-2 text-xs">{c.period}</td>
                              <td className="px-3 py-2 text-xs uppercase">{c.status}</td>
                              {invoiceType === "lumper" && (
                                <>
                                  <td className="px-3 py-2 text-right font-mono text-xs">{c.cartons.toLocaleString()}</td>
                                  <td className="px-3 py-2 text-right font-mono text-xs">{fmt(c.fernandoTotal)}</td>
                                </>
                              )}
                              {invoiceType === "drayage" && (
                                <>
                                  <td className="px-3 py-2 text-right font-mono text-xs">{c.maChassisDays}</td>
                                  <td className="px-3 py-2 text-right font-mono text-xs">{fmt(c.maDrayageCost + c.maChassisCost)}</td>
                                </>
                              )}
                              {invoiceType === "client" && (
                                <>
                                  <td className="px-3 py-2 text-right font-mono text-xs">{c.cartons.toLocaleString()}</td>
                                  <td className="px-3 py-2 text-right font-mono text-xs text-emerald-700">{fmt(c.totalRevenue)}</td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Invoice details + generate */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold">Invoice Details</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div>
                  <Label className="text-xs">Invoice Number *</Label>
                  <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder={invoiceType === "lumper" ? "FP-20260221" : invoiceType === "drayage" ? "MA-20260221" : "INV-2102"} className="font-mono h-9" />
                </div>
                <div>
                  <Label className="text-xs">Invoice Date</Label>
                  <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="h-9" />
                </div>
                {invoiceType === "client" && (
                  <div>
                    <Label className="text-xs">Period</Label>
                    <Input value={period} onChange={e => setPeriod(e.target.value)} placeholder="Feb Wk3" className="h-9" />
                  </div>
                )}
                <div className="text-xs text-muted-foreground">Vendor: <span className="font-medium">{cfg.vendor}</span></div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className={selected.size > 0 ? "border-primary/30" : ""}>
              <CardContent className="p-4 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selection Summary</div>
                <div className="flex justify-between text-sm"><span>Containers</span><span className="font-mono font-semibold">{selected.size}</span></div>
                <div className="flex justify-between text-sm border-t pt-2 font-bold">
                  <span>Total</span>
                  <span className={`font-mono ${invoiceType === "client" ? "text-emerald-700" : "text-red-600"}`}>{fmt(totals)}</span>
                </div>
              </CardContent>
            </Card>

            <Button onClick={generateInvoice} className="w-full gap-2" disabled={selected.size === 0}>
              <Check className="w-4 h-4" /> Generate {cfg.label}
            </Button>

            {generatedInvoice && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-4 space-y-2">
                  <div className="text-sm font-semibold text-emerald-800 flex items-center gap-2"><Check className="w-4 h-4" /> Invoice Generated</div>
                  <div className="text-xs text-emerald-700">{generatedInvoice.invoiceNumber} — {fmt(generatedInvoice.total)}</div>
                  <Button variant="outline" size="sm" onClick={exportGenerated} className="w-full gap-2 mt-2"><Download className="w-4 h-4" /> Export to Excel</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
