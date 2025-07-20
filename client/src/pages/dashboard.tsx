import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, AlertCircle, Clock, CheckCircle, Users, HardHat, Hammer, Palette, DollarSign, MoreHorizontal } from "lucide-react";
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
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [projectFilter, setProjectFilter] = useState<number | null>(null);
  const [disciplineFilter, setDisciplineFilter] = useState<string>("");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: currentActions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ["/api/actions", { status: statusFilter, projectId: projectFilter, discipline: disciplineFilter }],
    queryFn: ({ queryKey }) => {
      const [url, params] = queryKey;
      const searchParams = new URLSearchParams();
      
      if (params.status) searchParams.append("status", params.status);
      if (params.projectId) searchParams.append("projectId", params.projectId.toString());
      if (params.discipline) searchParams.append("discipline", params.discipline);
      
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

  const handleDisciplineFilter = (discipline: string) => {
    setDisciplineFilter(disciplineFilter === discipline ? "" : discipline);
  };

  const handleProjectSelect = (project: Project) => {
    console.log("Selected project:", project.name);
    setProjectFilter(projectFilter === project.id ? null : project.id);
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
            {/* Removed dashboard title and subtitle */}
          </div>
          <div className="mt-4 md:mt-0 md:ml-4">
            <Button onClick={handleCreateAction} className="material-shadow">
              <Plus className="h-4 w-4 mr-2" />
              New Action
            </Button>
          </div>
        </div>

        {/* Filter Buttons in Two Rows */}
        <div className="space-y-3 mb-8">
          {/* Row 1: open - precon - production - design - commercial */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleStatusFilter("open")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === "open" 
                  ? "bg-red-500 text-white" 
                  : "bg-red-100 text-red-800 hover:bg-red-200"
              }`}
            >
              <span>Open</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                statusFilter === "open"
                  ? "bg-red-400 text-white"
                  : "bg-red-200 text-red-800"
              }`}>
                {stats?.open || 0}
              </span>
            </button>
            <button
              onClick={() => handleDisciplineFilter("precon")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                disciplineFilter === "precon" 
                  ? "bg-blue-600 text-white border-blue-800" 
                  : "bg-blue-100 text-blue-800 border-blue-600 hover:bg-blue-200"
              }`}
            >
              <span>Precon</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                disciplineFilter === "precon"
                  ? "bg-blue-500 text-white"
                  : "bg-blue-200 text-blue-800"
              }`}>
                {currentActions.filter((a: any) => a.discipline === "precon").length}
              </span>
            </button>
            <button
              onClick={() => handleDisciplineFilter("production")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                disciplineFilter === "production" 
                  ? "bg-green-600 text-white border-green-800" 
                  : "bg-green-100 text-green-800 border-green-600 hover:bg-green-200"
              }`}
            >
              <span>Production</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                disciplineFilter === "production"
                  ? "bg-green-500 text-white"
                  : "bg-green-200 text-green-800"
              }`}>
                {currentActions.filter((a: any) => a.discipline === "production").length}
              </span>
            </button>
            <button
              onClick={() => handleDisciplineFilter("design")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                disciplineFilter === "design" 
                  ? "bg-purple-500 text-white" 
                  : "bg-purple-100 text-purple-800 hover:bg-purple-200"
              }`}
            >
              <span>Design</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                disciplineFilter === "design"
                  ? "bg-purple-400 text-white"
                  : "bg-purple-200 text-purple-800"
              }`}>
                {currentActions.filter((a: any) => a.discipline === "design").length}
              </span>
            </button>
            <button
              onClick={() => handleDisciplineFilter("commercial")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                disciplineFilter === "commercial" 
                  ? "bg-cyan-500 text-white" 
                  : "bg-cyan-100 text-cyan-800 hover:bg-cyan-200"
              }`}
            >
              <span>Commercial</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                disciplineFilter === "commercial"
                  ? "bg-cyan-400 text-white"
                  : "bg-cyan-200 text-cyan-800"
              }`}>
                {currentActions.filter((a: any) => a.discipline === "commercial").length}
              </span>
            </button>
          </div>

          {/* Row 2: closed - tender - aftercare - projects dropdown */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleStatusFilter("closed")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === "closed" 
                  ? "bg-gray-500 text-white" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <span>Closed</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                statusFilter === "closed"
                  ? "bg-gray-400 text-white"
                  : "bg-gray-300 text-gray-700"
              }`}>
                {stats?.closed || 0}
              </span>
            </button>
            <button
              onClick={() => handleDisciplineFilter("tender")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                disciplineFilter === "tender" 
                  ? "bg-blue-400 text-white" 
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"
              }`}
            >
              <span>Tender</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                disciplineFilter === "tender"
                  ? "bg-blue-300 text-white"
                  : "bg-blue-200 text-blue-800"
              }`}>
                {currentActions.filter((a: any) => a.discipline === "tender").length}
              </span>
            </button>
            <button
              onClick={() => handleDisciplineFilter("aftercare")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                disciplineFilter === "aftercare" 
                  ? "bg-green-500 text-white" 
                  : "bg-green-100 text-green-800 hover:bg-green-200"
              }`}
            >
              <span>Aftercare</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                disciplineFilter === "aftercare"
                  ? "bg-green-400 text-white"
                  : "bg-green-200 text-green-800"
              }`}>
                {currentActions.filter((a: any) => a.discipline === "aftercare").length}
              </span>
            </button>
            
            <ProjectsDropdown onProjectSelect={handleProjectSelect} selectedProjectId={projectFilter} />
          </div>
        </div>
      </div>

      {/* Current Actions */}
      <Card className="material-shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-action-text-primary">Current Actions</h2>
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
          ) : currentActions.length === 0 ? (
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
              {(currentActions as ActionWithRelations[]).slice(0, 10).map((action) => (
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
