import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, FileText, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Project, InsertProject } from "@shared/schema";
import ConfirmDialog from "@/components/confirm-dialog";
import DetailCharts from "@/components/detail-charts";

interface SetupProps {
  onTabChange?: (tab: string) => void;
}

export default function Setup({ onTabChange }: SetupProps) {
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<"tender" | "precon" | "construction" | "aftercare">("tender");
  const [workingWeeks, setWorkingWeeks] = useState({ startToContract: 0, startToAnticipated: 0, anticipatedToContract: 0 });
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'project', id: number, name: string } | null>(null);
  const { toast } = useToast();

  // State for active tab
  const [activeTab, setActiveTab] = useState("projects");
  
  // State for phase filters - all phases active by default
  const [activeFilters, setActiveFilters] = useState<string[]>(['tender', 'precon', 'construction', 'aftercare']);

  // Listen for modal open events from navbar
  useEffect(() => {
    const handleOpenProjectModal = () => {
      setSelectedProject(null);
      setSelectedPhase("tender");
      setIsProjectDialogOpen(true);
    };



    const handleSwitchToUsersTab = () => {
      setActiveTab("users");
      onTabChange?.("users");
    };

    window.addEventListener('openProjectModal', handleOpenProjectModal);

    window.addEventListener('switchToUsersTab', handleSwitchToUsersTab);
    
    return () => {
      window.removeEventListener('openProjectModal', handleOpenProjectModal);

      window.removeEventListener('switchToUsersTab', handleSwitchToUsersTab);
    };
  }, [onTabChange]);

  const calculateWorkingWeeks = () => {
    setTimeout(() => {
      const startDate = (document.getElementById('startOnSiteDate') as HTMLInputElement)?.value;
      const contractDate = (document.getElementById('contractCompletionDate') as HTMLInputElement)?.value;
      const constructionDate = (document.getElementById('constructionCompletionDate') as HTMLInputElement)?.value;

      if (startDate && contractDate && constructionDate) {
        const start = new Date(startDate);
        const contract = new Date(contractDate);
        const construction = new Date(constructionDate);

        const startToContract = Math.ceil((contract.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const startToAnticipated = Math.ceil((construction.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const anticipatedToContract = Math.ceil((contract.getTime() - construction.getTime()) / (1000 * 60 * 60 * 24 * 7));

        setWorkingWeeks({
          startToContract: Math.max(0, startToContract),
          startToAnticipated: Math.max(0, startToAnticipated),
          anticipatedToContract: Math.max(0, anticipatedToContract)
        });
      }
    }, 0);
  };

  // Helper function to format values with k/m suffixes
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

  // Helper function to determine if value is negative
  const isNegativeValue = (value: string | undefined | null) => {
    if (!value) return false;
    return parseFloat(value.replace(/[£,]/g, '')) < 0;
  };

  // Helper function to determine if value is zero or negative
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
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, ...project }: Project) => 
      apiRequest("PATCH", `/api/projects/${id}`, project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsProjectDialogOpen(false);
      setSelectedProject(null);
      toast({ 
        title: "Project Updated",
        className: "bg-[#b9f6b6] text-[#079800] border-[#079800] !p-2 !px-4 !pr-4 w-auto max-w-none min-w-fit text-center justify-center",
        duration: 5000,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update project", variant: "destructive" });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ 
        title: "Project Deleted",
        className: "bg-[#b9f6b6] text-[#079800] border-[#079800] !p-2 !px-4 !pr-4 w-auto max-w-none min-w-fit text-center justify-center",
        duration: 5000,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    },
  });

  const handleProjectSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Validation
    const projectNumber = formData.get("projectNumber") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const value = formData.get("value") as string;
    const startDate = formData.get("startOnSiteDate") as string;
    const contractDate = formData.get("contractCompletionDate") as string;
    const constructionDate = formData.get("constructionCompletionDate") as string;

    // Validate project number format (X0000)
    if (!projectNumber.match(/^[A-Za-z]\d{4}$/)) {
      toast({ title: "Error", description: "Project number must be in format X0000 (e.g. A1234)", variant: "destructive" });
      return;
    }

    // Validate value is a number
    if (!value || isNaN(Number(value))) {
      toast({ title: "Error", description: "Value must be a number", variant: "destructive" });
      return;
    }

    // Validate description has 25-100 words
    const wordCount = description.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < 25) {
      toast({ title: "Error", description: `Description must be at least 25 words (currently ${wordCount})`, variant: "destructive" });
      return;
    }
    if (wordCount > 100) {
      toast({ title: "Error", description: `Description must be no more than 100 words (currently ${wordCount})`, variant: "destructive" });
      return;
    }

    // Validate date order
    if (startDate && contractDate && new Date(startDate) >= new Date(contractDate)) {
      toast({ title: "Error", description: "Start date must be before contract completion date", variant: "destructive" });
      return;
    }
    if (startDate && constructionDate && new Date(startDate) >= new Date(constructionDate)) {
      toast({ title: "Error", description: "Start date must be before construction completion date", variant: "destructive" });
      return;
    }

    // Capitalize first letter of each word in name
    const capitalizedName = name.replace(/\b\w/g, l => l.toUpperCase());
    
    // Capitalize first word of description
    const capitalizedDescription = description.charAt(0).toUpperCase() + description.slice(1);

    // Calculate retention as 5% of project value
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


      <Tabs value={activeTab} className="space-y-9" onValueChange={(value) => {
        setActiveTab(value);
        onTabChange?.(value);
      }}>
        <style>
          {`
            [role="tablist"] {
              display: none !important;
            }
          `}
        </style>
        <TabsList className="grid w-full bg-transparent" style={{ gridTemplateColumns: '20% 60% 20%' }}>
          <TabsTrigger value="projects" className="flex flex-col items-center gap-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-400 data-[state=active]:text-gray-700 group">
            <FileText className="h-6 w-6 text-gray-400 group-data-[state=active]:text-[#333333]" />
            <span className="text-base">Projects</span>
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center justify-center cursor-not-allowed text-xs !opacity-100" disabled>
            <span className="text-base text-gray-400">Live</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex flex-col items-center gap-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-gray-400 data-[state=active]:text-gray-700 group">
            <Search className="h-6 w-6 text-gray-400 group-data-[state=active]:text-[#333333]" />
            <span className="text-base">Packages</span>
          </TabsTrigger>
        </TabsList>

        {/* Phase Filter Buttons - only show on projects tab */}
        {activeTab === "projects" && (
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 font-medium w-20 pl-4">Process:</div>
              <div className="border border-dotted border-gray-200 rounded px-3 py-2 flex flex-wrap items-center gap-3" style={{"borderWidth": "1px", "borderStyle": "dotted"}}>
                <button
                  onClick={() => {
                    setActiveFilters(prev => {
                      if (prev.includes("tender")) {
                        // Don't allow deselecting if it's the only active filter
                        if (prev.length === 1) return prev;
                        return prev.filter(f => f !== "tender");
                      } else {
                        return [...prev, "tender"];
                      }
                    });
                  }}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors border flex items-center gap-1 ${
                    activeFilters.includes("tender") 
                      ? "bg-blue-400 text-white border-blue-600" 
                      : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                  }`}
                >
                  TENDER
                  {activeFilters.includes("tender") && <span className="text-xs">×</span>}
                </button>
                <button
                  onClick={() => {
                    setActiveFilters(prev => {
                      if (prev.includes("precon")) {
                        // Don't allow deselecting if it's the only active filter
                        if (prev.length === 1) return prev;
                        return prev.filter(f => f !== "precon");
                      } else {
                        return [...prev, "precon"];
                      }
                    });
                  }}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors border flex items-center gap-1 ${
                    activeFilters.includes("precon") 
                      ? "bg-green-400 text-white border-green-600" 
                      : "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                  }`}
                >
                  PRECON
                  {activeFilters.includes("precon") && <span className="text-xs">×</span>}
                </button>
                <button
                  onClick={() => {
                    setActiveFilters(prev => {
                      if (prev.includes("construction")) {
                        // Don't allow deselecting if it's the only active filter
                        if (prev.length === 1) return prev;
                        return prev.filter(f => f !== "construction");
                      } else {
                        return [...prev, "construction"];
                      }
                    });
                  }}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors border flex items-center gap-1 ${
                    activeFilters.includes("construction") 
                      ? "bg-yellow-500 text-white border-yellow-700" 
                      : "bg-yellow-50 text-yellow-800 border-yellow-400 hover:bg-yellow-100"
                  }`}
                >
                  CONSTRUCTION
                  {activeFilters.includes("construction") && <span className="text-xs">×</span>}
                </button>
                <button
                  onClick={() => {
                    setActiveFilters(prev => {
                      if (prev.includes("aftercare")) {
                        // Don't allow deselecting if it's the only active filter
                        if (prev.length === 1) return prev;
                        return prev.filter(f => f !== "aftercare");
                      } else {
                        return [...prev, "aftercare"];
                      }
                    });
                  }}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors border flex items-center gap-1 ${
                    activeFilters.includes("aftercare") 
                      ? "bg-gray-500 text-white border-gray-700" 
                      : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  AFTERCARE
                  {activeFilters.includes("aftercare") && <span className="text-xs">×</span>}
                </button>
                
                {/* Live Total Value - unselectable */}
                <div className="ml-4 px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-200 font-medium cursor-default">
                  {(() => {
                    const filteredProjects = projects.filter(project => {
                      if (activeFilters.length === 0) return true;
                      return activeFilters.includes(project.status);
                    });
                    
                    const totalValue = filteredProjects.reduce((sum, project) => {
                      let valueStr = project.value || '0';
                      
                      // For aftercare phase, use retention value instead
                      if (project.status === 'aftercare' && project.retention) {
                        valueStr = project.retention;
                      }
                      
                      // Clean the value string and parse
                      const cleanValue = valueStr.replace(/[£,\s]/g, '');
                      const value = parseFloat(cleanValue) || 0;
                      // Use absolute value to handle negative tender values
                      return sum + Math.abs(value);
                    }, 0);
                    
                    // Format value
                    if (totalValue === 0) {
                      return '£0.0k TOTAL';
                    }
                    if (totalValue >= 1000000) {
                      return `£${(totalValue / 1000000).toFixed(1)}m TOTAL`;
                    } else if (totalValue >= 1000) {
                      return `£${(totalValue / 1000).toFixed(1)}k TOTAL`;
                    }
                    return `£${totalValue.toFixed(1)} TOTAL`;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        <TabsContent value="projects" className="space-y-6" style={{ marginTop: '40px' }}>
          <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{selectedProject ? "Edit Project" : "Add New Project"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleProjectSubmit} className="space-y-3">
                  {/* Row 1: Project Number (15%) | Value (15%) | Project Name (70%) */}
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
                  
                  {/* Row 2: Project Description (100%) - multiline */}
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
                      onChange={(e) => {
                        const wordCount = e.target.value.trim().split(/\s+/).filter(word => word.length > 0).length;
                        const counter = document.getElementById('description-counter');
                        if (counter) {
                          counter.textContent = `${wordCount}/25-100 words`;
                          if (wordCount < 25) {
                            counter.className = "text-xs text-red-500";
                          } else if (wordCount > 100) {
                            counter.className = "text-xs text-red-500";
                          } else {
                            counter.className = "text-xs text-green-600";
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Row 3: Process buttons (100%) - styled exactly like action form */}
                  <div>
                    <div className="flex justify-between gap-2">
                      {[
                        { value: "tender", label: "TENDER", activeColor: "bg-blue-500 border-blue-600 text-white", inactiveColor: "bg-blue-50 border-blue-200 text-blue-700" },
                        { value: "precon", label: "PRECON", activeColor: "bg-green-500 border-green-600 text-white", inactiveColor: "bg-green-50 border-green-200 text-green-700" },
                        { value: "construction", label: "CONSTRUCTION", activeColor: "bg-yellow-500 border-yellow-600 text-white", inactiveColor: "bg-yellow-50 border-yellow-200 text-yellow-700" },
                        { value: "aftercare", label: "AFTERCARE", activeColor: "bg-gray-500 border-gray-600 text-white", inactiveColor: "bg-gray-50 border-gray-200 text-gray-700" }
                      ].map((phase) => (
                        <button
                          key={phase.value}
                          type="button"
                          onClick={() => setSelectedPhase(phase.value as "tender" | "precon" | "construction" | "aftercare")}
                          className={`flex-1 px-3 py-1.5 text-xs font-medium uppercase rounded-full border transition-colors ${
                            selectedPhase === phase.value
                              ? phase.activeColor
                              : phase.inactiveColor
                          }`}
                        >
                          {phase.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <hr className="border-gray-200 mt-3" />

                  {/* Row 4: Start Date (33%) | Contract PC (33%) | Anticipated PC (33%) */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="startOnSiteDate" className="text-xs text-center block mb-1.5">Start Date</Label>
                      <Input
                        id="startOnSiteDate"
                        name="startOnSiteDate"
                        type="date"
                        className="h-6 w-full"
                        style={{ fontSize: '10px', textAlign: 'right', paddingRight: '8px' }}
                        defaultValue={selectedProject?.startOnSiteDate ? new Date(selectedProject.startOnSiteDate).toISOString().split('T')[0] : ""}
                        onChange={(e) => calculateWorkingWeeks()}
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="contractCompletionDate" className="text-xs text-center block mb-1.5">Contract PC</Label>
                      <Input
                        id="contractCompletionDate"
                        name="contractCompletionDate"
                        type="date"
                        className="h-6 w-full"
                        style={{ fontSize: '10px', textAlign: 'right', paddingRight: '8px' }}
                        defaultValue={selectedProject?.contractCompletionDate ? new Date(selectedProject.contractCompletionDate).toISOString().split('T')[0] : ""}
                        onChange={(e) => calculateWorkingWeeks()}
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="constructionCompletionDate" className="text-xs text-center block mb-1.5">Anticipated PC</Label>
                      <Input
                        id="constructionCompletionDate"
                        name="constructionCompletionDate"
                        type="date"
                        className="h-6 w-full"
                        style={{ fontSize: '10px', textAlign: 'right', paddingRight: '8px' }}
                        defaultValue={selectedProject?.constructionCompletionDate ? new Date(selectedProject.constructionCompletionDate).toISOString().split('T')[0] : ""}
                        onChange={(e) => calculateWorkingWeeks()}
                        required
                      />
                    </div>
                  </div>

                  <hr className="border-gray-200 mt-3 mb-4" />
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-1" style={{ fontSize: '10px' }}>
                      {workingWeeks.startToContract > 0 && (
                        <>
                          <div className="w-6 h-6 text-gray-400 flex items-center justify-center text-xs">ℹ️</div>
                          <div className="leading-tight font-mono">
                            <div className="flex">
                              <div className="w-8 text-center text-black">{workingWeeks.startToContract}w</div>
                              <div className="flex-1 text-gray-500 italic ml-2">Start → Contract</div>
                            </div>
                            <div className="flex">
                              <div className="w-8 text-center text-black">{workingWeeks.startToAnticipated}w</div>
                              <div className="flex-1 text-gray-500 italic ml-2">Start → Anticipated</div>
                            </div>
                            <div className="flex">
                              <div className="w-8 text-center text-black">{workingWeeks.anticipatedToContract}w</div>
                              <div className={`flex-1 italic ml-2 ${workingWeeks.anticipatedToContract < (workingWeeks.startToContract * 0.1) ? 'text-amber-500' : 'text-gray-500'}`}>Float / Buffer</div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex space-x-2">
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
                  // If no filters are active, show all projects
                  if (activeFilters.length === 0) return true;
                  // Otherwise, only show projects that match at least one active filter
                  return activeFilters.includes(project.status);
                })
                .sort((a, b) => {
                  // Helper function to determine if a project is completed
                  const isProjectCompleted = (project: Project) => {
                    if (!project.startOnSiteDate || !project.contractCompletionDate) return false;
                    
                    const contractDate = new Date(project.contractCompletionDate);
                    const currentDate = new Date();
                    
                    const hasPreconEnded = project.status === 'precon' && currentDate > contractDate;
                    const hasTenderEnded = project.status === 'tender' && currentDate > contractDate;
                    const hasConstructionEnded = project.status === 'construction' && currentDate > contractDate;
                    const isAftercare = project.status === 'aftercare';
                    
                    return hasPreconEnded || hasTenderEnded || hasConstructionEnded || isAftercare;
                  };
                  
                  const aCompleted = isProjectCompleted(a);
                  const bCompleted = isProjectCompleted(b);
                  
                  // Move completed projects to bottom
                  if (aCompleted && !bCompleted) return 1;
                  if (!aCompleted && bCompleted) return -1;
                  
                  // For projects in the same completion state, use existing logic
                  // Define status order priority: tender, precon, construction, aftercare
                  const statusOrder = { tender: 1, precon: 2, construction: 3, aftercare: 4 };
                  const aOrder = statusOrder[a.status as keyof typeof statusOrder] || 5;
                  const bOrder = statusOrder[b.status as keyof typeof statusOrder] || 5;
                  
                  // First sort by status
                  if (aOrder !== bOrder) {
                    return aOrder - bOrder;
                  }
                  
                  // Then sort by completion date within same status
                  // Use contract completion date, fallback to construction completion date
                  const aDate = a.contractCompletionDate || a.constructionCompletionDate;
                  const bDate = b.contractCompletionDate || b.constructionCompletionDate;
                  
                  // If no dates, maintain current order
                  if (!aDate && !bDate) return 0;
                  if (!aDate) return 1; // Projects without dates go to bottom
                  if (!bDate) return -1;
                  
                  // Sort by date ascending (earliest completion first, furthest away last)
                  return new Date(aDate).getTime() - new Date(bDate).getTime();
                })
                .map((project: Project) => {
                // Calculate current project week and totals
                const getCurrentWeekInfo = () => {
                  if (!project.startOnSiteDate || !project.constructionCompletionDate || !project.contractCompletionDate) {
                    return null;
                  }
                  
                  const startDate = new Date(project.startOnSiteDate);
                  const anticipatedDate = new Date(project.constructionCompletionDate);
                  const contractDate = new Date(project.contractCompletionDate);
                  const currentDate = new Date();
                  
                  // Check if project end dates have passed or project is completed
                  const hasPreconEnded = project.status === 'precon' && currentDate > contractDate;
                  const hasTenderEnded = project.status === 'tender' && currentDate > contractDate;
                  const hasConstructionEnded = project.status === 'construction' && currentDate > contractDate;
                  const isCompleted = project.status === 'aftercare';
                  const isFinished = hasPreconEnded || hasTenderEnded || hasConstructionEnded || isCompleted;
                  
                  // For aftercare projects, check if retention is positive
                  const hasPositiveRetention = project.status === 'aftercare' && !isZeroOrNegativeValue(project.retention);
                  const shouldGreyOutCompletely = isFinished && !hasPositiveRetention;
                  
                  const currentWeek = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                  const totalWeeksToAnticipated = Math.ceil((anticipatedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                  const totalWeeksToContract = Math.ceil((contractDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                  
                  return {
                    currentWeek: Math.max(1, currentWeek),
                    totalWeeksToAnticipated: Math.max(1, totalWeeksToAnticipated),
                    totalWeeksToContract: Math.max(1, totalWeeksToContract),
                    startDate: startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
                    anticipatedDate: anticipatedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
                    contractDate: contractDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
                    hideWeekIndicator: isFinished,
                    isGreyedOut: shouldGreyOutCompletely,
                    hasPositiveRetention: hasPositiveRetention
                  };
                };

                const weekInfo = getCurrentWeekInfo();
                
                return (
                  <div key={project.id} className={weekInfo?.isGreyedOut ? 'opacity-60' : ''}>
                    <Card className="material-shadow">
                  <CardContent className="p-2.5 pb-8">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className={`flex items-center gap-2 mb-0.5 ${weekInfo?.hasPositiveRetention ? 'opacity-60' : ''}`}>
                          <CardTitle className="text-lg flex items-center">
                            <span className="font-normal text-sm" style={{
                              color: (() => {
                                switch (project.status) {
                                  case 'tender': return 'rgb(59, 130, 246)'; // blue
                                  case 'precon': return 'rgb(34, 197, 94)'; // green
                                  case 'construction': return 'rgb(234, 179, 8)'; // yellow
                                  case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                                  default: return 'rgb(55, 65, 81)'; // default gray-700
                                }
                              })()
                            }}>{project.projectNumber}</span> <span className="font-light mx-1" style={{
                              color: (() => {
                                switch (project.status) {
                                  case 'tender': return 'rgb(59, 130, 246)'; // blue
                                  case 'precon': return 'rgb(34, 197, 94)'; // green
                                  case 'construction': return 'rgb(234, 179, 8)'; // yellow
                                  case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                                  default: return 'inherit';
                                }
                              })()
                            }}>|</span> <span style={{
                              color: (() => {
                                switch (project.status) {
                                  case 'tender': return 'rgb(59, 130, 246)'; // blue
                                  case 'precon': return 'rgb(34, 197, 94)'; // green
                                  case 'construction': return 'rgb(234, 179, 8)'; // yellow
                                  case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                                  default: return 'inherit'; // default color
                                }
                              })()
                            }}>{project.name}{project.postcode && (
                              <span style={{ 
                                fontSize: '0.7em',
                                color: (() => {
                                  switch (project.status) {
                                    case 'tender': return 'rgb(59, 130, 246)'; // blue
                                    case 'precon': return 'rgb(34, 197, 94)'; // green
                                    case 'construction': return 'rgb(234, 179, 8)'; // yellow
                                    case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                                    default: return 'inherit';
                                  }
                                })(),
                                opacity: 0.8
                              }}>
                                {`, ${(() => {
                                  const postcodeToCity: { [key: string]: string } = {
                                    'SW1A 1AA': 'London',
                                    'M1 1AA': 'Manchester',
                                    'B1 1TT': 'Birmingham',
                                    'E1 6AN': 'London',
                                    'LS1 2TW': 'Leeds',
                                    'NE1 7RU': 'Newcastle',
                                    'CB2 1TN': 'Cambridge',
                                    'BS1 6XN': 'Bristol',
                                    'SE1 7TP': 'London',
                                    'CF10 3NP': 'Cardiff',
                                    'G1 2FF': 'Glasgow',
                                    'RG1 3EH': 'Reading',
                                    'NG1 5DT': 'Nottingham',
                                    'L1 8JQ': 'Liverpool'
                                  };
                                  return postcodeToCity[project.postcode] || 'UK';
                                })()}`}
                              </span>
                            )}</span>
                          </CardTitle>
                          {project.value && (
                            <span className="text-sm text-action-text-secondary">
                              (<span className={isZeroOrNegativeValue(project.value) ? 'text-red-400' : ''}>{formatValue(project.value)}</span>)
                            </span>
                          )}
                          {/* Process indicator */}
                          <div className="ml-auto">
                            <button
                              className={`
                                rounded-full px-2 py-0.5 text-xs font-medium border transition-colors
                                ${project.status === "tender" ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
                                ${project.status === "precon" ? "bg-green-100 text-green-800 border-green-200" : ""}
                                ${project.status === "construction" ? "bg-yellow-100 text-yellow-800 border-yellow-200" : ""}
                                ${project.status === "aftercare" ? "bg-gray-100 text-gray-800 border-gray-200" : ""}
                                ${!project.status ? "bg-gray-100 text-gray-800 border-gray-200" : ""}
                              `}
                            >
                              {project.status === "tender" && "TEN"}
                              {project.status === "precon" && "PRE"}
                              {project.status === "construction" && "CON"}
                              {project.status === "aftercare" && "AFT"}
                              {!project.status && "UNK"}
                            </button>
                          </div>
                        </div>
                        {weekInfo && (
                          <div className="flex items-center justify-between" style={{ fontSize: '10px' }}>
                            <div className="flex items-center" style={{ gap: '10px' }}>
                              {/* Indicators that get greyed out for projects with positive retention */}
                              <div className={weekInfo.hasPositiveRetention ? 'opacity-60' : ''}>
                                <div className="flex items-center gap-[10px]">
                                  <div className="flex items-center" title="Start on Site Date">
                                    <span className="border px-1 py-0.5 rounded-l-sm" style={{ 
                                      fontSize: '10px',
                                      color: project.status === 'construction' ? 'rgb(31, 41, 55)' : 'white', // mid grey font for construction
                                      backgroundColor: (() => {
                                        switch (project.status) {
                                          case 'tender': return 'rgb(147, 197, 253)'; // light blue
                                          case 'precon': return 'rgb(134, 239, 172)'; // light green
                                          case 'construction': return 'rgb(254, 240, 138)'; // light yellow
                                          case 'aftercare': return 'rgb(209, 213, 219)'; // light grey
                                          default: return 'rgb(156, 163, 175)'; // default gray-400
                                        }
                                      })(),
                                      borderColor: (() => {
                                        switch (project.status) {
                                          case 'tender': return 'rgb(147, 197, 253)';
                                          case 'precon': return 'rgb(134, 239, 172)';
                                          case 'construction': return 'rgb(254, 240, 138)';
                                          case 'aftercare': return 'rgb(209, 213, 219)';
                                          default: return 'rgb(156, 163, 175)';
                                        }
                                      })()
                                    }}>SOS</span>
                                    <span className="bg-white text-black px-1 py-0.5 rounded-r-sm" style={{ 
                                      fontSize: '10px',
                                      borderTop: `1px solid ${(() => {
                                        switch (project.status) {
                                          case 'tender': return 'rgb(147, 197, 253)';
                                          case 'precon': return 'rgb(134, 239, 172)';
                                          case 'construction': return 'rgb(254, 240, 138)';
                                          case 'aftercare': return 'rgb(209, 213, 219)';
                                          default: return 'rgb(156, 163, 175)';
                                        }
                                      })()}`,
                                      borderRight: `1px solid ${(() => {
                                        switch (project.status) {
                                          case 'tender': return 'rgb(147, 197, 253)';
                                          case 'precon': return 'rgb(134, 239, 172)';
                                          case 'construction': return 'rgb(254, 240, 138)';
                                          case 'aftercare': return 'rgb(209, 213, 219)';
                                          default: return 'rgb(156, 163, 175)';
                                        }
                                      })()}`,
                                      borderBottom: `1px solid ${(() => {
                                        switch (project.status) {
                                          case 'tender': return 'rgb(147, 197, 253)';
                                          case 'precon': return 'rgb(134, 239, 172)';
                                          case 'construction': return 'rgb(254, 240, 138)';
                                          case 'aftercare': return 'rgb(209, 213, 219)';
                                          default: return 'rgb(156, 163, 175)';
                                        }
                                      })()}`
                                    }}>{weekInfo.startDate.toUpperCase()}</span>
                                  </div>
                                  {/* Hide CONSTR indicator for precon and tender projects */}
                                  {project.status !== 'precon' && project.status !== 'tender' && (
                                    <div className="flex items-center" title="Construction Practical Completion Date">
                                      <span className="text-white border px-1 py-0.5 rounded-l-sm" style={{ 
                                        fontSize: '10px',
                                        backgroundColor: (() => {
                                          switch (project.status) {
                                            case 'construction': return 'rgb(250, 204, 21)'; // middle yellow shade
                                            case 'aftercare': return 'rgb(156, 163, 175)'; // middle grey shade
                                            default: return 'rgb(147, 197, 253)'; // default blue-300
                                          }
                                        })(),
                                        borderColor: (() => {
                                          switch (project.status) {
                                            case 'construction': return 'rgb(250, 204, 21)';
                                            case 'aftercare': return 'rgb(156, 163, 175)';
                                            default: return 'rgb(147, 197, 253)';
                                          }
                                        })()
                                      }}>CONST</span>
                                      <span className="bg-white text-black px-1 py-0.5 rounded-r-sm" style={{ 
                                        fontSize: '10px',
                                        borderTop: `1px solid ${(() => {
                                          switch (project.status) {
                                            case 'construction': return 'rgb(250, 204, 21)';
                                            case 'aftercare': return 'rgb(156, 163, 175)';
                                            default: return 'rgb(147, 197, 253)';
                                          }
                                        })()}`,
                                        borderRight: `1px solid ${(() => {
                                          switch (project.status) {
                                            case 'construction': return 'rgb(250, 204, 21)';
                                            case 'aftercare': return 'rgb(156, 163, 175)';
                                            default: return 'rgb(147, 197, 253)';
                                          }
                                        })()}`,
                                        borderBottom: `1px solid ${(() => {
                                          switch (project.status) {
                                            case 'construction': return 'rgb(250, 204, 21)';
                                            case 'aftercare': return 'rgb(156, 163, 175)';
                                            default: return 'rgb(147, 197, 253)';
                                          }
                                        })()}`
                                      }}>{weekInfo.anticipatedDate.toUpperCase()}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center" title="Contract Practical Completion Date">
                                    <span className="text-white border px-1 py-0.5 rounded-l-sm" style={{ 
                                      fontSize: '10px',
                                      backgroundColor: (() => {
                                        switch (project.status) {
                                          case 'tender': return 'rgb(59, 130, 246)'; // dark blue
                                          case 'precon': return 'rgb(34, 197, 94)'; // dark green
                                          case 'construction': return 'rgb(234, 179, 8)'; // dark yellow
                                          case 'aftercare': return 'rgb(107, 114, 128)'; // dark grey
                                          default: return 'rgba(31, 41, 55, 0.7)'; // default dark gray
                                        }
                                      })(),
                                      borderColor: (() => {
                                        switch (project.status) {
                                          case 'tender': return 'rgb(59, 130, 246)';
                                          case 'precon': return 'rgb(34, 197, 94)';
                                          case 'construction': return 'rgb(234, 179, 8)';
                                          case 'aftercare': return 'rgb(107, 114, 128)';
                                          default: return 'rgb(107, 114, 128)';
                                        }
                                      })()
                                    }}>CONTR</span>
                                    <span className="bg-white text-black px-1 py-0.5 rounded-r-sm" style={{ 
                                      fontSize: '10px',
                                      borderTop: `1px solid ${(() => {
                                        switch (project.status) {
                                          case 'tender': return 'rgb(59, 130, 246)';
                                          case 'precon': return 'rgb(34, 197, 94)';
                                          case 'construction': return 'rgb(234, 179, 8)';
                                          case 'aftercare': return 'rgb(107, 114, 128)';
                                          default: return 'rgb(107, 114, 128)';
                                        }
                                      })()}`,
                                      borderRight: `1px solid ${(() => {
                                        switch (project.status) {
                                          case 'tender': return 'rgb(59, 130, 246)';
                                          case 'precon': return 'rgb(34, 197, 94)';
                                          case 'construction': return 'rgb(234, 179, 8)';
                                          case 'aftercare': return 'rgb(107, 114, 128)';
                                          default: return 'rgb(107, 114, 128)';
                                        }
                                      })()}`,
                                      borderBottom: `1px solid ${(() => {
                                        switch (project.status) {
                                          case 'tender': return 'rgb(59, 130, 246)';
                                          case 'precon': return 'rgb(34, 197, 94)';
                                          case 'construction': return 'rgb(234, 179, 8)';
                                          case 'aftercare': return 'rgb(107, 114, 128)';
                                          default: return 'rgb(107, 114, 128)';
                                        }
                                      })()}`
                                    }}>{weekInfo.contractDate.toUpperCase()}</span>
                                  </div>
                                  {/* EVA indicator for non-aftercare projects with non-zero values */}
                                  {project.status !== 'aftercare' && weekInfo && !weekInfo.hideWeekIndicator && !isZeroOrNegativeValue(project.value) && (
                                    <div className="flex items-center" title="Estimated Earned Value - calculated as (Project Value ÷ Total Weeks) × Weeks Completed">
                                      <span className="text-white border px-1 py-0.5 rounded-l-sm" style={{ 
                                        fontSize: '10px',
                                        backgroundColor: 'rgb(115, 115, 115)', // 55% black (45% opacity from black)
                                        borderColor: 'rgb(115, 115, 115)'
                                      }}>
                                        EEV
                                      </span>
                                      <span className="bg-white text-black border border-gray-300 px-1 py-0.5 rounded-r-sm" style={{ fontSize: '10px' }}>
                                        {(() => {
                                          const projectValueNum = parseFloat(project.value?.replace(/[£,]/g, '') || '0');
                                          const weeklyValue = projectValueNum / weekInfo.totalWeeksToContract;
                                          let evaValue = weeklyValue * weekInfo.currentWeek;
                                          
                                          // Cap EEV at project value for late projects
                                          const isLate = weekInfo.currentWeek > weekInfo.totalWeeksToContract;
                                          if (isLate) {
                                            evaValue = Math.min(evaValue, projectValueNum);
                                          }
                                          
                                          const percentComplete = Math.min((weekInfo.currentWeek / weekInfo.totalWeeksToContract) * 100, 100);
                                          return `${formatValue(`£${evaValue}`)} (${percentComplete.toFixed(0)}%)`;
                                        })()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Retention display for aftercare projects only - always full opacity */}
                              {project.status === 'aftercare' && (
                                <div className="flex items-center" title="Project Retention Value">
                                  <span className="text-white px-1 py-0.5 rounded-l-sm border" style={{ 
                                    fontSize: '10px',
                                    backgroundColor: isZeroOrNegativeValue(project.retention) ? 'rgb(4, 120, 87)' : 'rgb(248, 113, 113)', // emerald-700 : red-400
                                    borderColor: isZeroOrNegativeValue(project.retention) ? 'rgb(4, 120, 87)' : 'rgb(248, 113, 113)'
                                  }}>
                                    RET
                                  </span>
                                  <span className="bg-white text-black px-1 py-0.5 rounded-r-sm" style={{ 
                                    fontSize: '10px',
                                    borderTop: `1px solid ${isZeroOrNegativeValue(project.retention) ? 'rgb(4, 120, 87)' : 'rgb(248, 113, 113)'}`, // emerald-700 : red-400
                                    borderRight: `1px solid ${isZeroOrNegativeValue(project.retention) ? 'rgb(4, 120, 87)' : 'rgb(248, 113, 113)'}`,
                                    borderBottom: `1px solid ${isZeroOrNegativeValue(project.retention) ? 'rgb(4, 120, 87)' : 'rgb(248, 113, 113)'}`
                                  }}>
                                    {formatValue(project.retention)}
                                  </span>
                                </div>
                              )}
                            </div>

                          </div>
                        )}
                        {/* Add 8px vertical space below indicators */}
                        <div style={{ height: '8px' }}></div>
                      </div>
                      <div className={`flex space-x-1 ml-2 ${weekInfo?.hasPositiveRetention ? 'opacity-60' : ''}`}>
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
                    
                    {/* Timeline bar chart with completion percentage */}
                    {weekInfo && (
                          <div className={`mt-2 relative flex items-center ${weekInfo.hasPositiveRetention ? 'opacity-60' : ''}`}>
                            <div className={`h-1 rounded-sm overflow-hidden flex ${
                              project.status === 'aftercare' ? 'bg-gray-200' : 'bg-gray-100'
                            }`} style={{ width: '95%' }}>
                              {(() => {
                                const currentWeek = weekInfo.currentWeek;
                                const totalWeeksToAnticipated = weekInfo.totalWeeksToAnticipated;
                                const totalWeeksToContract = weekInfo.totalWeeksToContract;
                                
                                // If project is finished, grey out the entire timeline
                                if (weekInfo.isGreyedOut || weekInfo.hasPositiveRetention) {
                                  return (
                                    <div 
                                      className="bg-gray-400 h-full opacity-40" 
                                      style={{ width: '100%' }}
                                      title="Project finished"
                                    />
                                  );
                                }
                                
                                // Calculate percentages based on contract completion (total timeline)
                                const greyPercent = Math.min((currentWeek / totalWeeksToContract) * 100, 100);
                                const lightBluePercent = Math.max(0, Math.min(((totalWeeksToAnticipated - currentWeek) / totalWeeksToContract) * 100, 100 - greyPercent));
                                const amberPercent = Math.max(0, ((totalWeeksToContract - totalWeeksToAnticipated) / totalWeeksToContract) * 100);
                                
                                return (
                                  <>
                                    {greyPercent > 0 && (
                                      <div 
                                        className="bg-gray-400 h-full opacity-60" 
                                        style={{ width: `${greyPercent}%` }}
                                        title={`Elapsed: ${currentWeek} weeks`}
                                      />
                                    )}
                                    {lightBluePercent > 0 && (
                                      <div 
                                        className="h-full opacity-60" 
                                        style={{ 
                                          width: `${lightBluePercent}%`,
                                          backgroundColor: (() => {
                                            switch (project.status) {
                                              case 'tender': return 'rgb(59, 130, 246)'; // blue
                                              case 'precon': return 'rgb(34, 197, 94)'; // green
                                              case 'construction': return 'rgb(234, 179, 8)'; // yellow
                                              case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                                              default: return 'rgb(147, 197, 253)'; // default light blue
                                            }
                                          })()
                                        }}
                                        title={`Remaining to anticipated: ${Math.max(0, totalWeeksToAnticipated - currentWeek)} weeks`}
                                      />
                                    )}
                                    {amberPercent > 0 && (
                                      <div 
                                        className="bg-gray-800 h-full opacity-60" 
                                        style={{ width: `${amberPercent}%` }}
                                        title={`Buffer to contract: ${totalWeeksToContract - totalWeeksToAnticipated} weeks`}
                                      />
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            {/* Today marker and week indicator - hidden for finished projects */}
                            {weekInfo && !weekInfo.hideWeekIndicator && (() => {
                              const currentWeek = weekInfo.currentWeek;
                              const totalWeeksToContract = weekInfo.totalWeeksToContract;
                              const totalWeeksToAnticipated = weekInfo.totalWeeksToAnticipated;
                              // Calculate marker position - align with the visual timeline segments
                              const greyPercent = Math.min((currentWeek / totalWeeksToContract) * 100, 100);
                              // Scale the position to the 95% timeline width
                              const currentPercent = (greyPercent * 95) / 100;
                              
                              return (
                                <div className="absolute" style={{ left: `calc(${currentPercent}% - 2px)` }}>
                                  {/* Today marker extending through timeline */}
                                  <div 
                                    className="w-0.5 h-7 rounded-sm"
                                    style={{ 
                                      marginTop: '12px',
                                      backgroundColor: (() => {
                                        switch (project.status) {
                                          case 'tender': return 'rgb(59, 130, 246)'; // blue
                                          case 'precon': return 'rgb(34, 197, 94)'; // green
                                          case 'construction': return 'rgb(234, 179, 8)'; // yellow
                                          case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                                          default: return 'rgb(107, 114, 128)'; // default grey
                                        }
                                      })()
                                    }}
                                    title="Today"
                                  />
                                  {/* Week indicator positioned to the left and slightly under the timeline */}
                                  <div 
                                    className="absolute whitespace-nowrap text-gray-600"
                                    style={{ 
                                      fontSize: '10.2px', 
                                      top: '28px', 
                                      right: '4px',
                                      marginRight: '3px',
                                      lineHeight: '1',
                                      color: 'rgb(75, 85, 99)'
                                    }}
                                  >
                                    {(() => {
                                      // For precon and tender, CONSTR and CONTR are the same, so no need for brackets
                                      if (project.status === 'precon' || project.status === 'tender') {
                                        return `w${currentWeek} of ${totalWeeksToContract}`;
                                      }
                                      // For construction and aftercare, show both
                                      return `w${currentWeek} of ${totalWeeksToAnticipated} (${totalWeeksToContract})`;
                                    })()}
                                  </div>
                                </div>
                              );
                            })()}
                            {/* Completion percentage in the right gap */}
                            <div className="ml-2 text-xs font-bold" style={{ 
                              fontSize: '15px',
                              color: (() => {
                                switch (project.status) {
                                  case 'tender': return 'rgb(59, 130, 246)'; // blue
                                  case 'precon': return 'rgb(34, 197, 94)'; // green
                                  case 'construction': return 'rgb(234, 179, 8)'; // yellow
                                  case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                                  default: return 'rgb(107, 114, 128)';
                                }
                              })()
                            }}>
                              {(() => {
                                const currentWeek = weekInfo.currentWeek;
                                const totalWeeksToContract = weekInfo.totalWeeksToContract;
                                const percentComplete = Math.min((currentWeek / totalWeeksToContract) * 100, 100);
                                return `${Math.round(percentComplete)}%`;
                              })()}
                            </div>

                          </div>
                        )}
                    </CardContent>
                  </Card>
                  
                  {/* Remaining weeks display - tab behind project card */}
                  {weekInfo && (
                    <div className={`flex justify-end relative ${weekInfo.hasPositiveRetention ? 'opacity-60' : ''}`} style={{ marginTop: '-3px', marginRight: '25px' }}>
                      <div className="bg-white rounded-b-lg px-3 py-1.5 text-gray-600 inline-block italic flex justify-center" style={{ 
                        fontSize: '11.73px', 
                        zIndex: -1,
                        border: `1px solid ${(() => {
                          if (weekInfo.isGreyedOut || weekInfo.hasPositiveRetention) return 'rgba(204, 204, 204, 0.5)';
                          switch (project.status) {
                            case 'tender': return 'rgba(59, 130, 246, 0.5)'; // blue
                            case 'precon': return 'rgba(34, 197, 94, 0.5)'; // green
                            case 'construction': return 'rgba(249, 115, 22, 0.5)'; // orange
                            case 'aftercare': return 'rgba(168, 85, 247, 0.5)'; // purple
                            default: return 'rgba(107, 114, 128, 0.5)'; // gray
                          }
                        })()}`
                      }}>
                        {weekInfo.isGreyedOut || weekInfo.hasPositiveRetention ? (
                          <span className="text-gray-500 font-medium">Project Complete</span>
                        ) : (
                          <>
                            {project.status === 'tender' || project.status === 'precon' ? (
                              <>Weeks to Completion <span className="font-bold" style={{ 
                                marginLeft: '3px', 
                                marginRight: '3px',
                                color: project.status === 'tender' ? 'rgb(59, 130, 246)' : 'rgb(34, 197, 94)'
                              }}>{Math.max(0, weekInfo.totalWeeksToContract - weekInfo.currentWeek)}</span></>
                            ) : (
                              <>Weeks to Construction <span className="font-bold" style={{ 
                                marginLeft: '3px', 
                                marginRight: '3px',
                                color: project.status === 'construction' ? 'rgb(234, 179, 8)' : project.status === 'aftercare' ? 'rgb(107, 114, 128)' : 'rgb(59, 130, 246)'
                              }}>{Math.max(0, weekInfo.totalWeeksToAnticipated - weekInfo.currentWeek)}</span> Contract <span className="font-bold text-gray-800" style={{ marginLeft: '3px', marginRight: '3px' }}>{Math.max(0, weekInfo.totalWeeksToContract - weekInfo.currentWeek)}</span></>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
            )}
          </div>
        </TabsContent>

        <TabsContent value="live" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Real-time Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-600 text-sm">Live project status and action tracking</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-600 text-sm">Currently in-progress initiatives</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  Team Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-orange-600 text-sm">Live collaboration and notifications</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                Live Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Live monitoring capabilities will be implemented here</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Real-time project updates and notifications</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Team collaboration and status changes</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">System health and performance monitoring</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dash" className="space-y-6">
          {/* Project Value Overview Chart */}
          <Card className="material-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Project Value Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {projects?.filter(p => p.status === 'tender').length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Tender</div>
                  <div className="text-xs font-medium text-red-600">
                    -{formatValue(`£${Math.abs(projects?.filter(p => p.status === 'tender').reduce((sum, p) => {
                      const value = p.value?.replace(/[£,-]/g, '') || '0';
                      return sum + parseFloat(value);
                    }, 0) || 0)}`)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {projects?.filter(p => p.status === 'precon').length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Precon</div>
                  <div className="text-xs font-medium text-green-600">
                    {formatValue(`£${projects?.filter(p => p.status === 'precon').reduce((sum, p) => {
                      const value = p.value?.replace(/[£,]/g, '') || '0';
                      return sum + parseFloat(value);
                    }, 0) || 0}`)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {projects?.filter(p => p.status === 'construction').length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Construction</div>
                  <div className="text-xs font-medium text-yellow-600">
                    {formatValue(`£${projects?.filter(p => p.status === 'construction').reduce((sum, p) => {
                      const value = p.value?.replace(/[£,]/g, '') || '0';
                      return sum + parseFloat(value);
                    }, 0) || 0}`)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {projects?.filter(p => p.status === 'aftercare').length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Aftercare</div>
                  <div className="text-xs font-medium text-amber-600">
                    Retention: {formatValue(`£${projects?.filter(p => p.status === 'aftercare').reduce((sum, p) => {
                      const value = p.retention?.replace(/[£,-]/g, '') || '0';
                      return sum + parseFloat(value);
                    }, 0) || 0}`)}
                  </div>
                </div>
              </div>
              
              {/* Visual timeline chart */}
              <div className="space-y-3">
                <div className="text-sm font-medium">Project Timeline Overview</div>
                {projects?.filter(p => p.startOnSiteDate && p.contractCompletionDate).map(project => {
                  const startDate = new Date(project.startOnSiteDate!);
                  const endDate = new Date(project.contractCompletionDate!);
                  const currentDate = new Date();
                  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  const elapsedDays = Math.max(0, Math.min(Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)), totalDays));
                  const progressPercent = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
                  
                  return (
                    <div key={project.id} className="flex items-center gap-3">
                      <div className="w-24 text-xs text-gray-600 truncate">{project.name}</div>
                      <div className="flex-1 relative">
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              project.status === 'tender' ? 'bg-blue-400' :
                              project.status === 'precon' ? 'bg-green-400' :
                              project.status === 'construction' ? 'bg-yellow-400' :
                              project.status === 'aftercare' ? 'bg-purple-400 opacity-50' : 'bg-gray-400'
                            }`}
                            style={{ width: `${Math.min(progressPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-16 text-xs text-gray-600 text-right">
                        {Math.round(progressPercent)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Financial Metrics Chart */}
          <Card className="material-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Financial Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Portfolio Value */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatValue(`£${projects?.reduce((sum, p) => {
                      if (p.status === 'tender') return sum; // Don't count tender costs as value
                      const value = p.value?.replace(/[£,]/g, '') || '0';
                      return sum + parseFloat(value);
                    }, 0) || 0}`)}
                  </div>
                  <div className="text-sm text-gray-500">Total Portfolio Value</div>
                  <div className="text-xs text-gray-400">(Excluding tender costs)</div>
                </div>
                
                {/* Active Retention */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">
                    {formatValue(`£${projects?.filter(p => p.status === 'aftercare').reduce((sum, p) => {
                      const value = p.retention?.replace(/[£,-]/g, '') || '0';
                      return sum + parseFloat(value);
                    }, 0) || 0}`)}
                  </div>
                  <div className="text-sm text-gray-500">Active Retention</div>
                  <div className="text-xs text-gray-400">Projects in aftercare</div>
                </div>
                
                {/* Projects at Risk */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {projects?.filter(p => {
                      if (!p.startOnSiteDate || !p.contractCompletionDate) return false;
                      const endDate = new Date(p.contractCompletionDate);
                      const currentDate = new Date();
                      return currentDate > endDate && p.status !== 'aftercare';
                    }).length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Overrun Projects</div>
                  <div className="text-xs text-gray-400">Past contract completion</div>
                </div>
              </div>
              
              {/* EEV vs Project Value Comparison */}
              <div className="mt-6 space-y-3">
                <div className="text-sm font-medium">EEV vs Project Value Comparison</div>
                {projects?.filter(p => p.status !== 'aftercare' && p.status !== 'tender').map(project => {
                  const projectValueNum = parseFloat(project.value?.replace(/[£,]/g, '') || '0');
                  
                  // Calculate EEV if we have timeline data
                  let eevValue = 0;
                  let eevPercent = 0;
                  if (project.startOnSiteDate && project.contractCompletionDate && projectValueNum > 0) {
                    const startDate = new Date(project.startOnSiteDate);
                    const endDate = new Date(project.contractCompletionDate);
                    const currentDate = new Date();
                    const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                    const currentWeek = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                    
                    if (totalWeeks > 0) {
                      const weeklyValue = projectValueNum / totalWeeks;
                      eevValue = Math.min(weeklyValue * Math.max(1, currentWeek), projectValueNum);
                      eevPercent = (eevValue / projectValueNum) * 100;
                    }
                  }
                  
                  return (
                    <div key={project.id} className="flex items-center gap-3">
                      <div className="w-24 text-xs text-gray-600 truncate">{project.name}</div>
                      <div className="flex-1 relative">
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-400 rounded-full transition-all"
                            style={{ width: `${Math.min(eevPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-xs text-gray-600 text-right">
                        {formatValue(`£${eevValue}`)}
                      </div>
                      <div className="w-16 text-xs text-gray-600 text-right">
                        {Math.round(eevPercent)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Empty content for Packages tab */}
        </TabsContent>
      </Tabs>

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