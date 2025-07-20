import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, AlertCircle, Clock, CheckCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StatsCard from "@/components/stats-card";
import ActionCard from "@/components/action-card";
import ActionForm from "@/components/action-form";
import ProjectsDropdown from "@/components/projects-dropdown";
import { ActionWithRelations, Project } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [isActionFormOpen, setIsActionFormOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionWithRelations | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: recentActions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ["/api/actions", { status: statusFilter }],
    queryFn: ({ queryKey }) => {
      const [url, params] = queryKey;
      const searchParams = new URLSearchParams();
      
      if (params.status) searchParams.append("status", params.status);
      
      const queryString = searchParams.toString();
      return fetch(`${url}${queryString ? `?${queryString}` : ""}`).then(res => res.json());
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

  const handleCompleteAction = async (actionId: number) => {
    // This would be handled by a mutation
    console.log("Complete action", actionId);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(statusFilter === status ? "" : status);
  };

  const handleProjectSelect = (project: Project) => {
    console.log("Selected project:", project.name);
  };

  if (statsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
      <div className="mb-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-action-text-primary">Dashboard</h1>
            <p className="mt-1 text-sm text-action-text-secondary">
              Track and manage construction actions across all projects
            </p>
          </div>
          <div className="mt-4 md:mt-0 md:ml-4">
            <Button onClick={handleCreateAction} className="material-shadow">
              <Plus className="h-4 w-4 mr-2" />
              New Action
            </Button>
          </div>
        </div>

        {/* Stats Cards and Projects */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <StatsCard
            title="Open"
            value={stats?.open || 0}
            icon={AlertCircle}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
            onClick={() => handleStatusFilter("open")}
            isActive={statusFilter === "open"}
          />
          <StatsCard
            title="In Progress"
            value={stats?.inProgress || 0}
            icon={Clock}
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-100"
            onClick={() => handleStatusFilter("in-progress")}
            isActive={statusFilter === "in-progress"}
          />
          <StatsCard
            title="Closed"
            value={stats?.closed || 0}
            icon={CheckCircle}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
            onClick={() => handleStatusFilter("closed")}
            isActive={statusFilter === "closed"}
          />
          <StatsCard
            title="Team Members"
            value={stats?.teamMembers || 0}
            icon={Users}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <div className="ml-auto">
            <ProjectsDropdown onProjectSelect={handleProjectSelect} />
          </div>
        </div>
      </div>

      {/* Recent Actions */}
      <Card className="material-shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-action-text-primary">Recent Actions</h2>
        </div>

        <CardContent className="p-0">
          {actionsLoading ? (
            <div className="p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3 mb-6">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : recentActions.length === 0 ? (
            <div className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No actions yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first action.</p>
              <Button onClick={handleCreateAction}>
                <Plus className="h-4 w-4 mr-2" />
                Create Action
              </Button>
            </div>
          ) : (
            <div>
              {(recentActions as ActionWithRelations[]).slice(0, 10).map((action) => (
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
