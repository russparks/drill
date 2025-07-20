import { Edit, Check, User, Calendar, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionWithRelations } from "@shared/schema";
import { format } from "date-fns";

interface ActionCardProps {
  action: ActionWithRelations;
  onEdit: (action: ActionWithRelations) => void;
  onComplete: (actionId: number) => void;
}

export default function ActionCard({ action, onEdit, onComplete }: ActionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800";
      case "in-progress": return "bg-yellow-100 text-yellow-800";
      case "closed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDisciplineColor = (discipline: string) => {
    switch (discipline) {
      case "precon": return "bg-purple-100 text-purple-800";
      case "production": return "bg-blue-100 text-blue-800";
      case "design": return "bg-pink-100 text-pink-800";
      case "commercial": return "bg-green-100 text-green-800";
      case "misc": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  const formatDiscipline = (discipline: string) => {
    return discipline.charAt(0).toUpperCase() + discipline.slice(1);
  };

  return (
    <div className="action-card border-b border-gray-100 last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-sm font-medium text-action-text-primary">{action.title}</h3>
            <Badge className={`status-badge ${getStatusColor(action.status)}`}>
              {formatStatus(action.status)}
            </Badge>
            <Badge className={`discipline-badge ${getDisciplineColor(action.discipline)}`}>
              {formatDiscipline(action.discipline)}
            </Badge>
          </div>
          
          {action.description && (
            <p className="text-sm text-action-text-secondary mb-3">{action.description}</p>
          )}
          
          <div className="flex flex-wrap items-center space-x-4 text-xs text-action-text-secondary">
            {action.assignee && (
              <span className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                Assigned to: {action.assignee.name}
              </span>
            )}
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Created: {format(new Date(action.createdAt), "MMM dd, yyyy")}
            </span>
            {action.project && (
              <span className="flex items-center">
                <Building className="w-3 h-3 mr-1" />
                Project: {action.project.name}
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
