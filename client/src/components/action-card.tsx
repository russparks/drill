import React, { useState } from "react";
import { Edit, Check, User, Calendar, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActionWithRelations } from "@shared/schema";
import { format, differenceInBusinessDays } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

interface ActionCardProps {
  action: ActionWithRelations;
  onEdit: (action: ActionWithRelations) => void;
  onComplete: (actionId: number) => void;
  isEven: boolean;
}

export default function ActionCard({ action, onEdit, onComplete, isEven }: ActionCardProps) {
  const isMobile = useIsMobile();
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  const formatDiscipline = (discipline: string) => {
    return discipline.charAt(0).toUpperCase() + discipline.slice(1);
  };

  const abbreviateDiscipline = (discipline: string) => {
    switch (discipline) {
      case "operations": return "Ops";
      case "commercial": return "Com";
      case "design": return "Des";
      case "she": return "SHE";
      case "qa": return "QA";
      default: return discipline;
    }
  };

  const abbreviatePhase = (phase: string) => {
    switch (phase) {
      case "tender": return "Ten";
      case "precon": return "Pre";
      case "construction": return "Con";
      case "aftercare": return "Aft";
      default: return phase;
    }
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  const getInitialsAndSurname = (fullName: string) => {
    const parts = fullName.split(' ');
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0][0]}. ${parts[1]}`;
    // For names with more than 2 parts, use first initial and last part
    return `${parts[0][0]}. ${parts[parts.length - 1]}`;
  };

  const truncateDescription = (description: string, wordLimit: number = 25) => {
    if (!description) return '';
    const words = description.split(' ');
    if (words.length <= wordLimit) return description;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  const getFirstLetter = (text: string) => {
    return text.charAt(0).toUpperCase();
  };

  const getStatusIndicator = (status: string) => {
    if (status === "open") {
      return <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />;
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

  const getWorkingDaysRemaining = (dueDate: string | Date | null) => {
    if (!dueDate) return null;
    const days = differenceInBusinessDays(new Date(dueDate), new Date());
    if (days >= 0) {
      return { text: `(${days}d)`, color: "text-black" };
    } else {
      return { text: `(${days})`, color: "text-red-600" };
    }
  };

  const workingDays = getWorkingDaysRemaining(action.dueDate);

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className={`action-card border-b border-gray-100 last:border-b-0 p-4 ${isEven ? 'bg-gray-50' : 'bg-white'}`}>
      {isMobile ? (
        /* Mobile Layout */
        <>
          {/* Row 1 */}
          <div className="flex items-start gap-4 mb-3">
            {/* Col 1: Action Description */}
            <div className="w-[85%] flex-shrink-0">
              {action.description && (
                <p className="text-sm text-action-text-primary font-medium">{action.description}</p>
              )}
            </div>
            
            {/* Col 2: Status, Discipline, Phase */}
            <div className="w-[15%] flex-shrink-0 flex flex-col items-start gap-1 justify-end">
              <div className="flex items-center gap-1">
                {getStatusIndicator(action.status)}
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${getDisciplineColor(action.discipline)}`} title={formatDiscipline(action.discipline)}>
                  {getFirstLetter(abbreviateDiscipline(action.discipline))}
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${getPhaseColor(action.phase)}`} title={action.phase}>
                  {getFirstLetter(abbreviatePhase(action.phase))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex items-center justify-between gap-4">
            {/* Col 1: Project, Assignee, Due Date */}
            <div className="flex items-center gap-4 text-xs text-action-text-secondary flex-1">
              {action.project && (
                <span className="flex items-center">
                  <Building className="w-3 h-3 mr-1" />
                  {truncateText(action.project.name, 15)}
                </span>
              )}
              {action.assignee && (
                <span className="flex items-center" title={action.assignee.name}>
                  <User className="w-3 h-3 mr-1" />
                </span>
              )}
              {action.dueDate && (
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {format(new Date(action.dueDate), "MMM dd")}
                  {workingDays && (
                    <span className={`ml-2 font-medium ${workingDays.color}`}>
                      {workingDays.text}
                    </span>
                  )}
                </span>
              )}
            </div>
            
            {/* Col 2: Edit and Complete Actions */}
            <div className="flex items-center gap-1">
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
        </>
      ) : (
        /* Desktop Layout */
        <>
          {/* Row 1 */}
          <div className="flex items-center mb-3">
            {/* Status Indicator + Action Description (flexible, takes remaining space) */}
            <div className="flex-1 flex items-center gap-3">
              {getStatusIndicator(action.status)}
              {action.description && (
                <p 
                  className="text-sm text-action-text-primary font-medium cursor-pointer hover:text-blue-600 flex-1"
                  onClick={() => setShowFullDescription(true)}
                  title="Click to see full description"
                >
                  {truncateDescription(action.description)}
                </p>
              )}
            </div>
            
            {/* Mark Complete (minimal width) */}
            <div className="flex items-center justify-end ml-4 w-6">
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

          {/* Row 2 */}
          <div className="flex items-center">
            {/* Phase + Discipline (minimal width) */}
            <div className="flex items-center gap-2">
              <Badge className={`phase-badge ${getPhaseColor(action.phase)} text-xs px-2 py-0.5`}>
                {abbreviatePhase(action.phase).toUpperCase()}
              </Badge>
              <Badge className={`discipline-badge ${getDisciplineColor(action.discipline)} text-xs px-2 py-0.5`}>
                {abbreviateDiscipline(action.discipline).toUpperCase()}
              </Badge>
            </div>
            
            {/* Project (flexible width) */}
            <div className="flex-1 flex items-center text-xs text-action-text-secondary ml-4">
              {action.project && (
                <span className="flex items-center italic">
                  {action.project.name}
                </span>
              )}
            </div>
            
            {/* Assignee (24%) */}
            <div className="w-[24%] flex-shrink-0 flex items-center justify-end text-xs text-action-text-secondary pr-[5px]">
              {action.assignee && (
                <span className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {getInitialsAndSurname(action.assignee.name)}
                </span>
              )}
            </div>
            
            {/* Due Date (takes remaining space before buttons) */}
            <div className="flex-1 flex items-center justify-end text-xs text-action-text-secondary">
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
            </div>
            

          </div>
        </>
      )}
      
      {/* Full Description Modal */}
      <Dialog open={showFullDescription} onOpenChange={setShowFullDescription}>
        <DialogContent className="sm:max-w-2xl">
          <div className="mt-2">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">
              {action.description}
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t">
              {action.status !== "closed" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onComplete(action.id);
                    setShowFullDescription(false);
                  }}
                  className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
                >
                  <Check className="h-4 w-4" />
                  Mark Complete
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit(action);
                  setShowFullDescription(false);
                }}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Action
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}