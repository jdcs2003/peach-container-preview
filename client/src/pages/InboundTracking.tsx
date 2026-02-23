import Layout from "@/components/Layout";
import { store, type Container } from "@/data/store";
import { useStore } from "@/hooks/useStore";
import { Link } from "wouter";
import { useState } from "react";
import { CheckCircle2, XCircle, Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    unloaded: "bg-emerald-100 text-emerald-700",
    billed: "bg-blue-100 text-blue-700",
    "in-transit": "bg-amber-100 text-amber-700",
    received: "bg-teal-100 text-teal-700",
    pending: "bg-slate-100 text-slate-600",
    projected: "bg-purple-100 text-purple-600",
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${map[status] || "bg-gray-100"}`}>{status}</span>;
}

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="mx-auto block">
      {value ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400 opacity-50" />
      )}
    </button>
  );
}

export default function InboundTracking() {
  const containers = useStore(() => store.getContainers());
  const [filter, setFilter] = useState<"all" | "pending" | "action">("all");

  const active = containers.filter((c) => c.status !== "canceled");
  const filtered = active.filter((c) => {
    if (filter === "pending") return c.status === "pending" || c.status === "in-transit" || c.status === "projected";
    if (filter === "action") return !c.inExtensiv || !c.plReceived || !c.doReceived;
    return true;
  });

  const handleToggle = (id: string, field: "inExtensiv" | "plReceived" | "doReceived") => {
    store.toggleTracking(id, field);
  };

  const exportDOTracker = () => {
    const data = store.exportDOTracker();
    const ws = XLSX.utils.json_to_sheet(data.map((r) => ({
      "Container #": r.container,
      "In Extensiv": r.inExtensiv,
      "PL Received": r.plReceived,
      "DO Received": r.doReceived,
      "ETA": r.eta,
      "Status": r.status,
      "Cartons": r.cartons,
      "PO": r.po,
      "Action Needed": r.actionNeeded,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DO Tracker");
    XLSX.writeFile(wb, `Diamond_Home_DO_Tracker_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("DO Tracker exported");
  };

  const needAction = active.filter((c) => !c.inExtensiv || !c.plReceived || !c.doReceived).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/"><span className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-1 cursor-pointer"><ArrowLeft className="w-3 h-3" /> Dashboard</span></Link>
            <h1 className="text-2xl font-bold tracking-tight">Inbound Tracking</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {active.length} containers · {needAction} need action
            </p>
          </div>
          <button onClick={exportDOTracker} className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export DO Tracker
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { key: "all", label: `All (${active.length})` },
            { key: "pending", label: `Pending/Transit (${active.filter((c) => c.status === "pending" || c.status === "in-transit" || c.status === "projected").length})` },
            { key: "action", label: `Needs Action (${needAction})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key as any)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                filter === t.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="text-left px-3 py-2 font-medium">Container</th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                  <th className="text-left px-3 py-2 font-medium">Period</th>
                  <th className="text-left px-3 py-2 font-medium">ETA</th>
                  <th className="text-center px-3 py-2 font-medium">In Extensiv</th>
                  <th className="text-center px-3 py-2 font-medium">PL Received</th>
                  <th className="text-center px-3 py-2 font-medium">DO Received</th>
                  <th className="text-right px-3 py-2 font-medium">Cartons</th>
                  <th className="text-left px-3 py-2 font-medium">PO</th>
                  <th className="text-left px-3 py-2 font-medium">Action Needed</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const actions: string[] = [];
                  if (!c.inExtensiv) actions.push("Add to Extensiv");
                  if (!c.plReceived) actions.push("Need PL");
                  if (!c.doReceived) actions.push("Need DO");
                  if (c.status === "pending" || c.status === "in-transit") actions.push("Awaiting arrival");
                  const actionText = actions.length > 0 ? actions.join(", ") : "Complete";
                  const isComplete = actions.length === 0;

                  return (
                    <tr key={c.id} className={`border-t border-border hover:bg-muted/30 ${isComplete ? "opacity-60" : ""}`}>
                      <td className="px-3 py-2">
                        <Link href={`/container/${c.container}`}>
                          <span className="text-primary font-mono font-medium hover:underline cursor-pointer">{c.container}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                      <td className="px-3 py-2 text-muted-foreground">{c.period}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.eta || "TBD"}</td>
                      <td className="px-3 py-2 text-center"><Toggle value={c.inExtensiv} onChange={() => handleToggle(c.container, "inExtensiv")} /></td>
                      <td className="px-3 py-2 text-center"><Toggle value={c.plReceived} onChange={() => handleToggle(c.container, "plReceived")} /></td>
                      <td className="px-3 py-2 text-center"><Toggle value={c.doReceived} onChange={() => handleToggle(c.container, "doReceived")} /></td>
                      <td className="px-3 py-2 text-right font-mono">{c.cartons > 0 ? c.cartons.toLocaleString() : "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{c.po || "—"}</td>
                      <td className="px-3 py-2">
                        {isComplete ? (
                          <span className="text-emerald-600 text-[10px] font-semibold">COMPLETE</span>
                        ) : (
                          <span className="text-amber-600 text-[10px]">{actionText}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
