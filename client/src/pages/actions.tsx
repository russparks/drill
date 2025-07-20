import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ActionCard from "@/components/action-card";
import ActionForm from "@/components/action-form";
import { ActionWithRelations } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Actions() {
  const [isActionFormOpen, setIsActionFormOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionWithRelations | null>(null);
  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["/api/actions", { search, discipline: disciplineFilter, status: statusFilter }],
    queryFn: ({ queryKey }) => {
      const [url, params] = queryKey;
      const searchParams = new URLSearchParams();
      
      if (params.search) searchParams.append("search", params.search);
      if (params.discipline) searchParams.append("discipline", params.discipline);
      if (params.status) searchParams.append("status", params.status);
      
      const queryString = searchParams.toString();
      return fetch(`${url}${queryString ? `?${queryString}` : ""}`).then(res => res.json());
    },
  });

  const completeActionMutation = useMutation({
    mutationFn: async (actionId: number) => {
      return apiRequest("PATCH", `/api/actions/${actionId}`, { status: "closed" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Action marked as complete",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update action",
        variant: "destructive",
      });
    },
  });

  const handleCreateAction = () => {
    setSelectedAction(null);
    setIsActionFormOpen(true);
  };

  const handleEditAction = (action: ActionWithRelations) => {
    setSelectedAction(action);
    setIsActionFormOpen(true);
  };

  const handleCompleteAction = (actionId: number) => {
    completeActionMutation.mutate(actionId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
      <div className="mb-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-action-text-primary">Actions</h1>
            <p className="mt-1 text-sm text-action-text-secondary">
              Manage all construction actions
            </p>
          </div>
          <div className="mt-4 md:mt-0 md:ml-4">
            <Button onClick={handleCreateAction} className="material-shadow">
              <Plus className="h-4 w-4 mr-2" />
              New Action
            </Button>
          </div>
        </div>
      </div>

      <Card className="material-shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium text-action-text-primary">All Actions</h2>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-action-text-secondary" />
                </div>
                <Input
                  type="text"
                  placeholder="Search actions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              {/* Filters */}
              <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Disciplines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Disciplines</SelectItem>
                  <SelectItem value="precon">Precon</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="misc">Misc</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-3 mb-6 pb-6 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <div className="flex space-x-4">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              ))}
            </div>
          ) : (actions as ActionWithRelations[]).length === 0 ? (
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No actions found</h3>
              <p className="text-gray-600 mb-4">
                {search || disciplineFilter || statusFilter
                  ? "Try adjusting your filters or search terms."
                  : "Get started by creating your first action."}
              </p>
              {!search && !disciplineFilter && !statusFilter && (
                <Button onClick={handleCreateAction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Action
                </Button>
              )}
            </div>
          ) : (
            <div>
              {(actions as ActionWithRelations[]).map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onEdit={handleEditAction}
                  onComplete={handleCompleteAction}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ActionForm
        isOpen={isActionFormOpen}
        onClose={() => setIsActionFormOpen(false)}
        action={selectedAction}
      />

      {/* Desktop FAB */}
      <Button
        onClick={handleCreateAction}
        className="hidden md:flex fixed bottom-6 right-6 w-14 h-14 rounded-full material-shadow-lg"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
