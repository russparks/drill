import React, { useState, useRef } from "react";
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
  description: z.string().min(1, "Description is required").refine((val) => {
    const wordCount = val.trim().split(/\s+/).filter(word => word.length > 0).length;
    return wordCount >= 10 && wordCount <= 50;
  }, {
    message: "Description must be between 10 and 50 words",
  }),

  discipline: z.string().min(1, "Discipline is required"),
  phase: z.string().min(1, "Phase is required"),
  priority: z.string().min(1, "Priority is required"),
  dueDate: z.string().min(1, "Due date is required"),
}).superRefine((data, ctx) => {
  // Require either existing project or new project
  if (!data.projectId && !data.newProjectName?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Project is required",
      path: ["projectId"],
    });
  }
  // Require either existing assignee or new person
  if (!data.assigneeId && !data.newPersonName?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Assignee is required",
      path: ["assigneeId"],
    });
  }
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
  const dateInputRef = useRef<HTMLInputElement>(null);

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
        title: "Action Created",
        className: "bg-[#b9f6b6] text-[#079800] border-[#079800]",
        duration: 5000,
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
  
  // Watch form values to determine if all required fields are filled
  const watchedValues = form.watch();
  const isFormIncomplete = !action && ( // Only validate for new actions
    !watchedValues.description?.trim() ||
    (watchedValues.description?.trim().split(/\s+/).filter(word => word.length > 0).length < 10) ||
    !watchedValues.discipline ||
    !watchedValues.phase ||
    !watchedValues.priority ||
    !watchedValues.dueDate ||
    (!watchedValues.projectId && !showNewProjectInput) ||
    (!watchedValues.assigneeId && !showNewPersonInput) ||
    (showNewProjectInput && !watchedValues.newProjectName?.trim()) ||
    (showNewPersonInput && !watchedValues.newPersonName?.trim())
  );



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {action ? "Edit Action" : "Create New Action"}
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
                      <span className={`text-xs ${wordCount < 10 ? 'text-red-600' : wordCount > 50 ? 'text-red-600' : 'text-gray-500'}`}>
                        {wordCount}/50 words {wordCount < 10 ? '(min 10)' : ''}
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the action details (minimum 10 words, max 50 words)"
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
                      <span className="text-gray-500 capitalize italic" style={{ fontSize: '11px' }}>
                        {field.value === 'she' ? 'SHE' : field.value === 'qa' ? 'QA' : field.value}
                      </span>
                    )}
                  </div>
                  <FormControl>
                    <div className="flex flex-wrap justify-between gap-2">
                      {[
                        { 
                          value: "operations", 
                          label: "OPERATIONS"
                        },
                        { 
                          value: "commercial", 
                          label: "COMMERCIAL"
                        },
                        { 
                          value: "design", 
                          label: "DESIGN"
                        },
                        { 
                          value: "she", 
                          label: "SHE"
                        },
                        { 
                          value: "qa", 
                          label: "QA"
                        },
                        { 
                          value: "general", 
                          label: "GENERAL"
                        }
                      ].map((discipline) => (
                        <button
                          key={discipline.value}
                          type="button"
                          onClick={() => field.onChange(discipline.value)}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors border ${
                            field.value === discipline.value
                              ? discipline.value === "operations" ? "bg-blue-600 text-white border-blue-800" :
                                discipline.value === "commercial" ? "bg-cyan-500 text-white" :
                                discipline.value === "design" ? "bg-purple-500 text-white" :
                                discipline.value === "she" ? "bg-orange-500 text-white" :
                                discipline.value === "qa" ? "bg-indigo-500 text-white" :
                                "bg-gray-600 text-white"
                              : discipline.value === "operations" ? "bg-blue-100 text-blue-800 border-blue-600 hover:bg-blue-200" :
                                discipline.value === "commercial" ? "bg-cyan-100 text-cyan-800 hover:bg-cyan-200" :
                                discipline.value === "design" ? "bg-purple-100 text-purple-800 hover:bg-purple-200" :
                                discipline.value === "she" ? "bg-orange-100 text-orange-800 hover:bg-orange-200" :
                                discipline.value === "qa" ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-200" :
                                "bg-gray-100 text-gray-800 hover:bg-gray-200"
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
                      <span className="text-gray-500 capitalize italic" style={{ fontSize: '11px' }}>
                        {field.value}
                      </span>
                    )}
                  </div>
                  <FormControl>
                    <div className="flex flex-wrap justify-between gap-2">
                      {[
                        { 
                          value: "tender", 
                          label: "TENDER"
                        },
                        { 
                          value: "precon", 
                          label: "PRECON"
                        },
                        { 
                          value: "construction", 
                          label: "CONSTRUCTION"
                        },
                        { 
                          value: "aftercare", 
                          label: "AFTERCARE"
                        },
                        { 
                          value: "strategy", 
                          label: "STRATEGY"
                        }
                      ].map((phase) => (
                        <button
                          key={phase.value}
                          type="button"
                          onClick={() => field.onChange(phase.value)}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors border ${
                            field.value === phase.value
                              ? phase.value === "tender" ? "bg-blue-400 text-white border-blue-600" :
                                phase.value === "precon" ? "bg-green-400 text-white border-green-600" :
                                phase.value === "construction" ? "bg-yellow-500 text-white border-yellow-700" :
                                phase.value === "aftercare" ? "bg-gray-500 text-white border-gray-700" :
                                "bg-black text-white border-black"
                              : phase.value === "tender" ? "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100" :
                                phase.value === "precon" ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-100" :
                                phase.value === "construction" ? "bg-yellow-50 text-yellow-800 border-yellow-400 hover:bg-yellow-100" :
                                phase.value === "aftercare" ? "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100" :
                                "bg-black text-white hover:bg-gray-800"
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
                              {user.name}
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
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { value: "low", label: "LOW", hex: "#4ce40c" },
                            { value: "medium", label: "MED", hex: "#ffbd4e" },
                            { value: "high", label: "HIGH", hex: "#ff6a5e" }
                          ].map((priority) => (
                            <button
                              key={priority.value}
                              type="button"
                              onClick={() => field.onChange(priority.value)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border-2 ${
                                field.value === priority.value
                                  ? `bg-gray-100 text-gray-800`
                                  : `bg-gray-100 text-gray-600 hover:bg-gray-150 border-gray-200`
                              }`}
                              style={field.value === priority.value ? { borderColor: priority.hex, color: priority.hex } : {}}
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

            <div className="flex gap-2">
              {action && (
                <div className="w-[35%]">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            {[
                              { value: "open", label: "OPEN" },
                              { value: "closed", label: "CLOSED" }
                            ].map((status) => (
                              <button
                                key={status.value}
                                type="button"
                                onClick={() => field.onChange(status.value)}
                                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                  field.value === status.value
                                    ? status.value === "open" ? "bg-[#cc3333] text-white" : "bg-gray-400 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-150 border border-gray-200"
                                }`}
                              >
                                {status.label}
                              </button>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <div className={action ? "w-[65%]" : "w-full"}>
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-4 mb-2">
                        <FormLabel className="min-w-[80px]">Due Date</FormLabel>
                        {field.value && (
                          <span className="text-gray-500 italic" style={{ fontSize: '11px' }}>
                            {new Date(field.value).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-2">
                            {[
                              { label: "2d", days: 2 },
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
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                    field.value === dateString
                                      ? "bg-[#cc3333] text-white"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                          <div className="ml-auto">
                            <Input 
                              type="date" 
                              className="h-8 w-auto"
                              style={{ fontSize: '11px' }}
                              {...field} 
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} size="sm" className="rounded-full px-6">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isFormIncomplete} size="sm" className="rounded-full px-6">
                {isLoading ? "Saving..." : action ? "Save" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
