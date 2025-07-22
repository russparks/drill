import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, AlertCircle, ChevronLeft, ChevronRight, Filter, X, TrendingUp, BarChart3, PieChart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatsCard from "@/components/stats-card";
import ActionCard from "@/components/action-card";
import ActionForm from "@/components/action-form";
import ProjectsDropdown from "@/components/projects-dropdown";
import ConfirmDialog from "@/components/confirm-dialog";
import { ActionWithRelations, Project } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, AreaChart, Area } from 'recharts';

export default function Dashboard() {
  const [isActionFormOpen, setIsActionFormOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionWithRelations | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [projectFilter, setProjectFilter] = useState<number | null>(null);
  const [disciplineFilter, setDisciplineFilter] = useState<string>("");
  const [phaseFilter, setPhaseFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [pageSize, setPageSize] = useState<string>("20");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    actionId: number | null;
  }>({ open: false, actionId: null });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: currentActions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ["/api/actions", { status: statusFilter, projectId: projectFilter, discipline: disciplineFilter, phase: phaseFilter, assignee: assigneeFilter }],
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
      if (params.assignee) searchParams.append("assignee", params.assignee);
      
      const queryString = searchParams.toString();
      return fetch(`${url}${queryString ? `?${queryString}` : ""}`).then(res => res.json()).then((actions: any[]) => {
        // Filter for overdue actions on client side
        let filteredActions = actions;
        if (params.status === "overdue") {
          const now = new Date();
          filteredActions = actions.filter((action: any) => 
            action.status === "open" && action.dueDate && new Date(action.dueDate) < now
          );
        }
        
        // Sort by nearest due date (earliest first)
        return filteredActions.sort((a: any, b: any) => {
          // Actions without due dates go to the end
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          
          const dateA = new Date(a.dueDate);
          const dateB = new Date(b.dueDate);
          return dateA.getTime() - dateB.getTime();
        });
      });
    },
  });

  // Get all actions for accurate filter counts
  const { data: allActions = [] } = useQuery({
    queryKey: ["/api/actions"],
  });

  const { data: projects } = useQuery<Project[]>({
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

  const handleAssigneeFilter = (assignee: string) => {
    setAssigneeFilter(assigneeFilter === assignee ? "" : assignee);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-8">
      <div className="mb-4">
        {/* Filter Buttons in Three Rows */}
        <div className="space-y-0.5 mb-4">
          {/* Row 1: Status */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 font-medium w-20 pl-4">Status:</div>
            <div className="border border-dotted border-gray-200 rounded px-3 py-2 flex flex-wrap items-center gap-3" style={{"borderWidth": "1px", "borderStyle": "dotted"}}>
            <button
              onClick={() => handleStatusFilter("open")}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                statusFilter === "open" 
                  ? "bg-red-500 text-white" 
                  : "bg-[#cc3333] text-white hover:bg-red-700"
              }`}
            >
              OPEN
              {statusFilter === "open" && <span className="text-xs">×</span>}
            </button>
            <button
              onClick={() => handleStatusFilter("closed")}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                statusFilter === "closed" 
                  ? "bg-gray-500 text-white" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              CLOSED
              {statusFilter === "closed" && <span className="text-xs">×</span>}
            </button>
            <button
              onClick={() => handleStatusFilter("overdue")}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                statusFilter === "overdue" 
                  ? "bg-[#cc3333]/75 text-white" 
                  : "bg-red-100 text-red-800 hover:bg-red-200"
              }`}
            >
              OVERDUE
              {statusFilter === "overdue" && <span className="text-xs">×</span>}
            </button>
            </div>
            {statusFilter && (
              <div 
                className="ml-2 flex items-center gap-2 group cursor-pointer"
                onClick={() => setStatusFilter("")}
              >
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 italic group-hover:line-through transition-all">
                  {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </span>
              </div>
            )}
          </div>

          {/* Row 2: Discipline */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 font-medium w-20 pl-4">Discipline:</div>
            <div className="border border-dotted border-gray-200 rounded px-3 py-2 flex flex-wrap items-center gap-3" style={{"borderWidth": "1px", "borderStyle": "dotted"}}>
            <button
              onClick={() => handleDisciplineFilter("operations")}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors border flex items-center gap-1 ${
                disciplineFilter === "operations" 
                  ? "bg-blue-600 text-white border-blue-800" 
                  : "bg-blue-100 text-blue-800 border-blue-600 hover:bg-blue-200"
              }`}
            >
              OPERATIONS
              {disciplineFilter === "operations" && <span className="text-xs">×</span>}
            </button>
            <button
              onClick={() => handleDisciplineFilter("commercial")}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                disciplineFilter === "commercial" 
                  ? "bg-cyan-500 text-white" 
                  : "bg-cyan-100 text-cyan-800 hover:bg-cyan-200"
              }`}
            >
              COMMERCIAL
              {disciplineFilter === "commercial" && <span className="text-xs">×</span>}
            </button>
            <button
              onClick={() => handleDisciplineFilter("design")}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                disciplineFilter === "design" 
                  ? "bg-purple-500 text-white" 
                  : "bg-purple-100 text-purple-800 hover:bg-purple-200"
              }`}
            >
              DESIGN
              {disciplineFilter === "design" && <span className="text-xs">×</span>}
            </button>
            <button
              onClick={() => handleDisciplineFilter("she")}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                disciplineFilter === "she" 
                  ? "bg-orange-500 text-white" 
                  : "bg-orange-100 text-orange-800 hover:bg-orange-200"
              }`}
            >
              SHE
              {disciplineFilter === "she" && <span className="text-xs">×</span>}
            </button>
            <button
              onClick={() => handleDisciplineFilter("qa")}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                disciplineFilter === "qa" 
                  ? "bg-indigo-500 text-white" 
                  : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
              }`}
            >
              QA
              {disciplineFilter === "qa" && <span className="text-xs">×</span>}
            </button>
            <button
              onClick={() => handleDisciplineFilter("general")}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                disciplineFilter === "general" 
                  ? "bg-gray-600 text-white" 
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              GENERAL
              {disciplineFilter === "general" && <span className="text-xs">×</span>}
            </button>
            </div>
            {disciplineFilter && (
              <div 
                className="ml-2 flex items-center gap-2 group cursor-pointer"
                onClick={() => setDisciplineFilter("")}
              >
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 italic group-hover:line-through transition-all">
                  {disciplineFilter.charAt(0).toUpperCase() + disciplineFilter.slice(1)}
                </span>
              </div>
            )}
          </div>

          {/* Row 3: Phase */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 font-medium w-20 pl-4">Process:</div>
            <div className="border border-dotted border-gray-200 rounded px-3 py-2 flex flex-wrap items-center gap-3" style={{"borderWidth": "1px", "borderStyle": "dotted"}}>
            <button
              onClick={() => handlePhaseFilter("tender")}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors border flex items-center gap-1 ${
                phaseFilter === "tender" 
                  ? "bg-blue-400 text-white border-blue-600" 
                  : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
              }`}
            >
              TENDER
              {phaseFilter === "tender" && <span className="text-xs">×</span>}
            </button>
            <button
              onClick={() => handlePhaseFilter("precon")}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors border flex items-center gap-1 ${
                phaseFilter === "precon" 
                  ? "bg-green-400 text-white border-green-600" 
                  : "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
              }`}
            >
              PRECON
              {phaseFilter === "precon" && <span className="text-xs">×</span>}
            </button>
            <button
              onClick={() => handlePhaseFilter("construction")}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors border flex items-center gap-1 ${
                phaseFilter === "construction" 
                  ? "bg-yellow-500 text-white border-yellow-700" 
                  : "bg-yellow-50 text-yellow-800 border-yellow-400 hover:bg-yellow-100"
              }`}
            >
              CONSTRUCTION
              {phaseFilter === "construction" && <span className="text-xs">×</span>}
            </button>
            <button
              onClick={() => handlePhaseFilter("aftercare")}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors border flex items-center gap-1 ${
                phaseFilter === "aftercare" 
                  ? "bg-gray-500 text-white border-gray-700" 
                  : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              AFTERCARE
              {phaseFilter === "aftercare" && <span className="text-xs">×</span>}
            </button>
            <button
              onClick={() => handlePhaseFilter("strategy")}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                phaseFilter === "strategy" 
                  ? "bg-black text-white" 
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              STRATEGY
              {phaseFilter === "strategy" && <span className="text-xs">×</span>}
            </button>
            </div>
            {phaseFilter && (
              <div 
                className="ml-2 flex items-center gap-2 group cursor-pointer"
                onClick={() => setPhaseFilter("")}
              >
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-500 italic group-hover:line-through transition-all">
                  {phaseFilter.charAt(0).toUpperCase() + phaseFilter.slice(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Chart 1: Weekly Action Trends - Line Chart */}
          <Card className="material-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Weekly Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={(() => {
                  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                  return weeks.map((week, idx) => ({
                    week,
                    opened: Math.floor(Math.random() * 10) + 5,
                    closed: Math.floor(Math.random() * 8) + 3,
                  }));
                })()}>
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="opened" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="closed" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Actions by Discipline - Bar Chart */}
          <Card className="material-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                By Discipline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={(() => {
                  const disciplines = ['Ops', 'Comm', 'Des', 'SHE', 'QA'];
                  return disciplines.map(disc => ({
                    name: disc,
                    count: (allActions as ActionWithRelations[]).filter((action: ActionWithRelations) => 
                      action.discipline === disc.toLowerCase() || 
                      (disc === 'Ops' && action.discipline === 'operations') ||
                      (disc === 'Comm' && action.discipline === 'commercial') ||
                      (disc === 'Des' && action.discipline === 'design') ||
                      (disc === 'SHE' && action.discipline === 'she') ||
                      (disc === 'QA' && action.discipline === 'qa')
                    ).length
                  }));
                })()}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 3: Project Status Distribution - Stacked Bar Chart */}
          <Card className="material-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PieChart className="h-4 w-4 text-orange-600" />
                Project Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart layout="horizontal" data={(() => {
                  const statuses = ['tender', 'precon', 'construction', 'aftercare'];
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6b7280'];
                  return [{
                    name: 'Projects',
                    tender: (projects || []).filter(p => p.status === 'tender').length,
                    precon: (projects || []).filter(p => p.status === 'precon').length,
                    construction: (projects || []).filter(p => p.status === 'construction').length,
                    aftercare: (projects || []).filter(p => p.status === 'aftercare').length,
                  }];
                })()}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="tender" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="precon" stackId="a" fill="#10b981" />
                  <Bar dataKey="construction" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="aftercare" stackId="a" fill="#6b7280" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 4: Action Completion Rate - Area Chart */}
          <Card className="material-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={(() => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr'];
                  return months.map((month, idx) => ({
                    month,
                    rate: Math.floor(Math.random() * 30) + 60 + (idx * 5), // Trending upward
                  }));
                })()}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: '12px' }} formatter={(value) => [`${value}%`, 'Rate']} />
                  <Area type="monotone" dataKey="rate" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Current Actions */}
      <Card className="material-shadow">
        <div className="pl-4 pr-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-action-text-primary">
            Current Actions ({totalActions})
            {(statusFilter || disciplineFilter || phaseFilter || projectFilter || assigneeFilter) && (
              <span className="text-gray-500 text-xs">
                {' - '}
                <span className="inline-flex items-center gap-2">
                  {statusFilter && (
                    <span className="relative">
                      {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                      <div className={`absolute -bottom-0.5 left-0 right-0 h-0.5 ${
                        statusFilter === 'open' ? 'bg-[#cc3333]' : 
                        statusFilter === 'closed' ? 'bg-gray-500' : 
                        'bg-[#cc3333]/75'
                      }`} />
                    </span>
                  )}
                  {disciplineFilter && (
                    <>
                      {statusFilter && <span>-</span>}
                      <span className="relative">
                        {disciplineFilter.charAt(0).toUpperCase() + disciplineFilter.slice(1)}
                        <div className={`absolute -bottom-0.5 left-0 right-0 h-0.5 ${
                          disciplineFilter === 'operations' ? 'bg-blue-600' :
                          disciplineFilter === 'commercial' ? 'bg-cyan-500' :
                          disciplineFilter === 'design' ? 'bg-purple-500' :
                          disciplineFilter === 'she' ? 'bg-orange-500' :
                          disciplineFilter === 'qa' ? 'bg-indigo-500' :
                          disciplineFilter === 'general' ? 'bg-gray-600' :
                          'bg-gray-500'
                        }`} />
                      </span>
                    </>
                  )}
                  {phaseFilter && (
                    <>
                      {(statusFilter || disciplineFilter) && <span>-</span>}
                      <span className="relative">
                        {phaseFilter.charAt(0).toUpperCase() + phaseFilter.slice(1)}
                        <div className={`absolute -bottom-0.5 left-0 right-0 h-0.5 ${
                          phaseFilter === 'tender' ? 'bg-blue-400' :
                          phaseFilter === 'precon' ? 'bg-green-400' :
                          phaseFilter === 'construction' ? 'bg-yellow-500' :
                          phaseFilter === 'aftercare' ? 'bg-gray-500' :
                          phaseFilter === 'strategy' ? 'bg-black' :
                          'bg-gray-500'
                        }`} />
                      </span>
                    </>
                  )}
                  {projectFilter && (
                    <>
                      {(statusFilter || disciplineFilter || phaseFilter) && <span>-</span>}
                      <span 
                        className="relative cursor-pointer hover:line-through transition-all"
                        onClick={() => setProjectFilter(null)}
                        title="Click to remove project filter"
                      >
                        {projects?.find(p => p.id === projectFilter)?.name}
                        <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gray-500" />
                      </span>
                    </>
                  )}
                  {assigneeFilter && (
                    <>
                      {(statusFilter || disciplineFilter || phaseFilter || projectFilter) && <span>-</span>}
                      <span 
                        className="relative cursor-pointer hover:line-through transition-all"
                        onClick={() => setAssigneeFilter("")}
                        title="Click to remove assignee filter"
                      >
                        {assigneeFilter}
                        <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gray-500" />
                      </span>
                    </>
                  )}
                </span>
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
                    onAssigneeClick={handleAssigneeFilter}
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
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
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