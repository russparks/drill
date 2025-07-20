import { Switch, Route } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/navbar";
import MobileNav from "@/components/mobile-nav";
import Dashboard from "@/pages/dashboard";
import Setup from "@/pages/setup";
import NotFound from "@/pages/not-found";
import ActionForm from "@/components/action-form";

function Router() {
  const [isActionFormOpen, setIsActionFormOpen] = useState(false);

  return (
    <div className="min-h-screen bg-action-surface">
      <Navbar onCreateAction={() => setIsActionFormOpen(true)} />
      
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/setup" component={Setup} />
        <Route component={NotFound} />
      </Switch>

      <MobileNav onCreateAction={() => setIsActionFormOpen(true)} />
      
      <ActionForm 
        isOpen={isActionFormOpen} 
        onClose={() => setIsActionFormOpen(false)} 
        action={null}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
