import { Switch, Route } from "wouter";
import { useState, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/navbar";
import MobileNav from "@/components/mobile-nav";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Setup from "@/pages/setup";
import People from "@/pages/people";
import Locations from "@/pages/locations";
import Components from "@/pages/components";
import NotFound from "@/pages/not-found";
import ActionForm from "@/components/action-form";

const W0013 = lazy(() => import("@/pages/w0013"));

function Router() {
  const [isActionFormOpen, setIsActionFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [, navigate] = useLocation();

  const handleCreateProject = () => {
    navigate("/projects");
    setActiveTab("projects");
    // Trigger the project modal from the setup page
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openProjectModal'));
    }, 100);
  };

  const handleCreatePerson = () => {
    navigate("/people");
    // Trigger the person modal from the people page
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openPersonModal'));
    }, 100);
  };

  const handleCreateAction = () => {
    setIsActionFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-action-surface">
      <Navbar 
        onCreateAction={handleCreateAction}
        onCreateProject={handleCreateProject} 
        onCreatePerson={handleCreatePerson}
        activeTab={activeTab}
      />
      
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/actions" component={Dashboard} />
        <Route path="/projects">
          <Setup onTabChange={setActiveTab} />
        </Route>
        <Route path="/setup">
          <Setup onTabChange={setActiveTab} />
        </Route>
        <Route path="/people" component={People} />
        <Route path="/locations" component={Locations} />
        <Route path="/components" component={Components} />
        <Route path="/W0013">
          {() => (
            <Suspense fallback={<div>Loading...</div>}>
              <W0013 />
            </Suspense>
          )}
        </Route>
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
