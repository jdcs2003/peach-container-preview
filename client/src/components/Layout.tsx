import { Link, useLocation } from "wouter";
import {
  Package, Home, ChevronRight, Truck, HardHat,
  PlusCircle, FileText, DollarSign, Layers
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/container/new", label: "Add Container", icon: PlusCircle },
  { href: "/batch-invoice", label: "Batch Invoice", icon: Layers },
  { type: "divider" as const, label: "Payables" },
  { href: "/lumper-invoices", label: "Lumper Invoices", icon: HardHat },
  { href: "/drayage-invoices", label: "Drayage Invoices", icon: Truck },
  { type: "divider" as const, label: "Receivables" },
  { href: "/client-invoices", label: "Client Invoices", icon: DollarSign },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Package className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight">Peach Warehouse</div>
              <div className="text-[10px] text-sidebar-foreground/60">SC-144 · Diamond Home</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map((item, idx) => {
            if ("type" in item && item.type === "divider") {
              return (
                <div key={idx} className="pt-3 pb-1 px-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">{item.label}</div>
                </div>
              );
            }
            const navItem = item as { href: string; label: string; icon: any };
            const isActive = location === navItem.href ||
              (navItem.href !== "/" && navItem.href !== "/container/new" && location.startsWith(navItem.href));
            const Icon = navItem.icon;
            return (
              <Link key={navItem.href} href={navItem.href}>
                <div
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="text-[10px] text-sidebar-foreground/40 leading-relaxed">
            144 Old Elloree Rd<br />
            Orangeburg, SC 29115<br />
            <span className="text-sidebar-foreground/30">Preview Build · Feb 2026</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
