import { Link, useLocation } from "wouter";
import { Home, BarChart3, MapPin, Plus, Settings } from "lucide-react";
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
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </span>
        </Link>

        <Link href="/actions">
          <span className={`flex flex-col items-center p-2 cursor-pointer ${
            location === "/actions" ? "text-primary" : "text-action-text-secondary"
          }`}>
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs mt-1">Actions</span>
          </span>
        </Link>
        
        <Link href="/locations">
          <span className={`flex flex-col items-center p-2 cursor-pointer ${
            location === "/locations" ? "text-primary" : "text-action-text-secondary"
          }`}>
            <MapPin className="h-5 w-5" />
            <span className="text-xs mt-1">Locations</span>
          </span>
        </Link>
        
        <Button
          onClick={onCreateAction}
          className="flex flex-col items-center p-2 text-white bg-primary rounded-full mx-2 -mt-6 material-shadow h-12 w-12"
          size="icon"
        >
          <Plus className="h-5 w-5" />
        </Button>
        
        <Link href="/people">
          <span className={`flex flex-col items-center p-2 cursor-pointer ${
            location === "/people" ? "text-primary" : "text-action-text-secondary"
          }`}>
            <Settings className="h-5 w-5" />
            <span className="text-xs mt-1">People</span>
          </span>
        </Link>
      </div>
    </nav>
  );
}
