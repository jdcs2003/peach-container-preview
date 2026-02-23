import Layout from "@/components/Layout";
import { store } from "@/data/store";
import { Link } from "wouter";
import { useState, useCallback } from "react";
import { Upload, ArrowLeft, CheckCircle2, AlertTriangle, MinusCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ParsedRow {
  container: string;
  status: string;
  arrival: string;
  po: string;
  cartons: number;
  skuCount: number;
  notes: string;
}

interface DiffItem {
  container: string;
  field: string;
  old: string;
  new_: string;
}

type ImportState = "idle" | "preview" | "done";

export default function ExtensivImport() {
  const [state, setState] = useState<ImportState>("idle");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [added, setAdded] = useState<string[]>([]);
  const [changed, setChanged] = useState<DiffItem[][]>([]);
  const [unchanged, setUnchanged] = useState<string[]>([]);
  const [resolvedChanges, setResolvedChanges] = useState<Record<string, "keep" | "use">>({});

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(ws);

        // Parse Extensiv format
        const rows: ParsedRow[] = [];
        for (const row of json) {
          // Reference Number format: "MRSU6846097-CANCELED-1117" or "MRSU6846097"
          const refNum = String(row["Reference Number"] || row["ReferenceNumber"] || row["Container"] || "");
          if (!refNum) continue;

          // Extract container number (first 11 chars: 4 letters + 7 digits) from Reference Number
          const ctnrMatch = refNum.match(/([A-Z]{4}\d{7})/g);
          if (!ctnrMatch || ctnrMatch.length === 0) continue;
          
          // Status mapping: 1=Received, 2=Canceled, 3=In Transit
          const statusRaw = String(row["Status"] || "");
          let status = "PENDING";
          if (statusRaw === "1" || statusRaw.toUpperCase().includes("RECEIV")) status = "RECEIVED";
          else if (statusRaw === "2" || statusRaw.toUpperCase().includes("CANCEL")) status = "CANCELED";
          else if (statusRaw === "3" || statusRaw.toUpperCase().includes("TRANSIT")) status = "IN TRANSIT";

          // Skip canceled containers
          if (status === "CANCELED") continue;

          const arrival = row["Arrival Date"] || "";
          const po = row["Purchase Order Number"] || row["PO"] || row["PO Number"] || "";
          const notes = row["Notes"] || row["Discrepancies"] || "";
          
          // Parse SKU column: "100322(0),100323(0),600039(0)" → count unique SKUs
          const skuRaw = String(row["SKU"] || "");
          const skuItems = skuRaw.split(",").filter(Boolean);
          const skuCount = skuItems.length;
          // Sum cartons from SKU quantities: "100322(240),100323(180)" → 420
          let cartons = 0;
          for (const item of skuItems) {
            const qtyMatch = item.match(/\((\d+)\)/);
            if (qtyMatch) cartons += parseInt(qtyMatch[1]) || 0;
          }

          for (const ctnr of ctnrMatch) {
            rows.push({ container: ctnr, status, arrival: String(arrival || ""), po: String(po || ""), cartons, skuCount, notes: String(notes || "") });
          }
        }

        if (rows.length === 0) {
          toast.error("No valid container data found in file");
          return;
        }

        // Deduplicate by container
        const unique = new Map<string, ParsedRow>();
        for (const r of rows) {
          if (!unique.has(r.container)) unique.set(r.container, r);
        }
        const deduped = Array.from(unique.values());

        setParsed(deduped);

        // Run comparison
        const result = store.importExtensiv(deduped);
        setAdded(result.added);
        setChanged(result.changed);
        setUnchanged(result.unchanged);
        setResolvedChanges({});
        setState("preview");

        toast.success(`Parsed ${deduped.length} containers from Extensiv export`);
      } catch (err) {
        toast.error("Failed to parse file: " + (err as Error).message);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleImport = () => {
    // Import new containers
    const newRows = parsed.filter((r) => added.includes(r.container));
    store.applyExtensivImport(newRows);

    // Apply resolved changes
    for (const diffs of changed) {
      const ctnr = diffs[0]?.container;
      if (!ctnr) continue;
      const resolution = resolvedChanges[ctnr];
      if (resolution === "use") {
        for (const d of diffs) {
          store.applyExtensivChange(d.container, d.field, d.new_);
        }
      }
      // "keep" = do nothing
    }

    setState("done");
    toast.success(`Imported ${added.length} new containers, applied ${Object.values(resolvedChanges).filter((v) => v === "use").length} updates`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <Link href="/"><span className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-1 cursor-pointer"><ArrowLeft className="w-3 h-3" /> Dashboard</span></Link>
          <h1 className="text-2xl font-bold tracking-tight">Extensiv Import</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Upload an Extensiv Receipts export to sync container data</p>
        </div>

        {state === "idle" && (
          <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Extensiv Export</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supports .xlsx files from Extensiv Receipts export. The system will compare against existing containers and show you what's new, changed, or unchanged.
            </p>
            <label className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:opacity-90 text-sm">
              Choose File
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
            </label>
          </div>
        )}

        {state === "preview" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-emerald-700">{added.length}</div>
                <div className="text-xs text-emerald-600 font-semibold uppercase">New — Will Import</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-700">{changed.length}</div>
                <div className="text-xs text-amber-600 font-semibold uppercase">Changed — Review</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-500">{unchanged.length}</div>
                <div className="text-xs text-slate-500 font-semibold uppercase">Unchanged — Skip</div>
              </div>
            </div>

            {/* New containers */}
            {added.length > 0 && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-3 border-b border-border bg-emerald-50">
                  <h3 className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> {added.length} New Containers (will be imported)
                  </h3>
                </div>
                <div className="p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {added.map((c) => (
                      <span key={c} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-mono">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Changed containers — one-by-one resolution */}
            {changed.length > 0 && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-3 border-b border-border bg-amber-50">
                  <h3 className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {changed.length} Containers with Different Info
                  </h3>
                  <p className="text-xs text-amber-600 mt-0.5">Choose to keep database values or use the Excel values for each container</p>
                </div>
                <div className="divide-y divide-border">
                  {changed.map((diffs, idx) => {
                    const ctnr = diffs[0]?.container || "";
                    const resolution = resolvedChanges[ctnr];
                    return (
                      <div key={idx} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-semibold text-sm">{ctnr}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setResolvedChanges((prev) => ({ ...prev, [ctnr]: "keep" }))}
                              className={`px-2 py-1 text-xs rounded border transition-colors ${
                                resolution === "keep" ? "bg-blue-100 border-blue-300 text-blue-700" : "border-border hover:bg-accent"
                              }`}
                            >
                              Keep Database
                            </button>
                            <button
                              onClick={() => setResolvedChanges((prev) => ({ ...prev, [ctnr]: "use" }))}
                              className={`px-2 py-1 text-xs rounded border transition-colors ${
                                resolution === "use" ? "bg-amber-100 border-amber-300 text-amber-700" : "border-border hover:bg-accent"
                              }`}
                            >
                              Use Excel
                            </button>
                          </div>
                        </div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground">
                              <th className="text-left py-1 font-medium">Field</th>
                              <th className="text-left py-1 font-medium">Database</th>
                              <th className="text-center py-1"><ArrowRight className="w-3 h-3 mx-auto" /></th>
                              <th className="text-left py-1 font-medium">Excel</th>
                            </tr>
                          </thead>
                          <tbody>
                            {diffs.map((d, di) => (
                              <tr key={di}>
                                <td className="py-0.5 font-medium capitalize">{d.field}</td>
                                <td className="py-0.5 font-mono text-muted-foreground">{d.old || "(empty)"}</td>
                                <td className="py-0.5 text-center"><ArrowRight className="w-3 h-3 mx-auto text-muted-foreground" /></td>
                                <td className="py-0.5 font-mono text-amber-700">{d.new_ || "(empty)"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Unchanged */}
            {unchanged.length > 0 && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-3 border-b border-border bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                    <MinusCircle className="w-4 h-4" /> {unchanged.length} Unchanged (will be skipped)
                  </h3>
                </div>
                <div className="p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {unchanged.map((c) => (
                      <span key={c} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-mono">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button onClick={handleImport} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm font-medium">
                Import {added.length} New + Apply Changes
              </button>
              <button onClick={() => setState("idle")} className="px-4 py-2 border border-border rounded-md hover:bg-accent text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        {state === "done" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-emerald-700">Import Complete</h3>
            <p className="text-sm text-emerald-600 mt-1">
              {added.length} new containers imported, {Object.values(resolvedChanges).filter((v) => v === "use").length} records updated
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <Link href="/"><button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Go to Dashboard</button></Link>
              <button onClick={() => { setState("idle"); setParsed([]); }} className="px-4 py-2 border border-border rounded-md text-sm hover:bg-accent">Import Another</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
