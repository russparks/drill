import { Link, useLocation } from "wouter";
import { BarChart3, List, Plus, Building, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  onCreateAction: () => void;
}

export default function MobileNav({ onCreateAction }: MobileNavProps) {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 material-shadow pb-safe">
      <div className="flex justify-around py-2">
        <Link href="/">
          <span className={`flex flex-col items-center p-2 cursor-pointer ${
            location === "/" ? "text-primary" : "text-action-text-secondary"
          }`}>
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs mt-1">Dashboard</span>
          </span>
        </Link>
        
        <Link href="/actions">
          <span className={`flex flex-col items-center p-2 cursor-pointer ${
            location === "/actions" ? "text-primary" : "text-action-text-secondary"
          }`}>
            <List className="h-5 w-5" />
            <span className="text-xs mt-1">Actions</span>
          </span>
        </Link>
        
        <Button
          onClick={onCreateAction}
          className="flex flex-col items-center p-2 text-white bg-primary rounded-full mx-2 -mt-6 material-shadow h-12 w-12"
          size="icon"
        >
          <Plus className="h-5 w-5" />
        </Button>
        
        <button className="flex flex-col items-center p-2 text-action-text-secondary">
          <Building className="h-5 w-5" />
          <span className="text-xs mt-1">Projects</span>
        </button>
        
        <button className="flex flex-col items-center p-2 text-action-text-secondary">
          <BarChart className="h-5 w-5" />
          <span className="text-xs mt-1">Reports</span>
        </button>
      </div>
    </nav>
  );
}
