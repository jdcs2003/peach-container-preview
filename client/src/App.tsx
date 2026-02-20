import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import ContainerDetail from "./pages/ContainerDetail";
import LumperInvoices from "./pages/LumperInvoices";
import DrayageInvoices from "./pages/DrayageInvoices";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/container/:id" component={ContainerDetail} />
      <Route path="/lumper-invoices" component={LumperInvoices} />
      <Route path="/drayage-invoices" component={DrayageInvoices} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
