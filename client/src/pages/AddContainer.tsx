/**
 * Add Container — enter new container, auto-calculates billing on the fly.
 * Status workflow: pending → in_transit → received → unloaded
 * When marked as arrived/unloaded, auto-generates M&A and lumper payable records.
 */
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/hooks/useStore";
import { RATES, calculateBilling, type ContainerStatus, type DrayageSource } from "@/data/store";
import { toast } from "sonner";
import { ArrowLeft, Package, DollarSign, Truck, HardHat, Calculator } from "lucide-react";
import { Link } from "wouter";

const fmt = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export default function AddContainer() {
  const { store } = useStore();
  const [, navigate] = useLocation();

  const [form, setForm] = useState({
    containerNumber: "",
    po: "",
    period: "",
    eta: "",
    status: "pending" as ContainerStatus,
    ssl: "",
    notes: "",
    // Cargo (filled when arrived)
    cartons: 0,
    inbCuft: 0,
    pallets: 0,
    skuCount: 0,
    // Drayage
    drayageSource: "m&a" as DrayageSource,
    pullDate: "",
    returnDate: "",
    chassisDays: 0,
    // Lumper
    lumperVendor: "Fernando Palma",
    lumperRate: RATES.unloadFernando,
    dateUnloaded: "",
    arrivalDate: "",
  });

  const set = (key: string, value: string | number) => setForm(f => ({ ...f, [key]: value }));

  // Live billing preview
  const preview = useMemo(() => {
    return calculateBilling({
      ...form,
      billableCuft: Math.max(form.inbCuft, form.cartons * RATES.minCuftPerCase),
    });
  }, [form]);

  // Auto-calc chassis days when dates change
  const calcChassisDays = (pull: string, ret: string) => {
    if (pull && ret) {
      const diff = Math.ceil((new Date(ret).getTime() - new Date(pull).getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0) set("chassisDays", diff);
    }
  };

  const handleSubmit = () => {
    if (!form.containerNumber.trim()) {
      toast.error("Container number is required");
      return;
    }
    // Check for duplicate
    if (store.getContainer(form.containerNumber)) {
      toast.error("Container already exists");
      return;
    }

    const billableCuft = Math.max(form.inbCuft, form.cartons * RATES.minCuftPerCase);

    if (form.status === "unloaded" || form.status === "received") {
      // Full arrival — auto-generate M&A + lumper records
      store.addContainer({
        ...form,
        billableCuft,
        drayageSource: form.drayageSource,
        lumperStatus: "due",
        maDrayageStatus: form.drayageSource === "m&a" ? "due" : "pending",
      });
      toast.success(`Container ${form.containerNumber} added as ${form.status}. M&A drayage and lumper payables auto-generated.`);
    } else {
      // Pending/in-transit — just the basic record
      store.addContainer({
        ...form,
        billableCuft,
        lumperStatus: "pending",
        maDrayageStatus: "pending",
      });
      toast.success(`Container ${form.containerNumber} added as ${form.status}. Billing will generate when marked as arrived.`);
    }

    navigate(`/container/${form.containerNumber}`);
  };

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
          <div className="flex items-center gap-3 mt-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Add New Container</h1>
              <p className="text-sm text-muted-foreground">Enter container details — billing auto-calculates</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Container Info */}
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4" /> Container Info
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Container # *</Label>
                    <Input value={form.containerNumber} onChange={e => set("containerNumber", e.target.value.toUpperCase())} placeholder="MRKU3725416" className="font-mono h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">PO #</Label>
                    <Input value={form.po} onChange={e => set("po", e.target.value)} placeholder="5064" className="font-mono h-9" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Status</Label>
                    <select value={form.status} onChange={e => set("status", e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="pending">Pending</option>
                      <option value="in_transit">In Transit</option>
                      <option value="received">Received</option>
                      <option value="unloaded">Unloaded</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Period</Label>
                    <Input value={form.period} onChange={e => set("period", e.target.value)} placeholder="Feb Wk3" className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">SSL</Label>
                    <Input value={form.ssl} onChange={e => set("ssl", e.target.value)} placeholder="MAE" className="h-9" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">ETA (for pending)</Label>
                    <Input type="date" value={form.eta} onChange={e => set("eta", e.target.value)} className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Arrival Date</Label>
                    <Input type="date" value={form.arrivalDate} onChange={e => set("arrivalDate", e.target.value)} className="h-9" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cargo */}
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calculator className="w-4 h-4" /> Cargo Details
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Cartons</Label>
                    <Input type="number" value={form.cartons || ""} onChange={e => set("cartons", parseInt(e.target.value) || 0)} placeholder="0" className="font-mono h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Inbound CuFt</Label>
                    <Input type="number" step="0.01" value={form.inbCuft || ""} onChange={e => set("inbCuft", parseFloat(e.target.value) || 0)} placeholder="0" className="font-mono h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Pallets</Label>
                    <Input type="number" value={form.pallets || ""} onChange={e => set("pallets", parseInt(e.target.value) || 0)} placeholder="0" className="font-mono h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">SKU Count</Label>
                    <Input type="number" value={form.skuCount || ""} onChange={e => set("skuCount", parseInt(e.target.value) || 0)} placeholder="0" className="font-mono h-9" />
                  </div>
                </div>
                {form.cartons > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Billable CuFt: <span className="font-mono font-medium">{Math.max(form.inbCuft, form.cartons * RATES.minCuftPerCase).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    {form.inbCuft < form.cartons * RATES.minCuftPerCase && <span className="text-amber-600 ml-1">(min 1.3 cuft/carton applied)</span>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Drayage */}
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Drayage & Chassis
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Drayage Source</Label>
                    <select value={form.drayageSource} onChange={e => set("drayageSource", e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="m&a">M&A Transport</option>
                      <option value="summerville">Summerville</option>
                      <option value="other">Other</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Pull Date</Label>
                    <Input type="date" value={form.pullDate} onChange={e => { set("pullDate", e.target.value); calcChassisDays(e.target.value, form.returnDate); }} className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Return Date</Label>
                    <Input type="date" value={form.returnDate} onChange={e => { set("returnDate", e.target.value); calcChassisDays(form.pullDate, e.target.value); }} className="h-9" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Chassis Days</Label>
                  <Input type="number" value={form.chassisDays || ""} onChange={e => set("chassisDays", parseInt(e.target.value) || 0)} placeholder="Auto-calculated from dates" className="font-mono h-9 max-w-[200px]" />
                </div>
              </CardContent>
            </Card>

            {/* Lumper */}
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <HardHat className="w-4 h-4" /> Lumper / Unload
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Vendor</Label>
                    <select value={form.lumperVendor} onChange={e => {
                      set("lumperVendor", e.target.value);
                      if (e.target.value === "Fernando Palma") set("lumperRate", RATES.unloadFernando);
                      else if (e.target.value === "Freddie") set("lumperRate", RATES.unloadFreddie);
                    }} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="Fernando Palma">Fernando Palma</option>
                      <option value="Freddie">Freddie</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Rate ($/container)</Label>
                    <Input type="number" value={form.lumperRate || ""} onChange={e => set("lumperRate", parseFloat(e.target.value) || 0)} className="font-mono h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Date Unloaded</Label>
                    <Input type="date" value={form.dateUnloaded} onChange={e => set("dateUnloaded", e.target.value)} className="h-9" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="p-4">
                <Label className="text-xs">Notes</Label>
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" placeholder="Optional notes..." />
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3">
              <Button onClick={handleSubmit} className="px-6">
                <Package className="w-4 h-4 mr-2" />
                {form.status === "unloaded" || form.status === "received" ? "Create & Generate Billing" : "Create Container"}
              </Button>
              <Link href="/">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </div>

          {/* Right: Live Billing Preview */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Live Billing Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
                {/* Revenue */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">Revenue</div>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">IB Handling</span><span className="font-mono">{fmt(preview.handlingRevenue || 0)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Storage</span><span className="font-mono">{fmt(preview.storageRevenue || 0)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Drayage</span><span className="font-mono">{fmt(preview.drayageRevenue || 0)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Chassis</span><span className="font-mono">{fmt(preview.chassisRevenue || 0)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Shrink Wrap</span><span className="font-mono">{fmt(preview.shrinkWrapRevenue || 0)}</span></div>
                    <div className="flex justify-between border-t pt-1 font-semibold"><span>Total Revenue</span><span className="font-mono text-emerald-700">{fmt(preview.totalRevenue || 0)}</span></div>
                  </div>
                </div>

                {/* Costs */}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-red-700 mb-1">Costs</div>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">M&A Drayage</span><span className="font-mono">{fmt(preview.maDrayageCost || 0)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">M&A Chassis</span><span className="font-mono">{fmt(preview.maChassisCost || 0)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Lumper</span><span className="font-mono">{fmt(preview.lumperCost || 0)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Pallets</span><span className="font-mono">{fmt(preview.palletCost || 0)}</span></div>
                    <div className="flex justify-between border-t pt-1 font-semibold"><span>Total Cost</span><span className="font-mono text-red-600">{fmt(preview.totalCost || 0)}</span></div>
                  </div>
                </div>

                {/* Margin */}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-base">
                    <span>Gross Margin</span>
                    <span className={`font-mono ${(preview.grossMargin || 0) >= 0 ? "text-blue-700" : "text-red-700"}`}>
                      {fmt(preview.grossMargin || 0)}
                    </span>
                  </div>
                </div>

                {(form.status === "unloaded" || form.status === "received") && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-xs text-amber-800">
                    <strong>Auto-generates:</strong> M&A drayage payable ({fmt(preview.maDrayageCost || 0)}) + lumper payable ({fmt(preview.lumperCost || 0)}) when saved
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
