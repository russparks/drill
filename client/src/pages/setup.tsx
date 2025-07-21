import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Project, InsertProject } from "@shared/schema";
import ConfirmDialog from "@/components/confirm-dialog";

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

        setWorkingWeeks({ startToContract, startToAnticipated, anticipatedToContract });
      }
    }, 50);
  };

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: InsertProject) => apiRequest(`/api/projects`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsProjectDialogOpen(false);
      setSelectedProject(null);
      toast({
        title: "Success",
        description: "Project created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create project.",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: Project) => apiRequest(`/api/projects/${data.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsProjectDialogOpen(false);
      setSelectedProject(null);
      toast({
        title: "Success",
        description: "Project updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update project.",
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/projects/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "destructive",
      });
    },
  });

  const handleProjectSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const projectNumber = formData.get("projectNumber") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const value = formData.get("value") as string;
    const startDate = formData.get("startOnSiteDate") as string;
    const constructionDate = formData.get("constructionCompletionDate") as string;
    const contractDate = formData.get("contractCompletionDate") as string;
    
    const projectData = {
      projectNumber,
      name,
      description,
      status: selectedPhase,
      startOnSiteDate: startDate ? new Date(startDate) : null,
      constructionCompletionDate: constructionDate ? new Date(constructionDate) : null,
      contractCompletionDate: contractDate ? new Date(contractDate) : null,
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
      <div className="space-y-6">
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
                        counter.className = `text-xs ${wordCount >= 25 && wordCount <= 100 ? 'text-green-600' : 'text-gray-500'}`;
                      }
                    }}
                  />
                </div>

                {/* Row 3: Phase Selection */}
                <div>
                  <Label className="text-xs">Phase</Label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {(["tender", "precon", "construction", "aftercare"] as const).map((phase) => (
                      <button
                        key={phase}
                        type="button"
                        className={`
                          px-2 py-1 text-xs rounded border transition-colors
                          ${selectedPhase === phase 
                            ? "bg-[#cc3333] text-white border-[#cc3333]" 
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }
                        `}
                        onClick={() => setSelectedPhase(phase)}
                      >
                        {phase.charAt(0).toUpperCase() + phase.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 4: Dates */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="startOnSiteDate" className="text-xs">Start on Site</Label>
                    <Input
                      id="startOnSiteDate"
                      name="startOnSiteDate"
                      type="date"
                      className="h-7 px-1.5 py-1"
                      style={{ fontSize: '11px' }}
                      defaultValue={selectedProject?.startOnSiteDate ? new Date(selectedProject.startOnSiteDate).toISOString().split('T')[0] : ""}
                      onChange={calculateWorkingWeeks}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="constructionCompletionDate" className="text-xs">Construction Complete</Label>
                    <Input
                      id="constructionCompletionDate"
                      name="constructionCompletionDate"
                      type="date"
                      className="h-7 px-1.5 py-1"
                      style={{ fontSize: '11px' }}
                      defaultValue={selectedProject?.constructionCompletionDate ? new Date(selectedProject.constructionCompletionDate).toISOString().split('T')[0] : ""}
                      onChange={calculateWorkingWeeks}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contractCompletionDate" className="text-xs">Contract Complete</Label>
                    <Input
                      id="contractCompletionDate"
                      name="contractCompletionDate"
                      type="date"
                      className="h-7 px-1.5 py-1"
                      style={{ fontSize: '11px' }}
                      defaultValue={selectedProject?.contractCompletionDate ? new Date(selectedProject.contractCompletionDate).toISOString().split('T')[0] : ""}
                      onChange={calculateWorkingWeeks}
                      required
                    />
                  </div>
                </div>

                {/* Working weeks display */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
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
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-gray-700" style={{ backgroundColor: 'rgba(156, 163, 175, 0.6)' }}>
                              <span className="font-medium">SOS</span>
                              <span className="font-mono">{weekInfo.startDate}</span>
                            </div>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-gray-700" style={{ backgroundColor: 'rgba(147, 197, 253, 0.6)' }}>
                              <span className="font-medium">CONST</span>
                              <span className="font-mono">{weekInfo.anticipatedDate}</span>
                            </div>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: 'rgba(75, 85, 99, 0.7)' }}>
                              <span className="font-medium">CONTR</span>
                              <span className="font-mono">{weekInfo.contractDate}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-action-text-secondary mt-0.5 line-clamp-2">{project.description}</p>
                      <p className="text-xs text-action-text-secondary mt-0.5">{project.value}</p>
                      
                      {/* Timeline bar - full width */}
                      {weekInfo && (
                        <div className="w-full mt-2">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden relative">
                            {/* Elapsed time (grey) */}
                            <div 
                              className="h-full rounded-full absolute left-0 top-0" 
                              style={{ 
                                width: `${(weekInfo.currentWeek / weekInfo.totalWeeksToContract) * 100}%`, 
                                backgroundColor: 'rgba(156, 163, 175, 0.6)' 
                              }}
                            />
                            {/* Remaining time to anticipated completion (light blue) */}
                            <div 
                              className="h-full rounded-full absolute top-0" 
                              style={{ 
                                left: `${(weekInfo.currentWeek / weekInfo.totalWeeksToContract) * 100}%`,
                                width: `${((weekInfo.totalWeeksToAnticipated - weekInfo.currentWeek) / weekInfo.totalWeeksToContract) * 100}%`, 
                                backgroundColor: 'rgba(147, 197, 253, 0.6)' 
                              }}
                            />
                            {/* Buffer time (dark grey) */}
                            <div 
                              className="h-full rounded-full absolute top-0" 
                              style={{ 
                                left: `${(weekInfo.totalWeeksToAnticipated / weekInfo.totalWeeksToContract) * 100}%`,
                                width: `${((weekInfo.totalWeeksToContract - weekInfo.totalWeeksToAnticipated) / weekInfo.totalWeeksToContract) * 100}%`, 
                                backgroundColor: 'rgba(75, 85, 99, 0.6)' 
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex space-x-1 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setSelectedProject(project);
                          setSelectedPhase(project.status as "tender" | "precon" | "construction" | "aftercare");
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

      <ConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        onConfirm={() => {
          if (itemToDelete?.type === 'project') {
            deleteProjectMutation.mutate(itemToDelete.id);
          }
          setItemToDelete(null);
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
    </div>
  );
}