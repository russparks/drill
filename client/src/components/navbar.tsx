import { Link, useLocation } from "wouter";
import { Plus, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavbarProps {
  onCreateAction?: () => void;
}

export default function Navbar({ onCreateAction }: NavbarProps) {
  const [location] = useLocation();

  return (
    <header className="bg-white material-shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-xl font-medium text-action-text-primary">Action Track</span>
            </div>
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <Link href="/">
                <span className={`px-3 py-2 text-sm font-medium cursor-pointer ${
                  location === "/" 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-action-text-secondary hover:text-action-text-primary"
                }`}>
                  Dashboard
                </span>
              </Link>
              <Link href="/actions">
                <span className={`px-3 py-2 text-sm font-medium cursor-pointer ${
                  location === "/actions" 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-action-text-secondary hover:text-action-text-primary"
                }`}>
                  Actions
                </span>
              </Link>
              <Link href="/manage">
                <span className={`px-3 py-2 text-sm font-medium cursor-pointer ${
                  location === "/manage" 
                    ? "text-primary border-b-2 border-primary" 
                    : "text-action-text-secondary hover:text-action-text-primary"
                }`}>
                  Manage
                </span>
              </Link>
            </nav>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Button size="sm" className="ml-4" onClick={onCreateAction}>
              <Plus className="h-4 w-4 mr-1" />
              Action
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8 bg-primary">
              <AvatarFallback className="text-white text-sm font-medium">
                JM
              </AvatarFallback>
            </Avatar>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}
