import { Link, useLocation } from "wouter";
import { Plus, Menu, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@assets/drill logo_1753113360383.png";

interface NavbarProps {
  onCreateAction?: () => void;
  onCreateProject?: () => void;
  onCreatePerson?: () => void;
  activeTab?: string;
}

export default function Navbar({ onCreateAction, onCreateProject, onCreatePerson, activeTab }: NavbarProps) {
  const [location] = useLocation();

  // Determine which button to show based on current location and active tab
  const getCreateButton = () => {
    if (location === "/actions") {
      return (
        <Button size="sm" onClick={onCreateAction} style={{ backgroundColor: '#333333', borderColor: '#333333', borderRadius: '9999px' }}>
          <Plus className="h-4 w-4 mr-0.5" />
          Action
        </Button>
      );
    } else if (location === "/setup" || location === "/projects") {
      // Grey out the button when on the Dash tab (activeTab === "users")
      const isOnDashTab = activeTab === "users";
      return (
        <Button 
          size="sm" 
          onClick={isOnDashTab ? undefined : onCreateProject}
          disabled={isOnDashTab}
          style={{ 
            backgroundColor: isOnDashTab ? '#9ca3af' : '#333333', 
            borderColor: isOnDashTab ? '#9ca3af' : '#333333', 
            borderRadius: '9999px',
            cursor: isOnDashTab ? 'not-allowed' : 'pointer'
          }}
        >
          <Plus className="h-4 w-4 mr-0.5" />
          Project
        </Button>
      );
    } else if (location === "/people") {
      return (
        <Button size="sm" onClick={onCreatePerson} style={{ backgroundColor: '#333333', borderColor: '#333333', borderRadius: '9999px' }}>
          <Plus className="h-4 w-4 mr-0.5" />
          Person
        </Button>
      );
    }
    return null;
  };

  return (
    <header className="bg-white material-shadow sticky top-0 z-50 pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16" style={{paddingLeft: '15px'}}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img src={logo} alt="Drill Logo" className="h-8" />
            </div>
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <Link href="/actions">
                <span className={`px-3 py-2 text-sm font-medium cursor-pointer ${
                  location === "/actions" 
                    ? "border-b-2" 
                    : "text-action-text-secondary hover:text-action-text-primary"
                }`} style={location === "/actions" ? { color: '#333333', borderColor: '#333333' } : {}}>
                  Actions
                </span>
              </Link>
              <Link href="/projects">
                <span className={`px-3 py-2 text-sm font-medium cursor-pointer ${
                  location === "/projects" 
                    ? "border-b-2" 
                    : "text-action-text-secondary hover:text-action-text-primary"
                }`} style={location === "/projects" ? { color: '#333333', borderColor: '#333333' } : {}}>
                  Projects
                </span>
              </Link>

              <Link href="/locations">
                <span className={`px-3 py-2 text-sm font-medium cursor-pointer ${
                  location === "/locations" 
                    ? "border-b-2" 
                    : "text-action-text-secondary hover:text-action-text-primary"
                }`} style={location === "/locations" ? { color: '#333333', borderColor: '#333333' } : {}}>
                  Locations
                </span>
              </Link>
              <Link href="/components">
                <span className={`px-3 py-2 text-sm font-medium cursor-pointer ${
                  location === "/components" 
                    ? "border-b-2" 
                    : "text-action-text-secondary hover:text-action-text-primary"
                }`} style={location === "/components" ? { color: '#333333', borderColor: '#333333' } : {}}>
                  Components
                </span>
              </Link>
            </nav>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {getCreateButton()}
            <Link href="/people">
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}