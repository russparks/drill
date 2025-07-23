import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, FileText, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Project, InsertProject } from "@shared/schema";
import ConfirmDialog from "@/components/confirm-dialog";

interface ProjectsProps {}

export default function Projects({}: ProjectsProps) {
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<"tender" | "precon" | "construction" | "aftercare">("tender");
  const [workingWeeks, setWorkingWeeks] = useState({ startToContract: 0, startToAnticipated: 0, anticipatedToContract: 0 });
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'project', id: number, name: string } | null>(null);
  const { toast } = useToast();

  // State for phase filters - all phases active by default
  const [activeFilters, setActiveFilters] = useState<string[]>(['tender', 'precon', 'construction', 'aftercare']);

  // Listen for modal open events from navbar
  useEffect(() => {
    const handleOpenProjectModal = () => {
      setSelectedProject(null);
      setSelectedPhase("tender");
      setIsProjectDialogOpen(true);
    };

    window.addEventListener('openProjectModal', handleOpenProjectModal);
    
    return () => {
      window.removeEventListener('openProjectModal', handleOpenProjectModal);
    };
  }, []);

  // Helper functions
  const formatValue = (value: string | undefined | null) => {
    if (!value) return '£0';
    const numValue = parseFloat(value.replace(/[£,]/g, ''));
    const isNegative = numValue < 0;
    const absValue = Math.abs(numValue);
    
    let formatted;
    if (absValue >= 1000000) {
      formatted = `£${isNegative ? '-' : ''}${(absValue / 1000000).toFixed(1)}m`;
    } else if (absValue >= 1000) {
      formatted = `£${isNegative ? '-' : ''}${(absValue / 1000).toFixed(1)}k`;
    } else {
      formatted = `£${isNegative ? '-' : ''}${absValue.toFixed(1)}`;
    }
    return formatted;
  };

  const isNegativeValue = (value: string | undefined | null) => {
    if (!value) return false;
    return parseFloat(value.replace(/[£,]/g, '')) < 0;
  };

  const isZeroOrNegativeValue = (value: string | undefined | null) => {
    if (!value) return true;
    return parseFloat(value.replace(/[£,]/g, '')) <= 0;
  };

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const createProjectMutation = useMutation({
    mutationFn: (project: InsertProject) => 
      apiRequest("POST", "/api/projects", project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsProjectDialogOpen(false);
      toast({ 
        title: "Project Created",
        className: "bg-[#b9f6b6] text-[#079800] border-[#079800] !p-2 !px-4 !pr-4 w-auto max-w-none min-w-fit text-center justify-center",
        duration: 5000,
      });
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, ...project }: Project) =>
      apiRequest("PATCH", `/api/projects/${id}`, project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsProjectDialogOpen(false);
      toast({
        title: "Project Updated",
        className: "bg-[#b9f6b6] text-[#079800] border-[#079800] !p-2 !px-4 !pr-4 w-auto max-w-none min-w-fit text-center justify-center",
        duration: 5000,
      });
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Deleted",
        className: "bg-[#fce8e8] text-[#d32f2f] border-[#d32f2f] !p-2 !px-4 !pr-4 w-auto max-w-none min-w-fit text-center justify-center",
        duration: 5000,
      });
    }
  });

  const handleProjectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const projectNumber = formData.get("projectNumber") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const value = formData.get("value") as string;
    const startDate = formData.get("startOnSiteDate") as string;
    const contractDate = formData.get("contractCompletionDate") as string;
    const constructionDate = formData.get("constructionCompletionDate") as string;

    // Validation logic
    if (!projectNumber.match(/^[A-Za-z]\d{4}$/)) {
      toast({ title: "Error", description: "Project number must be in format X0000 (e.g. A1234)", variant: "destructive" });
      return;
    }

    if (!value || isNaN(Number(value))) {
      toast({ title: "Error", description: "Value must be a number", variant: "destructive" });
      return;
    }

    const wordCount = description.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < 25) {
      toast({ title: "Error", description: `Description must be at least 25 words (currently ${wordCount})`, variant: "destructive" });
      return;
    }
    if (wordCount > 100) {
      toast({ title: "Error", description: `Description must be no more than 100 words (currently ${wordCount})`, variant: "destructive" });
      return;
    }

    if (startDate && contractDate && new Date(startDate) >= new Date(contractDate)) {
      toast({ title: "Error", description: "Start date must be before contract completion date", variant: "destructive" });
      return;
    }
    if (startDate && constructionDate && new Date(startDate) >= new Date(constructionDate)) {
      toast({ title: "Error", description: "Start date must be before construction completion date", variant: "destructive" });
      return;
    }

    const capitalizedName = name.replace(/\b\w/g, l => l.toUpperCase());
    const capitalizedDescription = description.charAt(0).toUpperCase() + description.slice(1);
    const retentionValue = Number(value) * 0.05;
    const formattedRetention = `£${retentionValue.toFixed(1)}`;

    const projectData = {
      projectNumber: projectNumber.toUpperCase(),
      name: capitalizedName,
      description: capitalizedDescription,
      status: selectedPhase,
      startOnSiteDate: startDate ? new Date(startDate) : null,
      contractCompletionDate: contractDate ? new Date(contractDate) : null,
      constructionCompletionDate: constructionDate ? new Date(constructionDate) : null,
      value: `£${value}`,
      retention: formattedRetention,
    };

    if (selectedProject) {
      updateProjectMutation.mutate({ ...selectedProject, ...projectData });
    } else {
      createProjectMutation.mutate(projectData);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
      {/* Phase Filter Buttons */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="flex items-center gap-2 relative">
          {['tender', 'precon', 'construction', 'aftercare'].map((phase) => {
            const isActive = activeFilters.includes(phase);
            const phaseProjects = projects.filter(p => p.status === phase);
            const phaseColors = {
              tender: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', circle: 'bg-blue-600' },
              precon: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', circle: 'bg-green-600' },
              construction: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', circle: 'bg-yellow-600' },
              aftercare: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', circle: 'bg-gray-600' }
            };
            const colors = phaseColors[phase as keyof typeof phaseColors];
            
            // Calculate total value for this phase
            const totalValue = phaseProjects.reduce((sum, project) => {
              let valueStr = project.value || '0';
              
              if (phase === 'aftercare' && project.retention) {
                valueStr = project.retention;
              }
              
              const cleanValue = valueStr.replace(/[£,\s]/g, '');
              const value = parseFloat(cleanValue) || 0;
              return sum + Math.abs(value);
            }, 0);
            
            const formatFilterValue = (value: number) => {
              if (value === 0) {
                return '£0.0k';
              }
              if (value >= 1000000) {
                return `£${(value / 1000000).toFixed(1)}m`;
              } else if (value >= 1000) {
                return `£${(value / 1000).toFixed(1)}k`;
              }
              return `£${value.toFixed(1)}`;
            };
            
            return (
              <div key={phase} className="relative">
                <div 
                  className={`absolute bg-white border border-gray-200 rounded-b-lg py-1 font-medium ${colors.text} z-0 text-center`}
                  style={{
                    top: '25px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60px',
                    fontSize: '0.625rem'
                  }}
                >
                  {formatFilterValue(totalValue)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveFilters(prev => 
                      isActive 
                        ? prev.filter(f => f !== phase)
                        : [...prev, phase]
                    );
                  }}
                  className={`text-xs px-2 py-0.5 transition-all duration-300 rounded-lg h-7 flex items-center gap-2 relative z-10 shadow-sm ${
                    isActive 
                      ? `${colors.bg} ${colors.text} ${colors.border} border-2` 
                      : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}
                >
                  <span>{phase.toUpperCase()}</span>
                  <div className={`w-5 h-5 rounded-full ${colors.circle} flex items-center justify-center`}>
                    <span className="text-xs font-bold text-white">{phaseProjects.length}</span>
                  </div>
                </Button>
              </div>
            );
          })}
        </div>
        <div className="relative">
          <Filter className="h-4 w-4 text-gray-400" />
          {activeFilters.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-0.5 bg-gray-400 rotate-45"></div>
            </div>
          )}
        </div>
      </div>

      {/* Projects Section */}
      <div className="space-y-6">
        <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedProject ? "Edit Project" : "Add New Project"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleProjectSubmit} className="space-y-3">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="projectNumber" className="text-xs">Number</Label>
                  <Input
                    id="projectNumber"
                    name="projectNumber"
                    placeholder="X0000"
                    className="h-7 px-1.5 py-1"
                    style={{ fontSize: '11px' }}
                    defaultValue={selectedProject?.projectNumber || ""}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="value" className="text-xs">Value</Label>
                  <Input
                    id="value"
                    name="value"
                    placeholder="23.5"
                    className="h-7 px-1.5 py-1"
                    style={{ fontSize: '11px' }}
                    defaultValue={selectedProject?.value?.replace('£', '') || ""}
                    required
                  />
                </div>
                <div className="col-span-8">
                  <Label htmlFor="name" className="text-xs">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    className="h-7 px-1.5 py-1"
                    style={{ fontSize: '11px' }}
                    defaultValue={selectedProject?.name}
                    required
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="description" className="text-xs">Description</Label>
                  <span className="text-xs text-gray-500" id="description-counter">0/25-100 words</span>
                </div>
                <textarea
                  id="description"
                  name="description"
                  className="w-full min-h-[68px] px-1.5 py-1 text-xs bg-white border border-gray-300 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-[#cc3333] focus:border-transparent"
                  defaultValue={selectedProject?.description || ""}
                  placeholder="Enter project description (minimum 25 words)..."
                  required
                />
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">Phase</Label>
                <div className="flex gap-2">
                  {['tender', 'precon', 'construction', 'aftercare'].map((phase) => (
                    <Button
                      key={phase}
                      type="button"
                      variant={selectedPhase === phase ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPhase(phase as any)}
                      className="text-xs h-7"
                    >
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => {
                  setIsProjectDialogOpen(false);
                  setSelectedPhase("tender");
                  setWorkingWeeks({ startToContract: 0, startToAnticipated: 0, anticipatedToContract: 0 });
                }}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-full">
                  {selectedProject ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid gap-2">
          {projectsLoading ? (
            <div>Loading projects...</div>
          ) : (
            projects
              .filter(project => {
                if (activeFilters.length === 0) return true;
                return activeFilters.includes(project.status);
              })
              .map((project: Project) => (
                <Card key={project.id} className="material-shadow">
                  <CardContent className="p-2.5 pb-8">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <CardTitle className="text-lg flex items-center">
                            <span className="font-normal text-sm" style={{
                              color: (() => {
                                switch (project.status) {
                                  case 'tender': return 'rgb(59, 130, 246)';
                                  case 'precon': return 'rgb(34, 197, 94)';
                                  case 'construction': return 'rgb(234, 179, 8)';
                                  case 'aftercare': return 'rgb(107, 114, 128)';
                                  default: return 'rgb(55, 65, 81)';
                                }
                              })()
                            }}>{project.projectNumber}</span>
                            <span className="font-light mx-1">—</span>
                            <span className="font-medium">{project.name}</span>
                          </CardTitle>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setSelectedProject(project);
                            setSelectedPhase(project.status || "tender");
                            setIsProjectDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setItemToDelete({ type: 'project', id: project.id, name: project.name });
                            setIsConfirmDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        onConfirm={() => {
          if (itemToDelete) {
            deleteProjectMutation.mutate(itemToDelete.id);
          }
          setItemToDelete(null);
          setIsConfirmDialogOpen(false);
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}