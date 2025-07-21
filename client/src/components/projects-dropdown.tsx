import { useQuery } from "@tanstack/react-query";
import { Building, ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Project } from "@shared/schema";

interface ProjectsDropdownProps {
  onProjectSelect?: (project: Project) => void;
  selectedProjectId?: number | null;
}

export default function ProjectsDropdown({ onProjectSelect, selectedProjectId }: ProjectsDropdownProps) {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const allProjects = projects as Project[];
  const selectedProject = selectedProjectId ? allProjects.find(p => p.id === selectedProjectId) : null;

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Building className="h-5 w-5 text-action-text-secondary" />
        <span className="text-sm text-action-text-secondary">Loading projects...</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline"
          size="sm"
          className={`flex items-center space-x-1 px-3 py-2 h-8 ${
            selectedProject ? 'bg-[#cc3333] text-white border-[#cc3333] hover:bg-[#cc3333]/90' : ''
          }`}
        >
          <span className="text-sm">Projects</span>
          <Filter className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {selectedProject && (
          <DropdownMenuItem
            onClick={() => onProjectSelect?.(selectedProject)}
            className="p-3 cursor-pointer border-b"
          >
            <div className="font-medium text-action-text-primary">
              Clear Filter - Show All Projects
            </div>
          </DropdownMenuItem>
        )}
        {allProjects.length === 0 ? (
          <div className="p-4 text-center text-action-text-secondary">
            No projects
          </div>
        ) : (
          allProjects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => onProjectSelect?.(project)}
              className={`p-3 cursor-pointer ${
                selectedProjectId === project.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="font-medium text-action-text-primary">
                {project.name}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}