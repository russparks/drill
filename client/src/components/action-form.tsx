import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertActionSchema, type ActionWithRelations, type User, type Project } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  assigneeId: z.number().optional(),
  projectId: z.number().optional(),
  dueDate: z.string().optional(),
});

type ActionFormData = z.infer<typeof actionFormSchema>;

interface ActionFormProps {
  isOpen: boolean;
  onClose: () => void;
  action?: ActionWithRelations | null;
}

export default function ActionForm({ isOpen, onClose, action }: ActionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const onSubmit = (data: ActionFormData) => {
    if (action) {
      updateActionMutation.mutate(data);
    } else {
      createActionMutation.mutate(data);
    }
  };

  const isLoading = createActionMutation.isPending || updateActionMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {action ? "Edit Action" : "Create New Action"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discipline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discipline</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select discipline" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="precon">Precon</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="misc">Misc</SelectItem>
                      </SelectContent>
                    </Select>
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
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select person" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(users as User[]).map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      value={field.value?.toString() || ""}
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
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
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
                    <Input type="date" {...field} />
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
