import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, LayoutDashboard, FileText } from "lucide-react";
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

    const projectData = {
      projectNumber: projectNumber.toUpperCase(),
      name: capitalizedName,
      description: capitalizedDescription,
      status: selectedPhase,
      startOnSiteDate: startDate ? new Date(startDate) : null,
      contractCompletionDate: contractDate ? new Date(contractDate) : null,
      constructionCompletionDate: constructionDate ? new Date(constructionDate) : null,
      value: `£${value}`,
    };

    if (selectedProject) {
      updateProjectMutation.mutate({ ...selectedProject, ...projectData });
    } else {
      createProjectMutation.mutate(projectData);
    }
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


      <Tabs value={activeTab} className="space-y-6" onValueChange={(value) => {
        setActiveTab(value);
        onTabChange?.(value);
      }}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: '20% 60% 20%' }}>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dash
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center justify-center opacity-50 cursor-not-allowed text-xs" disabled>
            {(() => {
              const constructionProjects = projects.filter(p => p.status === 'construction');
              const preconProjects = projects.filter(p => p.status === 'precon');
              
              const constructionValue = constructionProjects.reduce((sum, p) => {
                const value = p.value?.replace(/[£,]/g, '') || '0';
                return sum + parseFloat(value);
              }, 0);
              
              const preconValue = preconProjects.reduce((sum, p) => {
                const value = p.value?.replace(/[£,]/g, '') || '0';
                return sum + parseFloat(value);
              }, 0);

              return `CONSTRUCTION: ${constructionProjects.length} (£${constructionValue.toFixed(1)}M) | PRECON: ${preconProjects.length} (£${preconValue.toFixed(1)}M)`;
            })()}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Detail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
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
              projects.map((project: Project) => {
                // Calculate current project week and totals
                const getCurrentWeekInfo = () => {
                  if (!project.startOnSiteDate || !project.constructionCompletionDate || !project.contractCompletionDate) {
                    return null;
                  }
                  
                  const startDate = new Date(project.startOnSiteDate);
                  const anticipatedDate = new Date(project.constructionCompletionDate);
                  const contractDate = new Date(project.contractCompletionDate);
                  const currentDate = new Date();
                  
                  const currentWeek = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                  const totalWeeksToAnticipated = Math.ceil((anticipatedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                  const totalWeeksToContract = Math.ceil((contractDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                  
                  return {
                    currentWeek: Math.max(1, currentWeek),
                    totalWeeksToAnticipated: Math.max(1, totalWeeksToAnticipated),
                    totalWeeksToContract: Math.max(1, totalWeeksToContract),
                    startDate: startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
                    anticipatedDate: anticipatedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
                    contractDate: contractDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
                  };
                };

                const weekInfo = getCurrentWeekInfo();
                
                return (
                  <div key={project.id}>
                    <Card className="material-shadow">
                  <CardContent className="p-2.5 pb-8">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          {project.projectNumber && (
                            <span className="text-sm text-action-text-secondary">({project.projectNumber})</span>
                          )}
                          {/* Process indicator */}
                          <div className="ml-auto">
                            <button
                              className={`
                                rounded-full px-2 py-0.5 text-xs font-medium border transition-colors
                                ${project.status === "tender" ? "bg-orange-100 text-orange-800 border-orange-200" : ""}
                                ${project.status === "precon" ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
                                ${project.status === "construction" ? "bg-green-100 text-green-800 border-green-200" : ""}
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
                            <div className="flex items-center gap-3">
                              <div className="flex items-center">
                                <span className="bg-gray-400 text-white border border-gray-400 px-1 py-0.5 rounded-l-sm" style={{ fontSize: '10px' }}>SOS</span>
                                <span className="bg-white text-black border border-gray-300 px-1 py-0.5 rounded-r-sm" style={{ fontSize: '10px' }}>{weekInfo.startDate.toUpperCase()}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="bg-blue-300 text-white border border-blue-300 px-1 py-0.5 rounded-l-sm" style={{ fontSize: '10px' }}>CONST</span>
                                <span className="bg-white text-black border border-gray-300 px-1 py-0.5 rounded-r-sm" style={{ fontSize: '10px' }}>{weekInfo.anticipatedDate.toUpperCase()}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-white border border-gray-800 px-1 py-0.5 rounded-l-sm" style={{ fontSize: '10px', backgroundColor: 'rgba(31, 41, 55, 0.7)' }}>CONTR</span>
                                <span className="bg-white text-black border border-gray-300 px-1 py-0.5 rounded-r-sm" style={{ fontSize: '10px' }}>{weekInfo.contractDate.toUpperCase()}</span>
                              </div>
                            </div>

                          </div>
                        )}
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
                    
                    {/* Timeline bar chart - full width */}
                    {weekInfo && (
                          <div className="mt-2 relative">
                            <div className="w-full h-1 bg-gray-100 rounded-sm overflow-hidden flex">
                              {(() => {
                                const currentWeek = weekInfo.currentWeek;
                                const totalWeeksToAnticipated = weekInfo.totalWeeksToAnticipated;
                                const totalWeeksToContract = weekInfo.totalWeeksToContract;
                                
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
                                        className="bg-blue-300 h-full opacity-60" 
                                        style={{ width: `${lightBluePercent}%` }}
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
                            {/* Today marker and week indicator */}
                            {(() => {
                              const currentWeek = weekInfo.currentWeek;
                              const totalWeeksToContract = weekInfo.totalWeeksToContract;
                              const totalWeeksToAnticipated = weekInfo.totalWeeksToAnticipated;
                              const currentPercent = Math.min((currentWeek / totalWeeksToContract) * 100, 100);
                              
                              return (
                                <div className="absolute" style={{ left: `calc(${currentPercent}% - 2px)` }}>
                                  {/* Today marker extending through timeline */}
                                  <div 
                                    className="w-0.5 h-7 bg-gray-600 rounded-sm"
                                    style={{ marginTop: '-8px' }}
                                    title="Today"
                                  />
                                  {/* Week indicator positioned to the left and vertically aligned with marker */}
                                  <div 
                                    className="absolute whitespace-nowrap text-gray-600"
                                    style={{ 
                                      fontSize: '10.2px', 
                                      top: '-4px', 
                                      right: '4px',
                                      lineHeight: '28px',
                                      color: 'rgb(75, 85, 99)'
                                    }}
                                  >
                                    w{currentWeek} of {totalWeeksToAnticipated} ({totalWeeksToContract})
                                  </div>
                                </div>
                              );
                            })()}

                          </div>
                        )}
                    </CardContent>
                  </Card>
                  
                  {/* Remaining weeks display - tab behind project card */}
                  {weekInfo && (
                    <div className="flex justify-end relative" style={{ marginTop: '-3px', marginRight: '25px' }}>
                      <div className="bg-white border border-gray-200 rounded-b-lg px-3 py-1.5 text-gray-600 inline-block italic" style={{ fontSize: '11.73px', zIndex: -1 }}>
                        Weeks Remaining Construction <span className="font-bold text-blue-300">{Math.max(0, weekInfo.totalWeeksToAnticipated - weekInfo.currentWeek)}</span> - Contract <span className="font-bold text-gray-800">{Math.max(0, weekInfo.totalWeeksToContract - weekInfo.currentWeek)}</span>
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

        <TabsContent value="users" className="space-y-6">
          <DetailCharts />
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