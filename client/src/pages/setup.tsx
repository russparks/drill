import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Users, Building, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Project, User, InsertProject, InsertUser } from "@shared/schema";

export default function Setup() {
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPhase, setSelectedPhase] = useState("tender");
  const [workingWeeks, setWorkingWeeks] = useState({ startToContract: 0, startToAnticipated: 0, anticipatedToContract: 0 });
  const { toast } = useToast();

  // Listen for project modal open event from navbar
  useEffect(() => {
    const handleOpenProjectModal = () => {
      setSelectedProject(null);
      setSelectedPhase("tender");
      setIsProjectDialogOpen(true);
    };

    window.addEventListener('openProjectModal', handleOpenProjectModal);
    return () => window.removeEventListener('openProjectModal', handleOpenProjectModal);
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

        setWorkingWeeks({
          startToContract: Math.max(0, startToContract),
          startToAnticipated: Math.max(0, startToAnticipated),
          anticipatedToContract: Math.max(0, anticipatedToContract)
        });
      }
    }, 0);
  };

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
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

  const createUserMutation = useMutation({
    mutationFn: (user: InsertUser) => 
      apiRequest("POST", "/api/users", user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsUserDialogOpen(false);
      toast({ 
        title: "User Created",
        className: "bg-[#b9f6b6] text-[#079800] border-[#079800] !p-2 !px-4 !pr-4 w-auto max-w-none min-w-fit text-center justify-center",
        duration: 5000,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, ...user }: User) => 
      apiRequest("PATCH", `/api/users/${id}`, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsUserDialogOpen(false);
      setSelectedUser(null);
      toast({ 
        title: "User Updated",
        className: "bg-[#b9f6b6] text-[#079800] border-[#079800] !p-2 !px-4 !pr-4 w-auto max-w-none min-w-fit text-center justify-center",
        duration: 5000,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ 
        title: "User Deleted",
        className: "bg-[#b9f6b6] text-[#079800] border-[#079800] !p-2 !px-4 !pr-4 w-auto max-w-none min-w-fit text-center justify-center",
        duration: 5000,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
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
      startOnSiteDate: startDate || null,
      contractCompletionDate: contractDate || null,
      constructionCompletionDate: constructionDate || null,
      value: `£${value}`,
    };

    if (selectedProject) {
      updateProjectMutation.mutate({ ...selectedProject, ...projectData });
    } else {
      createProjectMutation.mutate(projectData);
    }
  };

  const handleUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userData = {
      username: formData.get("username") as string,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string || "password123",
    };

    if (selectedUser) {
      updateUserMutation.mutate({ ...selectedUser, ...userData });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            People
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
                          onClick={() => setSelectedPhase(phase.value)}
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
                          <Info className="w-6 h-6 text-gray-400" />
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
          </div>

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
                <Card key={project.id} className="material-shadow">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
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
                          <div className="flex items-center gap-3" style={{ fontSize: '10px' }}>
                            <div className="flex items-center">
                              <span className="bg-black text-white border border-black px-1 py-0.5 rounded-l-sm" style={{ fontSize: '10px' }}>SOS</span>
                              <span className="bg-white text-black border border-gray-300 px-1 py-0.5 rounded-r-sm" style={{ fontSize: '10px' }}>{weekInfo.startDate.toUpperCase()}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="bg-black text-white border border-black px-1 py-0.5 rounded-l-sm" style={{ fontSize: '10px' }}>CONST</span>
                              <span className="bg-white text-black border border-gray-300 px-1 py-0.5 rounded-r-sm" style={{ fontSize: '10px' }}>{weekInfo.anticipatedDate.toUpperCase()}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="bg-black text-white border border-black px-1 py-0.5 rounded-l-sm" style={{ fontSize: '10px' }}>CONTR</span>
                              <span className="bg-white text-black border border-gray-300 px-1 py-0.5 rounded-r-sm" style={{ fontSize: '10px' }}>{weekInfo.contractDate.toUpperCase()}</span>
                            </div>
                            <span className="bg-gray-200 text-black border border-gray-300 px-1 py-0.5 rounded-sm ml-2" style={{ fontSize: '10px' }}>W{weekInfo.currentWeek} OF {weekInfo.totalWeeksToAnticipated}({weekInfo.totalWeeksToContract})</span>
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
                            if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
                              deleteProjectMutation.mutate(project.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-action-text-primary">People</h2>
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedUser(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Person
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedUser ? "Edit Person" : "Add New Person"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={selectedUser?.name}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      defaultValue={selectedUser?.username}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={selectedUser?.email}
                      required
                    />
                  </div>
                  {!selectedUser && (
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Default: password123"
                      />
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {selectedUser ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {usersLoading ? (
              <div>Loading people...</div>
            ) : (
              users.map((user: User) => (
                <Card key={user.id} className="material-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{user.name}</CardTitle>
                        <p className="text-sm text-action-text-secondary">@{user.username}</p>
                        <p className="text-sm text-action-text-secondary">{user.email}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsUserDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteUserMutation.mutate(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}