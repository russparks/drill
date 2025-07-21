import { Link, useLocation } from "wouter";
import { Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@assets/Layer 2_1753047717908.png";

interface NavbarProps {
  onCreateAction?: () => void;
}

export default function Navbar({ onCreateAction }: NavbarProps) {
  const [location] = useLocation();

  return (
    <header className="bg-white material-shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16" style={{paddingLeft: '15px'}}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img src={logo} alt="Drill Logo" className="h-8" />
            </div>
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <Link href="/">
                <span className={`px-3 py-2 text-sm font-medium cursor-pointer ${
                  location === "/" 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-action-text-secondary hover:text-action-text-primary"
                }`}>
                  Home
                </span>
              </Link>
              <Link href="/setup">
                <span className={`px-3 py-2 text-sm font-medium cursor-pointer ${
                  location === "/setup" 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-action-text-secondary hover:text-action-text-primary"
                }`}>
                  Setup
                </span>
              </Link>
            </nav>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Button size="sm" onClick={onCreateAction}>
              <Plus className="h-4 w-4 mr-1" />
              Project
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}
