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
  dueDate: z.string().optional().nullable(),
  newProjectName: z.string().optional(),
  newPersonName: z.string().optional(),
  newPersonEmail: z.string().email().optional(),
}).transform((data) => ({
  ...data,
  assigneeId: data.assigneeId || null,
  projectId: data.projectId || null,
  dueDate: data.dueDate || null,
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
      status: action?.status || "open",
      priority: action?.priority || "medium",
      assigneeId: action?.assigneeId || undefined,
      projectId: action?.projectId || undefined,
      dueDate: action?.dueDate ? new Date(action.dueDate).toISOString().split('T')[0] : "",
    },
  });

  // Reset form when action changes
  React.useEffect(() => {
    if (action) {
      form.reset({
        title: action.title,
        description: action.description || "",
        discipline: action.discipline,
        status: action.status,
        priority: action.priority,
        assigneeId: action.assigneeId || undefined,
        projectId: action.projectId || undefined,
        dueDate: action.dueDate ? new Date(action.dueDate).toISOString().split('T')[0] : "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        discipline: "",
        status: "open",
        priority: "medium",
        assigneeId: undefined,
        projectId: undefined,
        dueDate: "",
      });
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
        const newProject = await apiRequest("/api/projects", {
          method: "POST",
          body: JSON.stringify({ 
            name: data.newProjectName,
            description: "",
            status: "active" 
          }),
        });
        finalData.projectId = newProject.id;
      }
      
      // Create new person if needed
      if (showNewPersonInput && data.newPersonName && data.newPersonEmail) {
        const newUser = await apiRequest("/api/users", {
          method: "POST", 
          body: JSON.stringify({
            name: data.newPersonName,
            email: data.newPersonEmail,
            username: data.newPersonEmail.split('@')[0],
            password: "defaultpassword"
          }),
        });
        finalData.assigneeId = newUser.id;
      }
      
      // Remove the temporary fields
      const { newProjectName, newPersonName, newPersonEmail, ...actionData } = finalData;
      
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {action ? "Edit Action" : "New Action"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <FormControl>
                    <div className="flex gap-2">
                      {[
                        { 
                          value: "precon", 
                          label: "Precon", 
                          active: "bg-blue-600 text-white",
                          inactive: "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        },
                        { 
                          value: "production", 
                          label: "Production", 
                          active: "bg-orange-600 text-white",
                          inactive: "bg-orange-100 text-orange-800 hover:bg-orange-200"
                        },
                        { 
                          value: "design", 
                          label: "Design", 
                          active: "bg-purple-600 text-white",
                          inactive: "bg-purple-100 text-purple-800 hover:bg-purple-200"
                        },
                        { 
                          value: "commercial", 
                          label: "Commercial", 
                          active: "bg-green-600 text-white",
                          inactive: "bg-green-100 text-green-800 hover:bg-green-200"
                        },
                        { 
                          value: "misc", 
                          label: "Misc", 
                          active: "bg-gray-600 text-white",
                          inactive: "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }
                      ].map((discipline) => (
                        <button
                          key={discipline.value}
                          type="button"
                          onClick={() => field.onChange(discipline.value)}
                          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex gap-2">
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

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
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
                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              field.value === dateString
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                      <Input 
                        type="date" 
                        className="w-32"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
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
