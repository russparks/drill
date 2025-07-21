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
  description: z.string().optional().refine((val) => {
    if (!val) return true; // Allow empty descriptions
    const wordCount = val.trim().split(/\s+/).length;
    return wordCount <= 50;
  }, {
    message: "Description must be 50 words or less",
  }),
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
              name="description"
              render={({ field }) => {
                const wordCount = field.value ? field.value.trim().split(/\s+/).length : 0;
                return (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Description</FormLabel>
                      <span className={`text-xs ${wordCount > 50 ? 'text-red-600' : 'text-gray-500'}`}>
                        {wordCount}/50 words
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the action details (max 50 words for new actions)"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="discipline"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-4">
                    <FormLabel className="min-w-[80px]">Discipline</FormLabel>
                    {field.value && (
                      <span className="text-sm text-gray-500 capitalize">
                        {field.value === 'she' ? 'SHE' : field.value === 'qa' ? 'QA' : field.value}
                      </span>
                    )}
                  </div>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { 
                          value: "operations", 
                          label: "OPS", 
                          color: "bg-blue-600"
                        },
                        { 
                          value: "commercial", 
                          label: "COMM", 
                          color: "bg-cyan-500"
                        },
                        { 
                          value: "design", 
                          label: "DES", 
                          color: "bg-purple-500"
                        },
                        { 
                          value: "she", 
                          label: "SHE", 
                          color: "bg-orange-500"
                        },
                        { 
                          value: "qa", 
                          label: "QA", 
                          color: "bg-indigo-500"
                        },
                        { 
                          value: "general", 
                          label: "GEN", 
                          color: "bg-gray-600"
                        }
                      ].map((discipline) => (
                        <button
                          key={discipline.value}
                          type="button"
                          onClick={() => field.onChange(discipline.value)}
                          className={`px-2 py-1 rounded-full text-xs font-bold text-white transition-all ${
                            field.value === discipline.value
                              ? `${discipline.color} scale-110`
                              : `${discipline.color} opacity-50 hover:opacity-75`
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
                  <div className="flex items-center gap-4">
                    <FormLabel className="min-w-[80px]">Phase</FormLabel>
                    {field.value && (
                      <span className="text-sm text-gray-500 capitalize">
                        {field.value}
                      </span>
                    )}
                  </div>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { 
                          value: "tender", 
                          label: "TEN", 
                          color: "bg-blue-400"
                        },
                        { 
                          value: "precon", 
                          label: "PRE", 
                          color: "bg-green-400"
                        },
                        { 
                          value: "construction", 
                          label: "CON", 
                          color: "bg-yellow-500"
                        },
                        { 
                          value: "aftercare", 
                          label: "AFT", 
                          color: "bg-gray-500"
                        },
                        { 
                          value: "strategy", 
                          label: "STR", 
                          color: "bg-black"
                        }
                      ].map((phase) => (
                        <button
                          key={phase.value}
                          type="button"
                          onClick={() => field.onChange(phase.value)}
                          className={`px-2 py-1 rounded-full text-xs font-bold text-white transition-all ${
                            field.value === phase.value
                              ? `${phase.color} scale-110`
                              : `${phase.color} opacity-50 hover:opacity-75`
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

            <div className="flex gap-4">
              <div className="w-[60%]">
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
                          <SelectTrigger className="h-8">
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
              </div>
              
              <div className="w-[40%]">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <div className="flex gap-1">
                          {[
                            { value: "low", label: "L", color: "bg-green-600" },
                            { value: "medium", label: "M", color: "bg-amber-600" },
                            { value: "high", label: "H", color: "bg-red-600" }
                          ].map((priority) => (
                            <button
                              key={priority.value}
                              type="button"
                              onClick={() => field.onChange(priority.value)}
                              className={`px-2 py-1 rounded-full text-xs font-bold text-white transition-all ${
                                field.value === priority.value
                                  ? `${priority.color} scale-110`
                                  : `${priority.color} opacity-50 hover:opacity-75`
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
              </div>
            </div>

            {action && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8">
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
                  <div className="flex items-center gap-4">
                    <FormLabel className="min-w-[80px]">Due Date</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex gap-1">
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
                                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
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
                          className="w-32 h-8"
                          placeholder="Or select custom date"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                  </div>
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
