import { useQuery } from "@tanstack/react-query";
import { Building, ChevronDown } from "lucide-react";
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
}

export default function ProjectsDropdown({ onProjectSelect }: ProjectsDropdownProps) {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const activeProjects = (projects as Project[]).filter(p => p.status === 'active');

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
        <Button variant="outline" className="flex items-center space-x-2">
          <Building className="h-4 w-4" />
          <span>Active Projects</span>
          <Badge variant="secondary" className="ml-2">{activeProjects.length}</Badge>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {activeProjects.length === 0 ? (
          <div className="p-4 text-center text-action-text-secondary">
            No active projects
          </div>
        ) : (
          activeProjects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => onProjectSelect?.(project)}
              className="flex flex-col items-start p-4 cursor-pointer"
            >
              <div className="font-medium text-action-text-primary mb-1">
                {project.name}
              </div>
              {project.description && (
                <div className="text-xs text-action-text-secondary line-clamp-2">
                  {project.description}
                </div>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}