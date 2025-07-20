import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertActionSchema, type ActionWithRelations, type User, type Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";

const actionFormSchema = insertActionSchema.extend({
  assigneeId: z.number().optional().nullable(),
  projectId: z.number().optional().nullable(),
  newProjectName: z.string().optional(),
  newPersonName: z.string().optional(),
  newPersonEmail: z.string().optional(),
}).transform((data) => ({
  ...data,
  assigneeId: data.assigneeId || null,
  projectId: data.projectId || null,
}));

type ActionFormData = z.infer<typeof actionFormSchema>;

interface ActionFormProps {
  isOpen: boolean;
  onClose: () => void;
  action?: ActionWithRelations | null;
}

export default function ActionForm({ isOpen, onClose, action }: ActionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [showNewPersonInput, setShowNewPersonInput] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: isOpen,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    enabled: isOpen,
  });

  const form = useForm<ActionFormData>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      title: action?.title || "",
      description: action?.description || "",
      discipline: action?.discipline || "",
      phase: action?.phase || "",
      status: action?.status || "open",
      priority: action?.priority || "medium",
      assigneeId: action?.assigneeId || undefined,
      projectId: action?.projectId || undefined,
      dueDate: action?.dueDate ? new Date(action.dueDate).toISOString().split('T')[0] : "",
      newProjectName: "",
      newPersonName: "",
      newPersonEmail: "",
    },
  });

  // Reset form when action changes
  React.useEffect(() => {
    if (action) {
      form.reset({
        title: action.title,
        description: action.description || "",
        discipline: action.discipline,
        phase: action.phase,
        status: action.status,
        priority: action.priority,
        assigneeId: action.assigneeId || undefined,
        projectId: action.projectId || undefined,
        dueDate: action.dueDate ? new Date(action.dueDate).toISOString().split('T')[0] : "",
        newProjectName: "",
        newPersonName: "",
        newPersonEmail: "",
      });
      setShowNewProjectInput(false);
      setShowNewPersonInput(false);
    } else {
      form.reset({
        title: "",
        description: "",
        discipline: "",
        phase: "",
        status: "open",
        priority: "medium",
        assigneeId: undefined,
        projectId: undefined,
        dueDate: "",
        newProjectName: "",
        newPersonName: "",
        newPersonEmail: "",
      });
      setShowNewProjectInput(false);
      setShowNewPersonInput(false);
    }
  }, [action, form]);

  const createActionMutation = useMutation({
    mutationFn: async (data: ActionFormData) => {
      const payload = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      };
      return apiRequest("POST", "/api/actions", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Action created successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create action",
        variant: "destructive",
      });
    },
  });

  const updateActionMutation = useMutation({
    mutationFn: async (data: ActionFormData) => {
      if (!action) throw new Error("No action to update");
      const payload = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      };
      return apiRequest("PATCH", `/api/actions/${action.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Action updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update action",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ActionFormData) => {
    try {
      let finalData = { ...data };
      
      // Create new project if needed
      if (showNewProjectInput && data.newProjectName) {
        const response = await apiRequest("POST", "/api/projects", { 
          name: data.newProjectName,
          description: "",
          status: "tender" 
        });
        const newProject = await response.json();
        finalData.projectId = newProject.id;
        
        // Invalidate projects cache to refresh dropdowns
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      }
      
      // Create new person if needed
      if (showNewPersonInput && data.newPersonName && data.newPersonEmail) {
        const response = await apiRequest("POST", "/api/users", {
          name: data.newPersonName,
          email: data.newPersonEmail,
          username: data.newPersonEmail.split('@')[0],
          password: "defaultpassword"
        });
        const newUser = await response.json();
        finalData.assigneeId = newUser.id;
        
        // Invalidate users cache to refresh dropdowns
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      }
      
      // Remove the temporary fields and convert dueDate to proper format
      const { newProjectName, newPersonName, newPersonEmail, ...actionData } = finalData;
      
      console.log('Submitting action data:', actionData);
      
      if (action) {
        updateActionMutation.mutate(actionData);
      } else {
        createActionMutation.mutate(actionData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new project or person",
        variant: "destructive",
      });
    }
  };

  const isLoading = createActionMutation.isPending || updateActionMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {action ? "Edit Action" : "New Action"}
          </DialogTitle>
          <DialogDescription>
            {action ? "Update the details of this action." : "Create a new action for your project."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      if (value === "new") {
                        setShowNewProjectInput(true);
                        field.onChange(undefined);
                      } else {
                        setShowNewProjectInput(false);
                        field.onChange(parseInt(value));
                      }
                    }}
                    value={showNewProjectInput ? "new" : field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(projects as Project[]).map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="new">+ New Project</SelectItem>
                    </SelectContent>
                  </Select>
                  {showNewProjectInput && (
                    <FormField
                      control={form.control}
                      name="newProjectName"
                      render={({ field: projectField }) => (
                        <FormControl>
                          <Input 
                            placeholder="Enter new project name" 
                            className="mt-2"
                            {...projectField}
                          />
                        </FormControl>
                      )}
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter action title" {...field} />
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
                    <Textarea
                      placeholder="Describe the action details"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discipline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discipline</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { 
                          value: "operations", 
                          label: "Operations", 
                          active: "bg-blue-600 text-white border border-blue-800",
                          inactive: "bg-blue-100 text-blue-800 border border-blue-600 hover:bg-blue-200"
                        },
                        { 
                          value: "commercial", 
                          label: "Commercial", 
                          active: "bg-cyan-500 text-white",
                          inactive: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200"
                        },
                        { 
                          value: "design", 
                          label: "Design", 
                          active: "bg-purple-500 text-white",
                          inactive: "bg-purple-100 text-purple-800 hover:bg-purple-200"
                        },
                        { 
                          value: "she", 
                          label: "SHE", 
                          active: "bg-orange-500 text-white",
                          inactive: "bg-orange-100 text-orange-800 hover:bg-orange-200"
                        },
                        { 
                          value: "qa", 
                          label: "QA", 
                          active: "bg-indigo-500 text-white",
                          inactive: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                        }
                      ].map((discipline) => (
                        <button
                          key={discipline.value}
                          type="button"
                          onClick={() => field.onChange(discipline.value)}
                          className={`px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                            field.value === discipline.value
                              ? discipline.active
                              : discipline.inactive
                          }`}
                        >
                          {discipline.label}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phase</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { 
                          value: "tender", 
                          label: "Tender", 
                          active: "bg-blue-400 text-white border border-blue-600",
                          inactive: "bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100"
                        },
                        { 
                          value: "precon", 
                          label: "Precon", 
                          active: "bg-green-400 text-white border border-green-600",
                          inactive: "bg-green-50 text-green-700 border border-green-300 hover:bg-green-100"
                        },
                        { 
                          value: "construction", 
                          label: "Construction", 
                          active: "bg-yellow-500 text-white border border-yellow-700",
                          inactive: "bg-yellow-50 text-yellow-800 border border-yellow-400 hover:bg-yellow-100"
                        },
                        { 
                          value: "aftercare", 
                          label: "Aftercare", 
                          active: "bg-gray-500 text-white border border-gray-700",
                          inactive: "bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100"
                        }
                      ].map((phase) => (
                        <button
                          key={phase.value}
                          type="button"
                          onClick={() => field.onChange(phase.value)}
                          className={`px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                            field.value === phase.value
                              ? phase.active
                              : phase.inactive
                          }`}
                        >
                          {phase.label}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      if (value === "new") {
                        setShowNewPersonInput(true);
                        field.onChange(undefined);
                      } else {
                        setShowNewPersonInput(false);
                        field.onChange(parseInt(value));
                      }
                    }}
                    value={showNewPersonInput ? "new" : field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select person" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(users as User[]).map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                      <SelectItem value="new">+ New Person</SelectItem>
                    </SelectContent>
                  </Select>
                  {showNewPersonInput && (
                    <div className="space-y-2 mt-2">
                      <FormField
                        control={form.control}
                        name="newPersonName"
                        render={({ field: nameField }) => (
                          <FormControl>
                            <Input 
                              placeholder="Enter person's name" 
                              {...nameField}
                            />
                          </FormControl>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="newPersonEmail"
                        render={({ field: emailField }) => (
                          <FormControl>
                            <Input 
                              placeholder="Enter person's email" 
                              type="email"
                              {...emailField}
                            />
                          </FormControl>
                        )}
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <div className="flex gap-1">
                        {[
                          { value: "low", label: "Low", activeColor: "bg-green-600" },
                          { value: "medium", label: "Med", activeColor: "bg-amber-600" },
                          { value: "high", label: "High", activeColor: "bg-red-600" }
                        ].map((priority) => (
                          <button
                            key={priority.value}
                            type="button"
                            onClick={() => field.onChange(priority.value)}
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              field.value === priority.value
                                ? `${priority.activeColor} text-white`
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {priority.label}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {action && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { label: "2d", days: 2 },
                          { label: "4d", days: 4 },
                          { label: "1w", days: 7 },
                          { label: "2w", days: 14 },
                          { label: "1m", days: 30 }
                        ].map((option) => {
                          const date = new Date();
                          date.setDate(date.getDate() + option.days);
                          const dateString = date.toISOString().split('T')[0];
                          
                          return (
                            <button
                              key={option.label}
                              type="button"
                              onClick={() => field.onChange(dateString)}
                              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                field.value === dateString
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                      <Input 
                        type="date" 
                        placeholder="Or select custom date"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : action ? "Update Action" : "Create Action"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
