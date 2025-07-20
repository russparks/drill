import { Edit, Check, User, Calendar, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionWithRelations } from "@shared/schema";
import { format, differenceInDays, isPast } from "date-fns";

interface ActionCardProps {
  action: ActionWithRelations;
  onEdit: (action: ActionWithRelations) => void;
  onComplete: (actionId: number) => void;
}

export default function ActionCard({ action, onEdit, onComplete }: ActionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800";
      case "closed": return "bg-gray-200 text-gray-700";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDisciplineColor = (discipline: string) => {
    switch (discipline) {
      case "tender": return "bg-blue-100 text-blue-800";
      case "precon": return "bg-blue-100 text-blue-800 border border-blue-600";
      case "production": return "bg-green-100 text-green-800 border border-green-600";
      case "design": return "bg-purple-100 text-purple-800";
      case "commercial": return "bg-cyan-100 text-cyan-800";
      case "aftercare": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  const formatDiscipline = (discipline: string) => {
    return discipline.charAt(0).toUpperCase() + discipline.slice(1);
  };

  const getDaysRemaining = (dueDate: string | null) => {
    if (!dueDate) return null;
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days === 0) return "Due today";
    if (days === 1) return "1 day remaining";
    if (days > 1) return `${days} days remaining`;
    if (days === -1) return "1 day overdue";
    return `${Math.abs(days)} days overdue`;
  };

  const getDueDateColor = (dueDate: string | null) => {
    if (!dueDate) return "";
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return "text-red-600"; // overdue
    if (days <= 3) return "text-orange-600"; // due soon
    return "text-gray-600"; // normal
  };

  return (
    <div className="action-card border-b border-gray-100 last:border-b-0 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-medium text-action-text-primary flex-1">{action.title}</h3>
            <div className="flex items-center space-x-2 ml-4">
              <Badge className={`status-badge ${getStatusColor(action.status)}`}>
                {formatStatus(action.status)}
              </Badge>
              <Badge className={`discipline-badge ${getDisciplineColor(action.discipline)}`}>
                {formatDiscipline(action.discipline)}
              </Badge>
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
                Due: {format(new Date(action.dueDate), "MMM dd, yyyy")}
              </span>
            )}
            {action.dueDate && (
              <span className={`flex items-center font-medium ${getDueDateColor(action.dueDate)}`}>
                {getDaysRemaining(action.dueDate)}
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
        
        <div className="flex items-center space-x-2 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(action)}
            className="p-2 text-action-text-secondary hover:text-primary rounded-lg hover:bg-blue-50"
            title="Edit Action"
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          {action.status !== "closed" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onComplete(action.id)}
              className="p-2 text-action-text-secondary hover:text-action-secondary rounded-lg hover:bg-green-50"
              title="Mark Complete"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
