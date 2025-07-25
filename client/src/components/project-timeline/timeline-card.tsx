import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Trash2, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/confirm-dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface TimelineCardProps {
  project: {
    id: number;
    projectNumber: string;
    name: string;
    status: string;
    value?: string;
    retention?: string;
    postcode?: string;
    startOnSiteDate?: string;
    contractCompletionDate?: string;
    constructionCompletionDate?: string;
    description?: string;
  };
  onProjectChange?: (project: any) => void;
}

export default function TimelineCard({ project, onProjectChange }: TimelineCardProps) {
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedPhase, setSelectedPhase] = useState<"tender" | "precon" | "construction" | "aftercare">("tender");
  const [workingWeeks, setWorkingWeeks] = useState({ startToContract: 0, startToAnticipated: 0, anticipatedToContract: 0 });
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'project', id: number, name: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState(project);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch all projects for dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      // Sort projects by status (tender, precon, construction, aftercare) then by project number
      return data.sort((a: any, b: any) => {
        const statusOrder = { tender: 1, precon: 2, construction: 3, aftercare: 4 };
        const aOrder = statusOrder[a.status as keyof typeof statusOrder] || 5;
        const bOrder = statusOrder[b.status as keyof typeof statusOrder] || 5;
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return a.projectNumber.localeCompare(b.projectNumber);
      });
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/projects/${data.id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Success", description: "Project updated successfully" });
      setIsProjectDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update project", variant: "destructive" });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/projects/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Success", description: "Project deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete project", variant: "destructive" });
    },
  });

  const calculateWorkingWeeks = () => {
    setTimeout(() => {
      const startDate = (document.getElementById('startOnSiteDate') as HTMLInputElement)?.value;
      const contractDate = (document.getElementById('contractCompletionDate') as HTMLInputElement)?.value;
      const constructionDate = (document.getElementById('constructionCompletionDate') as HTMLInputElement)?.value;

      if (startDate && contractDate && constructionDate) {
        const start = new Date(startDate);
        const contract = new Date(contractDate);
        const construction = new Date(constructionDate);

        const startToContract = Math.ceil((contract.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const startToAnticipated = Math.ceil((construction.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const anticipatedToContract = Math.ceil((contract.getTime() - construction.getTime()) / (1000 * 60 * 60 * 24 * 7));

        setWorkingWeeks({
          startToContract: Math.max(0, startToContract),
          startToAnticipated: Math.max(0, startToAnticipated),
          anticipatedToContract: Math.max(0, anticipatedToContract)
        });
      }
    }, 100);
  };

  const handleProjectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const projectNumber = formData.get("projectNumber") as string;
    const value = formData.get("value") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    // Validate project number format
    if (!/^[A-Z]\d{4}$/.test(projectNumber)) {
      toast({ title: "Error", description: "Project number must be in format X0000 (e.g. A1234)", variant: "destructive" });
      return;
    }

    // Validate description word count
    const wordCount = description.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < 25 || wordCount > 100) {
      toast({ title: "Error", description: "Description must be between 25 and 100 words", variant: "destructive" });
      return;
    }

    // Format value
    const numericValue = parseFloat(value) || 0;
    let formattedValue = '';
    if (numericValue >= 1000) {
      formattedValue = `£${(numericValue / 1000).toFixed(1)}m`;
    } else {
      formattedValue = `£${numericValue.toFixed(1)}k`;
    }

    // Calculate retention (1% of total value for aftercare projects)
    let formattedRetention = '';
    if (selectedPhase === "aftercare") {
      const retentionValue = numericValue * 10;
      formattedRetention = `£${retentionValue.toFixed(1)}`;
    }

    const projectData = {
      id: selectedProject?.id,
      projectNumber,
      name,
      description,
      status: selectedPhase,
      value: formattedValue,
      retention: formattedRetention,
      startOnSiteDate: formData.get("startOnSiteDate") as string,
      contractCompletionDate: formData.get("contractCompletionDate") as string,
      constructionCompletionDate: formData.get("constructionCompletionDate") as string,
    };

    updateProjectMutation.mutate(projectData);
  };
  // Helper functions copied from setup.tsx
  const isZeroOrNegativeValue = (value?: string) => {
    if (!value) return false;
    const numValue = parseFloat(value.replace(/[£,\s]/g, ''));
    return numValue <= 0;
  };

  const formatValue = (value?: string) => {
    if (!value) return '';
    
    const cleanValue = value.replace(/[£,\s]/g, '');
    const numValue = parseFloat(cleanValue);
    
    if (isNaN(numValue)) return value;
    
    const isNegative = numValue < 0;
    const absValue = Math.abs(numValue);
    
    if (absValue >= 1000000) {
      const millions = absValue / 1000000;
      return `${isNegative ? '-' : ''}£${millions.toFixed(1)}M`;
    } else if (absValue >= 1000) {
      const thousands = absValue / 1000;
      return `${isNegative ? '-' : ''}£${thousands.toFixed(0)}K`;
    } else {
      return `${isNegative ? '-' : ''}£${absValue.toFixed(0)}`;
    }
  };

  const getCurrentWeekInfo = () => {
    if (!currentProject.startOnSiteDate || !currentProject.contractCompletionDate || !currentProject.constructionCompletionDate) {
      return null;
    }

    const startDate = new Date(currentProject.startOnSiteDate);
    const contractDate = new Date(currentProject.contractCompletionDate);
    const constructionDate = new Date(currentProject.constructionCompletionDate);
    const currentDate = new Date();

    const totalWeeksToContract = Math.ceil((contractDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const totalWeeksToAnticipated = Math.ceil((constructionDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const currentWeek = Math.ceil((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    const retentionValue = parseFloat(currentProject.retention?.replace(/[£,]/g, '') || '0');
    const hasPositiveRetention = retentionValue > 0;
    const hasZeroRetention = retentionValue === 0;
    
    // Check if project is completed - either aftercare with zero retention OR past contract completion date
    const isPastContractDate = currentDate > contractDate;
    const isProjectCompleted = (hasZeroRetention && currentProject.status === 'aftercare') || 
                              (isPastContractDate && currentProject.status !== 'aftercare');
    
    const hideWeekIndicator = hasPositiveRetention && currentProject.status === 'aftercare';
    const isGreyedOut = isProjectCompleted || (hasPositiveRetention && currentProject.status === 'aftercare');

    return {
      currentWeek: Math.max(1, currentWeek),
      totalWeeksToContract,
      totalWeeksToAnticipated,
      hasPositiveRetention,
      hideWeekIndicator,
      isGreyedOut,
      isProjectCompleted,
      startDate: startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/\s/g, ' '),
      anticipatedDate: constructionDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/\s/g, ' '),
      contractDate: contractDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/\s/g, ' ')
    };
  };

  const weekInfo = getCurrentWeekInfo();

  return (
    <div>
      <Card className="material-shadow" style={{ zIndex: 1, position: 'relative' }}>
        <CardContent className={`p-2.5 ${weekInfo?.isGreyedOut ? 'opacity-60' : ''}`} style={{ paddingBottom: '17px' }}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {/* Header with project number, name, location, value and status */}
              <div className="flex items-baseline gap-1 mb-0.5">
                <div className="text-lg flex items-center">
                  <span className="font-normal text-sm" style={{
                    color: (() => {
                      switch (currentProject.status) {
                        case 'tender': return 'rgb(59, 130, 246)'; // blue
                        case 'precon': return 'rgb(34, 197, 94)'; // green
                        case 'construction': return 'rgb(234, 179, 8)'; // yellow
                        case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                        default: return 'rgb(55, 65, 81)'; // default gray-700
                      }
                    })()
                  }}>{currentProject.projectNumber}</span> 
                  <span className="font-light mx-1" style={{
                    color: (() => {
                      switch (currentProject.status) {
                        case 'tender': return 'rgb(59, 130, 246)'; // blue
                        case 'precon': return 'rgb(34, 197, 94)'; // green
                        case 'construction': return 'rgb(234, 179, 8)'; // yellow
                        case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                        default: return 'inherit';
                      }
                    })()
                  }}>|</span> 
                  <span style={{
                    color: (() => {
                      switch (currentProject.status) {
                        case 'tender': return 'rgb(59, 130, 246)'; // blue
                        case 'precon': return 'rgb(34, 197, 94)'; // green
                        case 'construction': return 'rgb(234, 179, 8)'; // yellow
                        case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                        default: return 'inherit'; // default color
                      }
                    })()
                  }}>{currentProject.name}</span>
                </div>
                {currentProject.value && (
                  <span className="text-action-text-secondary" style={{ fontSize: '0.7225rem' }}>
                    (<span className={isZeroOrNegativeValue(currentProject.value) ? 'text-red-400' : ''}>{formatValue(currentProject.value).replace(/M/g, 'm').replace(/K/g, 'k')}</span>)
                  </span>
                )}
                {/* Process indicator and action buttons */}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    className={`
                      rounded-full px-2 py-0.5 text-xs font-medium border transition-colors
                      ${currentProject.status === "tender" ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
                      ${currentProject.status === "precon" ? "bg-green-100 text-green-800 border-green-200" : ""}
                      ${currentProject.status === "construction" ? "bg-yellow-100 text-yellow-800 border-yellow-200" : ""}
                      ${currentProject.status === "aftercare" ? "bg-gray-100 text-gray-800 border-gray-200" : ""}
                      ${!currentProject.status ? "bg-gray-100 text-gray-800 border-gray-200" : ""}
                    `}
                  >
                    {currentProject.status === "tender" && "TEN"}
                    {currentProject.status === "precon" && "PRE"}
                    {currentProject.status === "construction" && "CON"}
                    {currentProject.status === "aftercare" && "AFT"}
                    {!currentProject.status && "UNK"}
                  </button>
                  
                  <div className={`flex space-x-1 ${weekInfo?.hasPositiveRetention && currentProject.status === 'aftercare' ? 'opacity-60' : ''}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setSelectedProject(currentProject);
                        setSelectedPhase(currentProject.status as "tender" | "precon" | "construction" | "aftercare");
                        setIsProjectDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setItemToDelete({ type: 'project', id: currentProject.id, name: currentProject.name });
                        setIsConfirmDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Timeline indicators */}
              {weekInfo && (
                <div className="flex items-center justify-between mb-2" style={{ fontSize: '10px' }}>
                  <div className="flex items-center" style={{ gap: '10px' }}>
                    <div>
                      <div className="flex items-center gap-[10px]">
                        <div className="flex items-center" title="Start on Site Date">
                          <span className="border px-0.5 py-0.5 rounded-l-sm" style={{ 
                            fontSize: '9px',
                            color: currentProject.status === 'construction' ? 'rgb(31, 41, 55)' : 'white',
                            backgroundColor: (() => {
                              switch (currentProject.status) {
                                case 'tender': return 'rgb(147, 197, 253)'; // light blue
                                case 'precon': return 'rgb(134, 239, 172)'; // light green
                                case 'construction': return 'rgb(254, 240, 138)'; // light yellow
                                case 'aftercare': return 'rgb(209, 213, 219)'; // light grey
                                default: return 'rgb(156, 163, 175)';
                              }
                            })(),
                            borderColor: (() => {
                              switch (currentProject.status) {
                                case 'tender': return 'rgb(147, 197, 253)';
                                case 'precon': return 'rgb(134, 239, 172)';
                                case 'construction': return 'rgb(254, 240, 138)';
                                case 'aftercare': return 'rgb(209, 213, 219)';
                                default: return 'rgb(156, 163, 175)';
                              }
                            })(),
                            borderWidth: '2px',
                            borderStyle: 'solid'
                          }}>SOS</span>
                          <span className="bg-white text-black px-1 py-0.5 rounded-r-sm" style={{ 
                            fontSize: '10px',
                            borderTop: `1px solid ${(() => {
                              switch (currentProject.status) {
                                case 'tender': return 'rgb(147, 197, 253)';
                                case 'precon': return 'rgb(134, 239, 172)';
                                case 'construction': return 'rgb(254, 240, 138)';
                                case 'aftercare': return 'rgb(209, 213, 219)';
                                default: return 'rgb(156, 163, 175)';
                              }
                            })()}`,
                            borderRight: `1px solid ${(() => {
                              switch (currentProject.status) {
                                case 'tender': return 'rgb(147, 197, 253)';
                                case 'precon': return 'rgb(134, 239, 172)';
                                case 'construction': return 'rgb(254, 240, 138)';
                                case 'aftercare': return 'rgb(209, 213, 219)';
                                default: return 'rgb(156, 163, 175)';
                              }
                            })()}`,
                            borderBottom: `1px solid ${(() => {
                              switch (currentProject.status) {
                                case 'tender': return 'rgb(147, 197, 253)';
                                case 'precon': return 'rgb(134, 239, 172)';
                                case 'construction': return 'rgb(254, 240, 138)';
                                case 'aftercare': return 'rgb(209, 213, 219)';
                                default: return 'rgb(156, 163, 175)';
                              }
                            })()}`
                          }}>{weekInfo.startDate.toUpperCase()}</span>
                        </div>

                        {/* CONST indicator for construction and aftercare */}
                        {currentProject.status !== 'precon' && currentProject.status !== 'tender' && (
                          <div className="flex items-center" title="Construction Practical Completion Date">
                            <span className="text-white border px-0.5 py-0.5 rounded-l-sm" style={{ 
                              fontSize: '9px',
                              backgroundColor: (() => {
                                switch (currentProject.status) {
                                  case 'construction': return 'rgb(250, 204, 21)'; // middle yellow shade
                                  case 'aftercare': return 'rgb(156, 163, 175)'; // middle grey shade
                                  default: return 'rgb(147, 197, 253)';
                                }
                              })(),
                              borderColor: (() => {
                                switch (currentProject.status) {
                                  case 'construction': return 'rgb(250, 204, 21)';
                                  case 'aftercare': return 'rgb(156, 163, 175)';
                                  default: return 'rgb(147, 197, 253)';
                                }
                              })()
                            }}>CONST</span>
                            <span className="bg-white text-black px-0.5 py-0.5 rounded-r-sm" style={{ 
                              fontSize: '9px',
                              borderTop: `1px solid ${(() => {
                                switch (currentProject.status) {
                                  case 'construction': return 'rgb(250, 204, 21)';
                                  case 'aftercare': return 'rgb(156, 163, 175)';
                                  default: return 'rgb(147, 197, 253)';
                                }
                              })()}`,
                              borderRight: `1px solid ${(() => {
                                switch (currentProject.status) {
                                  case 'construction': return 'rgb(250, 204, 21)';
                                  case 'aftercare': return 'rgb(156, 163, 175)';
                                  default: return 'rgb(147, 197, 253)';
                                }
                              })()}`,
                              borderBottom: `1px solid ${(() => {
                                switch (currentProject.status) {
                                  case 'construction': return 'rgb(250, 204, 21)';
                                  case 'aftercare': return 'rgb(156, 163, 175)';
                                  default: return 'rgb(147, 197, 253)';
                                }
                              })()}`
                            }}>{weekInfo.anticipatedDate.toUpperCase()}</span>
                          </div>
                        )}

                        <div className="flex items-center" title="Contract Practical Completion Date">
                          <span className="text-white border px-0.5 py-0.5 rounded-l-sm" style={{ 
                            fontSize: '9px',
                            backgroundColor: (() => {
                              switch (currentProject.status) {
                                case 'tender': return 'rgb(59, 130, 246)'; // dark blue
                                case 'precon': return 'rgb(34, 197, 94)'; // dark green
                                case 'construction': return 'rgb(234, 179, 8)'; // dark yellow
                                case 'aftercare': return 'rgb(107, 114, 128)'; // dark grey
                                default: return 'rgba(31, 41, 55, 0.7)';
                              }
                            })(),
                            borderColor: (() => {
                              switch (currentProject.status) {
                                case 'tender': return 'rgb(59, 130, 246)';
                                case 'precon': return 'rgb(34, 197, 94)';
                                case 'construction': return 'rgb(234, 179, 8)';
                                case 'aftercare': return 'rgb(107, 114, 128)';
                                default: return 'rgb(107, 114, 128)';
                              }
                            })()
                          }}>CONTR</span>
                          <span className="bg-white text-black px-0.5 py-0.5 rounded-r-sm" style={{ 
                            fontSize: '9px',
                            borderTop: `1px solid ${(() => {
                              switch (currentProject.status) {
                                case 'tender': return 'rgb(59, 130, 246)';
                                case 'precon': return 'rgb(34, 197, 94)';
                                case 'construction': return 'rgb(234, 179, 8)';
                                case 'aftercare': return 'rgb(107, 114, 128)';
                                default: return 'rgb(107, 114, 128)';
                              }
                            })()}`,
                            borderRight: `1px solid ${(() => {
                              switch (currentProject.status) {
                                case 'tender': return 'rgb(59, 130, 246)';
                                case 'precon': return 'rgb(34, 197, 94)';
                                case 'construction': return 'rgb(234, 179, 8)';
                                case 'aftercare': return 'rgb(107, 114, 128)';
                                default: return 'rgb(107, 114, 128)';
                              }
                            })()}`,
                            borderBottom: `1px solid ${(() => {
                              switch (currentProject.status) {
                                case 'tender': return 'rgb(59, 130, 246)';
                                case 'precon': return 'rgb(34, 197, 94)';
                                case 'construction': return 'rgb(234, 179, 8)';
                                case 'aftercare': return 'rgb(107, 114, 128)';
                                default: return 'rgb(107, 114, 128)';
                              }
                            })()}`
                          }}>{weekInfo.contractDate.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    {/* RET indicator for aftercare projects with retention - positioned outside greyed wrapper */}
                    {currentProject.status === 'aftercare' && currentProject.retention && (() => {
                      const retentionValue = parseFloat(currentProject.retention?.replace(/[£,]/g, '') || '0');
                      // Only show RET indicator if retention is positive (red) or exactly zero (green)
                      return retentionValue >= 0;
                    })() && (
                      <div className={`flex items-center ${(() => {
                        const retentionValue = parseFloat(currentProject.retention?.replace(/[£,]/g, '') || '0');
                        // Only grey out green RET (zero retention), never red RET (positive retention)
                        return retentionValue === 0 ? 'opacity-60' : '';
                      })()}`} title="Retention">
                        <span className="text-white px-0.5 py-0.5 rounded-l-sm" style={{ 
                          fontSize: '9px',
                          backgroundColor: (() => {
                            const retentionValue = parseFloat(currentProject.retention?.replace(/[£,]/g, '') || '0');
                            return retentionValue > 0 ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'; // red for positive, green for zero
                          })(),
                          border: `1px solid ${(() => {
                            const retentionValue = parseFloat(currentProject.retention?.replace(/[£,]/g, '') || '0');
                            return retentionValue > 0 ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)';
                          })()}`
                        }}>RET</span>
                        <span className="bg-white text-black px-0.5 py-0.5 rounded-r-sm" style={{ 
                          fontSize: '9px',
                          border: `1px solid ${(() => {
                            const retentionValue = parseFloat(currentProject.retention?.replace(/[£,]/g, '') || '0');
                            return retentionValue > 0 ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)';
                          })()}`,
                          borderLeft: 'none'
                        }}>{formatValue(currentProject.retention).replace(/M/g, 'm').replace(/K/g, 'k').toUpperCase()}</span>
                      </div>
                    )}

                    <div className={(() => {
                      // Check if we should grey out EEV indicator
                      const retentionValue = parseFloat(currentProject.retention?.replace(/[£,]/g, '') || '0');
                      const hasPositiveRetention = retentionValue > 0 && currentProject.status === 'aftercare';
                      return hasPositiveRetention ? 'opacity-60' : '';
                    })()}>
                      <div className="flex items-center gap-[10px]">
                        {/* EEV indicator for construction projects */}
                        {currentProject.status !== 'aftercare' && weekInfo && !weekInfo.hideWeekIndicator && !weekInfo.isProjectCompleted && !isZeroOrNegativeValue(currentProject.value) && (
                          <div className="flex items-center" title="Estimated Earned Value">
                            <span className="text-white border px-0.5 py-0.5 rounded-l-sm" style={{ 
                              fontSize: '9px',
                              backgroundColor: 'rgb(115, 115, 115)',
                              borderColor: 'rgb(115, 115, 115)'
                            }}>
                              EEV
                            </span>
                            <span className="bg-white text-black border border-gray-300 px-0.5 py-0.5 rounded-r-sm" style={{ fontSize: '9px' }}>
                              {(() => {
                                const projectValueNum = parseFloat(currentProject.value?.replace(/[£,]/g, '') || '0');
                                const weeklyValue = projectValueNum / weekInfo.totalWeeksToContract;
                                let evaValue = weeklyValue * weekInfo.currentWeek;
                                
                                const isLate = weekInfo.currentWeek > weekInfo.totalWeeksToContract;
                                if (isLate) {
                                  evaValue = Math.min(evaValue, projectValueNum);
                                }
                                
                                const percentComplete = Math.min((weekInfo.currentWeek / weekInfo.totalWeeksToContract) * 100, 100);
                                return `${formatValue(`£${evaValue}`).replace(/M/g, 'm').replace(/K/g, 'k')} (${percentComplete.toFixed(0)}%)`;
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {weekInfo && (
                <div className="mt-2 relative flex items-center">
                  <div className={`h-1 rounded-sm overflow-hidden flex ${
                    currentProject.status === 'aftercare' ? 'bg-gray-200' : 'bg-gray-100'
                  }`} style={{ width: '95%' }}>
                    {(() => {
                      const currentWeek = weekInfo.currentWeek;
                      const totalWeeksToAnticipated = weekInfo.totalWeeksToAnticipated;
                      const totalWeeksToContract = weekInfo.totalWeeksToContract;
                      
                      // Grey out completed projects or projects with positive retention in aftercare
                      if (weekInfo.isProjectCompleted || (weekInfo.hasPositiveRetention && currentProject.status === 'aftercare')) {
                        return (
                          <div 
                            className="bg-gray-400 h-full opacity-40" 
                            style={{ width: '100%' }}
                            title="Project finished"
                          />
                        );
                      }
                      
                      // Use the exact same progress bar logic as setup page
                      const greyPercent = Math.min((currentWeek / totalWeeksToContract) * 100, 100);
                      const lightBluePercent = Math.max(0, Math.min(((totalWeeksToAnticipated - currentWeek) / totalWeeksToContract) * 100, 100 - greyPercent));
                      const amberPercent = Math.max(0, ((totalWeeksToContract - totalWeeksToAnticipated) / totalWeeksToContract) * 100);
                      
                      return (
                        <>
                          {greyPercent > 0 && (
                            <div 
                              className="bg-gray-400 h-full opacity-60" 
                              style={{ width: `${greyPercent}%` }}
                              title={`Elapsed: ${currentWeek} weeks`}
                            />
                          )}
                          {lightBluePercent > 0 && (
                            <div 
                              className="h-full opacity-60" 
                              style={{ 
                                width: `${lightBluePercent}%`,
                                backgroundColor: (() => {
                                  switch (currentProject.status) {
                                    case 'tender': return 'rgb(59, 130, 246)'; // blue
                                    case 'precon': return 'rgb(34, 197, 94)'; // green
                                    case 'construction': return 'rgb(234, 179, 8)'; // yellow
                                    case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                                    default: return 'rgb(147, 197, 253)';
                                  }
                                })()
                              }}
                              title={`Remaining to anticipated: ${Math.max(0, totalWeeksToAnticipated - currentWeek)} weeks`}
                            />
                          )}
                          {amberPercent > 0 && (
                            <div 
                              className="bg-gray-800 h-full opacity-60" 
                              style={{ width: `${amberPercent}%` }}
                              title={`Buffer to contract: ${totalWeeksToContract - totalWeeksToAnticipated} weeks`}
                            />
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Today marker and week indicator */}
                  {weekInfo && !weekInfo.hideWeekIndicator && !weekInfo.isProjectCompleted && (() => {
                    const currentWeek = weekInfo.currentWeek;
                    const totalWeeksToContract = weekInfo.totalWeeksToContract;
                    const totalWeeksToAnticipated = weekInfo.totalWeeksToAnticipated;
                    const greyPercent = Math.min((currentWeek / totalWeeksToContract) * 100, 100);
                    const currentPercent = (greyPercent * 95) / 100;
                    
                    return (
                      <div className="absolute" style={{ left: `calc(${currentPercent}% - 2px)` }}>
                        <div 
                          className="w-0.5 h-7 rounded-sm"
                          style={{ 
                            marginTop: '12px',
                            backgroundColor: (() => {
                              switch (currentProject.status) {
                                case 'tender': return 'rgb(59, 130, 246)';
                                case 'precon': return 'rgb(34, 197, 94)';
                                case 'construction': return 'rgb(234, 179, 8)';
                                case 'aftercare': return 'rgb(107, 114, 128)';
                                default: return 'rgb(107, 114, 128)';
                              }
                            })()
                          }}
                          title="Today"
                        />
                        <div 
                          className="absolute whitespace-nowrap text-gray-600"
                          style={{ 
                            fontSize: '10.2px', 
                            top: '28px', 
                            right: '4px',
                            marginRight: '3px',
                            lineHeight: '1',
                            color: 'rgb(75, 85, 99)'
                          }}
                        >
                          {(() => {
                            if (currentProject.status === 'precon' || currentProject.status === 'tender') {
                              return `w${currentWeek} of ${totalWeeksToContract}`;
                            }
                            return `w${currentWeek} of ${totalWeeksToAnticipated} (${totalWeeksToContract})`;
                          })()}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Completion percentage */}
                  <div className="ml-2 text-xs font-bold" style={{ 
                    fontSize: '15px',
                    color: (() => {
                      switch (currentProject.status) {
                        case 'tender': return 'rgb(59, 130, 246)';
                        case 'precon': return 'rgb(34, 197, 94)';
                        case 'construction': return 'rgb(234, 179, 8)';
                        case 'aftercare': return 'rgb(107, 114, 128)';
                        default: return 'rgb(107, 114, 128)';
                      }
                    })()
                  }}>
                    {(() => {
                      const currentWeek = weekInfo.currentWeek;
                      const totalWeeksToContract = weekInfo.totalWeeksToContract;
                      const percentComplete = Math.min((currentWeek / totalWeeksToContract) * 100, 100);
                      return `${Math.round(percentComplete)}%`;
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Bottom tab with remaining weeks */}
      {weekInfo && (
        <div className="flex justify-end relative" style={{ marginTop: '-3px', marginRight: '25px' }}>
          <div className="bg-white rounded-b-lg px-3 py-1.5 text-gray-600 inline-block italic flex justify-center" style={{ 
            fontSize: '11.73px', 
            zIndex: 0,
            border: `1px solid ${(() => {
              if (weekInfo.hasPositiveRetention && currentProject.status === 'aftercare') return 'rgba(204, 204, 204, 0.5)';
              switch (currentProject.status) {
                case 'tender': return 'rgba(59, 130, 246, 0.5)';
                case 'precon': return 'rgba(34, 197, 94, 0.5)';
                case 'construction': return 'rgba(234, 179, 8, 0.5)';
                case 'aftercare': return 'rgba(107, 114, 128, 0.5)';
                default: return 'rgba(107, 114, 128, 0.5)';
              }
            })()}`
          }}>
            {weekInfo.isProjectCompleted || (weekInfo.hasPositiveRetention && currentProject.status === 'aftercare') ? (
              <span className="text-gray-500 font-medium">Project Completed</span>
            ) : (
              <>
                {currentProject.status === 'tender' || currentProject.status === 'precon' ? (
                  <>Weeks to Completion <span className="font-bold" style={{ 
                    marginLeft: '3px', 
                    marginRight: '3px',
                    color: currentProject.status === 'tender' ? 'rgb(59, 130, 246)' : 'rgb(34, 197, 94)'
                  }}>{Math.max(0, weekInfo.totalWeeksToContract - weekInfo.currentWeek)}</span></>
                ) : (
                  <>Weeks to Construction <span className="font-bold" style={{ 
                    marginLeft: '3px', 
                    marginRight: '3px',
                    color: currentProject.status === 'construction' ? 'rgb(234, 179, 8)' : currentProject.status === 'aftercare' ? 'rgb(107, 114, 128)' : 'rgb(59, 130, 246)'
                  }}>{Math.max(0, weekInfo.totalWeeksToAnticipated - weekInfo.currentWeek)}</span> Contract <span className="font-bold text-gray-800" style={{ marginLeft: '3px', marginRight: '3px' }}>{Math.max(0, weekInfo.totalWeeksToContract - weekInfo.currentWeek)}</span></>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {/* Timeline Dropdown */}
      <div className="relative text-[12px] font-thin" style={{ marginTop: '-30px', marginLeft: '25px', width: 'fit-content', zIndex: 0 }}>
        <div className="relative inline-block" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors mt-[-5px] mb-[-5px] pt-[5px] pb-[5px] pl-[8px] pr-[8px] text-[#5e5e5e]"
            style={{ padding: '6px 10px', fontSize: '13px' }}
          >
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute left-0 top-full w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto mt-[-22px] mb-[-22px] ml-[28px] mr-[28px] pt-[3px] pb-[3px]">
              <div className="py-1">
                {(() => {
                  // Sort projects: live projects first (tender, precon, construction), then completed projects (tender complete, precon complete, aftercare)
                  const sortedProjects = [...projects].sort((a, b) => {
                    const getProjectInfo = (project: any) => {
                      const retentionValue = parseFloat(project.retention?.replace(/[£,]/g, '') || '0');
                      const contractDate = new Date(project.contractCompletionDate);
                      const currentDate = new Date();
                      const isPastContractDate = currentDate > contractDate;
                      const isCompleted = (retentionValue === 0 && project.status === 'aftercare') || 
                                        (isPastContractDate && project.status !== 'aftercare');
                      
                      return { isCompleted, status: project.status };
                    };
                    
                    const aInfo = getProjectInfo(a);
                    const bInfo = getProjectInfo(b);
                    
                    // Define order values
                    const getOrderValue = (info: any) => {
                      if (!info.isCompleted) {
                        // Live projects
                        switch (info.status) {
                          case 'tender': return 1;
                          case 'precon': return 2;
                          case 'construction': return 3;
                          default: return 4;
                        }
                      } else {
                        // Completed projects
                        switch (info.status) {
                          case 'tender': return 5; // tender complete
                          case 'precon': return 6; // precon complete
                          case 'aftercare': return 7; // aftercare
                          default: return 8;
                        }
                      }
                    };
                    
                    return getOrderValue(aInfo) - getOrderValue(bInfo);
                  });
                  
                  return sortedProjects.map((proj: any) => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        setCurrentProject(proj);
                        onProjectChange?.(proj);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1 hover:bg-gray-100 transition-colors border-l-4 ${
                        proj.id === currentProject.id ? 'bg-blue-50 border-l-blue-500' : 'border-l-transparent'
                      }`}
                      style={{ fontSize: '11.05px' }}
                    >
                      <span 
                        className="font-medium truncate block"
                        style={{
                          color: (() => {
                            switch (proj.status) {
                              case 'tender': return 'rgb(59, 130, 246)'; // blue
                              case 'precon': return 'rgb(34, 197, 94)'; // green
                              case 'construction': return 'rgb(234, 179, 8)'; // yellow
                              case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                              default: return 'rgb(75, 85, 99)'; // default gray
                            }
                          })()
                        }}
                      >
                        {proj.name}
                      </span>
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Edit Project Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProjectSubmit} className="space-y-3">
            {/* Row 1: Project Number (15%) | Value (15%) | Project Name (70%) */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-2">
                <Label htmlFor="projectNumber" className="text-xs">Number</Label>
                <Input
                  id="projectNumber"
                  name="projectNumber"
                  placeholder="X0000"
                  className="h-7 px-1.5 py-1"
                  style={{ fontSize: '11px' }}
                  defaultValue={selectedProject?.projectNumber || ""}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="value" className="text-xs">Value</Label>
                <Input
                  id="value"
                  name="value"
                  placeholder="23.5"
                  className="h-7 px-1.5 py-1"
                  style={{ fontSize: '11px' }}
                  defaultValue={selectedProject?.value?.replace('£', '') || ""}
                  required
                />
              </div>
              <div className="col-span-8">
                <Label htmlFor="name" className="text-xs">Name</Label>
                <Input
                  id="name"
                  name="name"
                  className="h-7 px-1.5 py-1"
                  style={{ fontSize: '11px' }}
                  defaultValue={selectedProject?.name}
                  required
                />
              </div>
            </div>
            
            {/* Row 2: Project Description (100%) - multiline */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="description" className="text-xs">Description</Label>
                <span className="text-xs text-gray-500" id="description-counter">0/25-100 words</span>
              </div>
              <textarea
                id="description"
                name="description"
                className="w-full min-h-[68px] px-1.5 py-1 text-xs bg-white border border-gray-300 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-[#cc3333] focus:border-transparent"
                defaultValue={selectedProject?.description || ""}
                placeholder="Enter project description (minimum 25 words)..."
                required
                onChange={(e) => {
                  const wordCount = e.target.value.trim().split(/\s+/).filter(word => word.length > 0).length;
                  const counter = document.getElementById('description-counter');
                  if (counter) {
                    counter.textContent = `${wordCount}/25-100 words`;
                    if (wordCount < 25) {
                      counter.className = "text-xs text-red-500";
                    } else if (wordCount > 100) {
                      counter.className = "text-xs text-red-500";
                    } else {
                      counter.className = "text-xs text-green-600";
                    }
                  }
                }}
              />
            </div>

            {/* Row 3: Process buttons (100%) - styled exactly like action form */}
            <div>
              <div className="flex justify-between gap-2">
                {[
                  { value: "tender", label: "TENDER", activeColor: "bg-blue-500 border-blue-600 text-white", inactiveColor: "bg-blue-50 border-blue-200 text-blue-700" },
                  { value: "precon", label: "PRECON", activeColor: "bg-green-500 border-green-600 text-white", inactiveColor: "bg-green-50 border-green-200 text-green-700" },
                  { value: "construction", label: "CONSTRUCTION", activeColor: "bg-yellow-500 border-yellow-600 text-white", inactiveColor: "bg-yellow-50 border-yellow-200 text-yellow-700" },
                  { value: "aftercare", label: "AFTERCARE", activeColor: "bg-gray-500 border-gray-600 text-white", inactiveColor: "bg-gray-50 border-gray-200 text-gray-700" }
                ].map((phase) => (
                  <button
                    key={phase.value}
                    type="button"
                    onClick={() => setSelectedPhase(phase.value as "tender" | "precon" | "construction" | "aftercare")}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium uppercase rounded-full border transition-colors ${
                      selectedPhase === phase.value
                        ? phase.activeColor
                        : phase.inactiveColor
                    }`}
                  >
                    {phase.label}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-gray-200 mt-3" />

            {/* Row 4: Start Date (33%) | Contract PC (33%) | Anticipated PC (33%) */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="startOnSiteDate" className="text-xs text-center block mb-1.5">Start Date</Label>
                <Input
                  id="startOnSiteDate"
                  name="startOnSiteDate"
                  type="date"
                  className="h-6 w-full"
                  style={{ fontSize: '10px', textAlign: 'right', paddingRight: '8px' }}
                  defaultValue={selectedProject?.startOnSiteDate ? new Date(selectedProject.startOnSiteDate).toISOString().split('T')[0] : ""}
                  onChange={() => calculateWorkingWeeks()}
                  required
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="contractCompletionDate" className="text-xs text-center block mb-1.5">Contract PC</Label>
                <Input
                  id="contractCompletionDate"
                  name="contractCompletionDate"
                  type="date"
                  className="h-6 w-full"
                  style={{ fontSize: '10px', textAlign: 'right', paddingRight: '8px' }}
                  defaultValue={selectedProject?.contractCompletionDate ? new Date(selectedProject.contractCompletionDate).toISOString().split('T')[0] : ""}
                  onChange={() => calculateWorkingWeeks()}
                  required
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="constructionCompletionDate" className="text-xs text-center block mb-1.5">Anticipated PC</Label>
                <Input
                  id="constructionCompletionDate"
                  name="constructionCompletionDate"
                  type="date"
                  className="h-6 w-full"
                  style={{ fontSize: '10px', textAlign: 'right', paddingRight: '8px' }}
                  defaultValue={selectedProject?.constructionCompletionDate ? new Date(selectedProject.constructionCompletionDate).toISOString().split('T')[0] : ""}
                  onChange={() => calculateWorkingWeeks()}
                  required
                />
              </div>
            </div>

            <hr className="border-gray-200 mt-3 mb-4" />
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-1" style={{ fontSize: '10px' }}>
                {workingWeeks.startToContract > 0 && (
                  <>
                    <div className="w-6 h-6 text-gray-400 flex items-center justify-center text-xs">ℹ️</div>
                    <div className="leading-tight font-mono">
                      <div className="flex">
                        <div className="w-8 text-center text-black">{workingWeeks.startToContract}w</div>
                        <div className="flex-1 text-gray-500 italic ml-2">Start → Contract</div>
                      </div>
                      <div className="flex">
                        <div className="w-8 text-center text-black">{workingWeeks.startToAnticipated}w</div>
                        <div className="flex-1 text-gray-500 italic ml-2">Start → Anticipated</div>
                      </div>
                      <div className="flex">
                        <div className="w-8 text-center text-black">{workingWeeks.anticipatedToContract}w</div>
                        <div className={`flex-1 italic ml-2 ${workingWeeks.anticipatedToContract < (workingWeeks.startToContract * 0.1) ? 'text-amber-500' : 'text-gray-500'}`}>Float / Buffer</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => {
                  setIsProjectDialogOpen(false);
                  setSelectedPhase("tender");
                  setWorkingWeeks({ startToContract: 0, startToAnticipated: 0, anticipatedToContract: 0 });
                }}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-full">
                  Update
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        onConfirm={() => {
          if (itemToDelete) {
            deleteProjectMutation.mutate(itemToDelete.id);
          }
          setItemToDelete(null);
          setIsConfirmDialogOpen(false);
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}