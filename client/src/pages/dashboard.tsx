import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatsCard from "@/components/stats-card";
import ActionCard from "@/components/action-card";
import ActionForm from "@/components/action-form";
import ProjectsDropdown from "@/components/projects-dropdown";
import ConfirmDialog from "@/components/confirm-dialog";
import { ActionWithRelations, Project } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const [isActionFormOpen, setIsActionFormOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionWithRelations | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [projectFilter, setProjectFilter] = useState<number | null>(null);
  const [disciplineFilter, setDisciplineFilter] = useState<string>("");
  const [phaseFilter, setPhaseFilter] = useState<string>("");
  const [pageSize, setPageSize] = useState<string>("25");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    actionId: number | null;
  }>({ open: false, actionId: null });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: currentActions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ["/api/actions", { status: statusFilter, projectId: projectFilter, discipline: disciplineFilter, phase: phaseFilter }],
    queryFn: ({ queryKey }) => {
      const [url, params] = queryKey as [string, any];
      const searchParams = new URLSearchParams();
      
      // Handle overdue as a special case - filter for open actions on client side
      if (params.status && params.status !== "overdue") {
        searchParams.append("status", params.status);
      } else if (params.status === "overdue") {
        searchParams.append("status", "open"); // Get open actions first, filter overdue on client
      }
      
      if (params.projectId) searchParams.append("projectId", params.projectId.toString());
      if (params.discipline) searchParams.append("discipline", params.discipline);
      if (params.phase) searchParams.append("phase", params.phase);
      
      const queryString = searchParams.toString();
      return fetch(`${url}${queryString ? `?${queryString}` : ""}`).then(res => res.json()).then((actions: any[]) => {
        // Filter for overdue actions on client side
        if (params.status === "overdue") {
          const now = new Date();
          return actions.filter((action: any) => 
            action.status === "open" && action.dueDate && new Date(action.dueDate) < now
          );
        }
        return actions;
      });
    },
  });

  // Get all actions for accurate filter counts
  const { data: allActions = [] } = useQuery({
    queryKey: ["/api/actions"],
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const completeActionMutation = useMutation({
    mutationFn: (actionId: number) => 
      apiRequest("PATCH", `/api/actions/${actionId}`, { status: "closed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
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
    console.log("handleCompleteAction called with actionId:", actionId);
    setConfirmDialog({ open: true, actionId });
  };

  const confirmCompleteAction = () => {
    console.log("confirmCompleteAction called, dialog state:", confirmDialog);
    if (confirmDialog.actionId) {
      console.log("Completing action", confirmDialog.actionId);
      completeActionMutation.mutate(confirmDialog.actionId);
      setConfirmDialog({ open: false, actionId: null });
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(statusFilter === status ? "" : status);
    setCurrentPage(1);
  };

  const handleDisciplineFilter = (discipline: string) => {
    setDisciplineFilter(disciplineFilter === discipline ? "" : discipline);
    setCurrentPage(1);
  };

  const handlePhaseFilter = (phase: string) => {
    setPhaseFilter(phaseFilter === phase ? "" : phase);
    setCurrentPage(1);
  };

  const handleProjectSelect = (project: Project) => {
    console.log("Selected project:", project.name);
    setProjectFilter(projectFilter === project.id ? null : project.id);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Calculate pagination
  const totalActions = currentActions.length;
  const actionsPerPage = pageSize === "All" ? totalActions : parseInt(pageSize);
  const totalPages = pageSize === "All" ? 1 : Math.ceil(totalActions / actionsPerPage);
  const startIndex = (currentPage - 1) * actionsPerPage;
  const endIndex = pageSize === "All" ? totalActions : startIndex + actionsPerPage;
  const paginatedActions = currentActions.slice(startIndex, endIndex);
  
  // Check if pagination is needed
  const showAllRecords = totalActions <= actionsPerPage;

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
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

        </div>

        {/* Filter Buttons in Three Rows */}
        <div className="space-y-3 mb-8">
          {/* Row 1: Status */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleStatusFilter("open")}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === "open" 
                  ? "bg-red-500 text-white" 
                  : statusFilter && statusFilter !== "open"
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              OPEN
            </button>
            <button
              onClick={() => handleStatusFilter("closed")}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === "closed" 
                  ? "bg-gray-500 text-white" 
                  : statusFilter && statusFilter !== "closed"
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : "bg-gray-500 text-white hover:bg-gray-600"
              }`}
            >
              CLOSED
            </button>
            <button
              onClick={() => handleStatusFilter("overdue")}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors border ${
                statusFilter === "overdue" 
                  ? "bg-red-600 text-white border-red-600" 
                  : statusFilter && statusFilter !== "overdue"
                    ? "bg-gray-100 text-gray-400 border-gray-300 cursor-default"
                    : "bg-gray-100 text-black border-red-500 hover:bg-gray-200"
              }`}
            >
              OVERDUE
            </button>
          </div>

          {/* Row 2: Discipline */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDisciplineFilter("operations")}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors border ${
                disciplineFilter === "operations" 
                  ? "bg-blue-600 text-white border-blue-800" 
                  : disciplineFilter && disciplineFilter !== "operations"
                    ? "bg-gray-100 text-gray-400 border-gray-300 cursor-default"
                    : "bg-blue-100 text-blue-800 border-blue-600 hover:bg-blue-200"
              }`}
            >
              OPERATIONS
            </button>
            <button
              onClick={() => handleDisciplineFilter("commercial")}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                disciplineFilter === "commercial" 
                  ? "bg-cyan-500 text-white" 
                  : disciplineFilter && disciplineFilter !== "commercial"
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : "bg-cyan-100 text-cyan-800 hover:bg-cyan-200"
              }`}
            >
              COMMERCIAL
            </button>
            <button
              onClick={() => handleDisciplineFilter("design")}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                disciplineFilter === "design" 
                  ? "bg-purple-500 text-white" 
                  : disciplineFilter && disciplineFilter !== "design"
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : "bg-purple-100 text-purple-800 hover:bg-purple-200"
              }`}
            >
              DESIGN
            </button>
            <button
              onClick={() => handleDisciplineFilter("she")}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                disciplineFilter === "she" 
                  ? "bg-orange-500 text-white" 
                  : disciplineFilter && disciplineFilter !== "she"
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : "bg-orange-100 text-orange-800 hover:bg-orange-200"
              }`}
            >
              SHE
            </button>
            <button
              onClick={() => handleDisciplineFilter("qa")}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                disciplineFilter === "qa" 
                  ? "bg-indigo-500 text-white" 
                  : disciplineFilter && disciplineFilter !== "qa"
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
              }`}
            >
              QA
            </button>
            <button
              onClick={() => handleDisciplineFilter("general")}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                disciplineFilter === "general" 
                  ? "bg-gray-600 text-white" 
                  : disciplineFilter && disciplineFilter !== "general"
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              GENERAL
            </button>
          </div>

          {/* Row 3: Phase */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handlePhaseFilter("tender")}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors border ${
                phaseFilter === "tender" 
                  ? "bg-blue-400 text-white border-blue-600" 
                  : phaseFilter && phaseFilter !== "tender"
                    ? "bg-gray-100 text-gray-400 border-gray-300 cursor-default"
                    : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
              }`}
            >
              TENDER
            </button>
            <button
              onClick={() => handlePhaseFilter("precon")}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors border ${
                phaseFilter === "precon" 
                  ? "bg-green-400 text-white border-green-600" 
                  : phaseFilter && phaseFilter !== "precon"
                    ? "bg-gray-100 text-gray-400 border-gray-300 cursor-default"
                    : "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
              }`}
            >
              PRECON
            </button>
            <button
              onClick={() => handlePhaseFilter("construction")}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors border ${
                phaseFilter === "construction" 
                  ? "bg-yellow-500 text-white border-yellow-700" 
                  : phaseFilter && phaseFilter !== "construction"
                    ? "bg-gray-100 text-gray-400 border-gray-300 cursor-default"
                    : "bg-yellow-50 text-yellow-800 border-yellow-400 hover:bg-yellow-100"
              }`}
            >
              CONSTRUCTION
            </button>
            <button
              onClick={() => handlePhaseFilter("aftercare")}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors border ${
                phaseFilter === "aftercare" 
                  ? "bg-gray-500 text-white border-gray-700" 
                  : phaseFilter && phaseFilter !== "aftercare"
                    ? "bg-gray-100 text-gray-400 border-gray-300 cursor-default"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              AFTERCARE
            </button>
            <button
              onClick={() => handlePhaseFilter("strategy")}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                phaseFilter === "strategy" 
                  ? "bg-black text-white" 
                  : phaseFilter && phaseFilter !== "strategy"
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              STRATEGY
            </button>
          </div>
        </div>

        {/* Active Filters Breadcrumb */}
        {(statusFilter !== "open" || disciplineFilter || phaseFilter || projectFilter) && (
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 border-l-4 border-blue-400 mb-4">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Filters:</span>
              {statusFilter !== "open" && <span className="font-medium">{statusFilter}</span>}
              {disciplineFilter && <span className="font-medium">{disciplineFilter}</span>}
              {phaseFilter && <span className="font-medium">{phaseFilter}</span>}
              {projectFilter && <span className="font-medium">{projects?.find(p => p.id === projectFilter)?.name}</span>}
            </div>
            <button
              onClick={() => {
                setStatusFilter("open");
                setDisciplineFilter("");
                setPhaseFilter("");
                setProjectFilter(null);
                setCurrentPage(1);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Current Actions */}
      <Card className="material-shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-action-text-primary">
            Current Actions ({totalActions})
            {(statusFilter || disciplineFilter || phaseFilter || projectFilter) && (
              <span className="text-gray-500">
                {' - '}
                {[
                  statusFilter && statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1),
                  disciplineFilter && disciplineFilter.charAt(0).toUpperCase() + disciplineFilter.slice(1),
                  phaseFilter && phaseFilter.charAt(0).toUpperCase() + phaseFilter.slice(1),
                  projectFilter && projects?.find(p => p.id === projectFilter)?.name
                ].filter(Boolean).join(', ')}
              </span>
            )}
          </h2>
          <ProjectsDropdown onProjectSelect={handleProjectSelect} selectedProjectId={projectFilter} />
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
              {/* Actions List */}
              <div className="divide-y divide-gray-200">
                {paginatedActions.map((action: ActionWithRelations, index: number) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    onEdit={handleEditAction}
                    onComplete={handleCompleteAction}
                    isEven={index % 2 === 0}
                  />
                ))}
              </div>
              
              {/* Pagination Controls */}
              <div className="p-4 border-t bg-gray-50">
                {showAllRecords ? (
                  /* Show simple message when all records are displayed */
                  <div className="text-center text-sm text-gray-600">
                    Showing all {totalActions} action{totalActions !== 1 ? 's' : ''}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    {/* Left side - Navigation */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage <= 1}
                        className={`${currentPage <= 1 ? 'text-gray-400 cursor-not-allowed' : ''}`}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage >= totalPages}
                        className={`${currentPage >= totalPages ? 'text-gray-400 cursor-not-allowed' : ''}`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Right side - Page size selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Show:</span>
                      <Select value={pageSize} onValueChange={handlePageSizeChange}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="75">75</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-600">
                        of {totalActions} actions
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Show range info only when paginated */}
                {!showAllRecords && pageSize !== "All" && totalActions > 0 && (
                  <div className="text-center mt-2 text-xs text-gray-500">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalActions)} of {totalActions}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Form Modal */}
      <ActionForm
        isOpen={isActionFormOpen}
        action={selectedAction}
        onClose={() => setIsActionFormOpen(false)}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={() => setConfirmDialog({ open: false, actionId: null })}
        onConfirm={confirmCompleteAction}
        title="Mark Action Complete"
        description="Are you sure you want to mark this action as complete? This action cannot be undone."
      />
    </div>
  );
}