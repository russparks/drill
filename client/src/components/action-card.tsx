import { Edit, Check, User, Calendar, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionWithRelations } from "@shared/schema";
import { format, differenceInBusinessDays } from "date-fns";

interface ActionCardProps {
  action: ActionWithRelations;
  onEdit: (action: ActionWithRelations) => void;
  onComplete: (actionId: number) => void;
  isEven: boolean;
}

export default function ActionCard({ action, onEdit, onComplete, isEven }: ActionCardProps) {
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  const formatDiscipline = (discipline: string) => {
    return discipline.charAt(0).toUpperCase() + discipline.slice(1);
  };

  const getStatusIndicator = (status: string) => {
    if (status === "open") {
      return <div className="w-2 h-2 rounded-full bg-red-500" />;
    }
    return (
      <Badge className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5">
        {formatStatus(status)}
      </Badge>
    );
  };

  const getDisciplineColor = (discipline: string) => {
    switch (discipline) {
      case "operations": return "bg-blue-100 text-blue-800 border border-blue-600";
      case "commercial": return "bg-cyan-100 text-cyan-800";
      case "design": return "bg-purple-100 text-purple-800";
      case "she": return "bg-orange-100 text-orange-800";
      case "qa": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "tender": return "bg-blue-50 text-blue-700 border border-blue-300";
      case "precon": return "bg-green-50 text-green-700 border border-green-300";
      case "construction": return "bg-yellow-50 text-yellow-800 border border-yellow-400";
      case "aftercare": return "bg-gray-50 text-gray-700 border border-gray-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getWorkingDaysRemaining = (dueDate: string | null) => {
    if (!dueDate) return null;
    const days = differenceInBusinessDays(new Date(dueDate), new Date());
    if (days >= 0) {
      return { text: `(${days}d)`, color: "text-black" };
    } else {
      return { text: `(${days})`, color: "text-red-600" };
    }
  };

  const workingDays = getWorkingDaysRemaining(action.dueDate);

  return (
    <div className={`action-card border-b border-gray-100 last:border-b-0 p-4 ${isEven ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-action-text-primary flex-1 mr-4">{action.title}</h3>
            <div className="flex items-center space-x-2">
              {getStatusIndicator(action.status)}
              <Badge className={`discipline-badge ${getDisciplineColor(action.discipline)} text-xs px-2 py-0.5`}>
                {formatDiscipline(action.discipline).toUpperCase()}
              </Badge>
              <Badge className={`phase-badge ${getPhaseColor(action.phase)} text-xs px-2 py-0.5`}>
                {action.phase?.toUpperCase()}
              </Badge>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(action)}
                  className="p-1 text-action-text-secondary hover:text-primary rounded hover:bg-blue-50 h-6 w-6"
                  title="Edit Action"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                
                {action.status !== "closed" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onComplete(action.id)}
                    className="p-1 text-action-text-secondary hover:text-green-600 rounded hover:bg-green-50 h-6 w-6"
                    title="Mark Complete"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {action.description && (
            <p className="text-sm text-action-text-secondary mb-3">{action.description}</p>
          )}
          
          <div className="flex flex-wrap items-center space-x-4 text-xs text-action-text-secondary">
            {action.assignee && (
              <span className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                {action.assignee.name}
              </span>
            )}
            {action.dueDate && (
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {format(new Date(action.dueDate), "MMM dd, yyyy")}
                {workingDays && (
                  <span className={`ml-2 font-medium ${workingDays.color}`}>
                    {workingDays.text}
                  </span>
                )}
              </span>
            )}
            {action.project && (
              <span className="flex items-center">
                <Building className="w-3 h-3 mr-1" />
                {action.project.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}