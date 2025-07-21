import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, insertUserSchema, type Project, type User } from "@shared/schema";
import { z } from "zod";
import { Pencil, Trash2, Plus } from "lucide-react";

const projectFormSchema = insertProjectSchema.extend({
  id: z.number().optional(),
});

const userFormSchema = insertUserSchema.extend({
  id: z.number().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;
type UserFormData = z.infer<typeof userFormSchema>;

function ProjectForm({ project, onClose }: { project?: Project; onClose: () => void }) {
  const { toast } = useToast();
  
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      projectNumber: project?.projectNumber || "",
      name: project?.name || "",
      startOnSiteDate: project?.startOnSiteDate ? 
        (project.startOnSiteDate instanceof Date ? 
          project.startOnSiteDate.toISOString().split('T')[0] : 
          new Date(project.startOnSiteDate).toISOString().split('T')[0]) : "",
      contractCompletionDate: project?.contractCompletionDate ? 
        (project.contractCompletionDate instanceof Date ? 
          project.contractCompletionDate.toISOString().split('T')[0] : 
          new Date(project.contractCompletionDate).toISOString().split('T')[0]) : "",
      constructionCompletionDate: project?.constructionCompletionDate ? 
        (project.constructionCompletionDate instanceof Date ? 
          project.constructionCompletionDate.toISOString().split('T')[0] : 
          new Date(project.constructionCompletionDate).toISOString().split('T')[0]) : "",
      status: project?.status || "tender",
      description: project?.description || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProjectFormData) => {
      const { id, ...payload } = data;
      return apiRequest("POST", "/api/projects", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Success", description: "Project created successfully" });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProjectFormData) => {
      const { id, ...payload } = data;
      return apiRequest("PATCH", `/api/projects/${project?.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Success", description: "Project updated successfully" });
      onClose();
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    if (project) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const statusButtons = [
    { value: "tender", label: "Tender", color: "bg-blue-300 text-white" },
    { value: "precon", label: "Precon", color: "bg-blue-500 text-white" },
    { value: "production", label: "Production", color: "bg-green-500 text-white" },
    { value: "aftercare", label: "Aftercare", color: "bg-purple-500 text-white" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="projectNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startOnSiteDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start on Site Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contractCompletionDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contract Completion Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="constructionCompletionDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Construction Completion Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Status</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-2">
                  {statusButtons.map((status) => (
                    <Button
                      key={status.value}
                      type="button"
                      variant={field.value === status.value ? "default" : "outline"}
                      className={field.value === status.value ? status.color : ""}
                      onClick={() => field.onChange(status.value)}
                    >
                      {status.label}
                    </Button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-4">
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1"
          >
            {project ? "Update" : "Create"} Project
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

function UserForm({ user, onClose }: { user?: User; onClose: () => void }) {
  const { toast } = useToast();
  
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      username: user?.username || "",
      password: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => {
      const { id, ...payload } = data;
      return apiRequest("POST", "/api/users", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Success", description: "Person created successfully" });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UserFormData) => {
      const { id, password, ...payload } = data;
      const updateData = password ? { ...payload, password } : payload;
      return apiRequest("PATCH", `/api/users/${user?.id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Success", description: "Person updated successfully" });
      onClose();
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (user) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{user ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-4">
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1"
          >
            {user ? "Update" : "Create"} Person
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function ManagePage() {
  const { toast } = useToast();
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [editingUser, setEditingUser] = useState<User | undefined>();

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Success", description: "Project deleted successfully" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Success", description: "Person deleted successfully" });
    },
  });

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserDialogOpen(true);
  };

  const handleCloseProjectDialog = () => {
    setProjectDialogOpen(false);
    setEditingProject(undefined);
  };

  const handleCloseUserDialog = () => {
    setUserDialogOpen(false);
    setEditingUser(undefined);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manage Projects & People</h1>
        <p className="text-muted-foreground mt-2">Create, edit, and manage your projects and team members</p>
      </div>

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">Dash</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="people">Detail</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Projects</h2>
            <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingProject(undefined)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingProject ? "Edit Project" : "Create New Project"}
                  </DialogTitle>
                </DialogHeader>
                <ProjectForm project={editingProject} onClose={handleCloseProjectDialog} />
              </DialogContent>
            </Dialog>
          </div>

          {projectsLoading ? (
            <div>Loading projects...</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project: Project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.name}</div>
                          {project.projectNumber && (
                            <div className="text-sm text-muted-foreground">#{project.projectNumber}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded text-white ${
                          project.status === "tender" ? "bg-blue-300" :
                          project.status === "precon" ? "bg-blue-500" :
                          project.status === "production" ? "bg-green-500" :
                          project.status === "aftercare" ? "bg-purple-500" :
                          "bg-gray-500"
                        }`}>
                          {project.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {project.startOnSiteDate ? 
                          new Date(project.startOnSiteDate).toLocaleDateString() : 
                          "-"
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProject(project)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProjectMutation.mutate(project.id)}
                            disabled={deleteProjectMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Live Dashboard</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
              <h3 className="text-lg font-medium text-blue-800">Real-time Updates</h3>
              <p className="text-blue-600 mt-2">Live project status and action tracking</p>
            </div>
            
            <div className="p-6 border rounded-lg bg-gradient-to-r from-green-50 to-green-100">
              <h3 className="text-lg font-medium text-green-800">Active Projects</h3>
              <p className="text-green-600 mt-2">Currently in-progress initiatives</p>
            </div>
            
            <div className="p-6 border rounded-lg bg-gradient-to-r from-orange-50 to-orange-100">
              <h3 className="text-lg font-medium text-orange-800">Team Activity</h3>
              <p className="text-orange-600 mt-2">Live collaboration and notifications</p>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Live Activity Feed</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Live monitoring capabilities will be implemented here</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Real-time project updates and notifications</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Team collaboration and status changes</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="people" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">People</h2>
            <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingUser(undefined)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Person
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? "Edit Person" : "Create New Person"}
                  </DialogTitle>
                </DialogHeader>
                <UserForm user={editingUser} onClose={handleCloseUserDialog} />
              </DialogContent>
            </Dialog>
          </div>

          {usersLoading ? (
            <div>Loading people...</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">{user.username}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteUserMutation.mutate(user.id)}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}