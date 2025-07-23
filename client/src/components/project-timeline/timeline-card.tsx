import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

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
  };
  onEdit?: (project: any) => void;
  onDelete?: (project: any) => void;
}

export default function TimelineCard({ project, onEdit, onDelete }: TimelineCardProps) {
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
    if (!project.startOnSiteDate || !project.contractCompletionDate || !project.constructionCompletionDate) {
      return null;
    }

    const startDate = new Date(project.startOnSiteDate);
    const contractDate = new Date(project.contractCompletionDate);
    const constructionDate = new Date(project.constructionCompletionDate);
    const currentDate = new Date();

    const totalWeeksToContract = Math.ceil((contractDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const totalWeeksToAnticipated = Math.ceil((constructionDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const currentWeek = Math.ceil((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    const retentionValue = parseFloat(project.retention?.replace(/[£,]/g, '') || '0');
    const hasPositiveRetention = retentionValue > 0;
    const hideWeekIndicator = hasPositiveRetention && project.status === 'aftercare';
    const isGreyedOut = hasPositiveRetention && project.status === 'aftercare';

    return {
      currentWeek: Math.max(1, currentWeek),
      totalWeeksToContract,
      totalWeeksToAnticipated,
      hasPositiveRetention,
      hideWeekIndicator,
      isGreyedOut,
      startDate: startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).replace(' ', ''),
      anticipatedDate: constructionDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).replace(' ', ''),
      contractDate: contractDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).replace(' ', '')
    };
  };

  const weekInfo = getCurrentWeekInfo();

  return (
    <div className={weekInfo?.isGreyedOut ? 'opacity-60' : ''}>
      <Card className="material-shadow">
        <CardContent className="p-2.5 pb-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {/* Header with project number, name, location, value and status */}
              <div className={`flex items-center gap-2 mb-0.5 ${weekInfo?.hasPositiveRetention && project.status === 'aftercare' ? 'opacity-60' : ''}`}>
                <div className="text-lg flex items-center">
                  <span className="font-normal text-sm" style={{
                    color: (() => {
                      switch (project.status) {
                        case 'tender': return 'rgb(59, 130, 246)'; // blue
                        case 'precon': return 'rgb(34, 197, 94)'; // green
                        case 'construction': return 'rgb(234, 179, 8)'; // yellow
                        case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                        default: return 'rgb(55, 65, 81)'; // default gray-700
                      }
                    })()
                  }}>{project.projectNumber}</span> 
                  <span className="font-light mx-1" style={{
                    color: (() => {
                      switch (project.status) {
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
                      switch (project.status) {
                        case 'tender': return 'rgb(59, 130, 246)'; // blue
                        case 'precon': return 'rgb(34, 197, 94)'; // green
                        case 'construction': return 'rgb(234, 179, 8)'; // yellow
                        case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                        default: return 'inherit'; // default color
                      }
                    })()
                  }}>{project.name}</span>
                </div>
                {project.value && (
                  <span className="text-action-text-secondary ml-2" style={{ fontSize: '0.85rem' }}>
                    (<span className={isZeroOrNegativeValue(project.value) ? 'text-red-400' : ''}>{formatValue(project.value)}</span>)
                  </span>
                )}
                {/* Process indicator and action buttons */}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    className={`
                      rounded-full px-2 py-0.5 text-xs font-medium border transition-colors
                      ${project.status === "tender" ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
                      ${project.status === "precon" ? "bg-green-100 text-green-800 border-green-200" : ""}
                      ${project.status === "construction" ? "bg-yellow-100 text-yellow-800 border-yellow-200" : ""}
                      ${project.status === "aftercare" ? "bg-gray-100 text-gray-800 border-gray-200" : ""}
                      ${!project.status ? "bg-gray-100 text-gray-800 border-gray-200" : ""}
                    `}
                  >
                    {project.status === "tender" && "TEN"}
                    {project.status === "precon" && "PRE"}
                    {project.status === "construction" && "CON"}
                    {project.status === "aftercare" && "AFT"}
                    {!project.status && "UNK"}
                  </button>
                  
                  <div className={`flex space-x-1 ${weekInfo?.hasPositiveRetention && project.status === 'aftercare' ? 'opacity-60' : ''}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit?.(project)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDelete?.(project)}
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
                    <div className={weekInfo.hasPositiveRetention && project.status === 'aftercare' ? 'opacity-60' : ''}>
                      <div className="flex items-center gap-[10px]">
                        <div className="flex items-center" title="Start on Site Date">
                          <span className="border px-1 py-0.5 rounded-l-sm" style={{ 
                            fontSize: '10px',
                            color: project.status === 'construction' ? 'rgb(31, 41, 55)' : 'white',
                            backgroundColor: (() => {
                              switch (project.status) {
                                case 'tender': return 'rgb(147, 197, 253)'; // light blue
                                case 'precon': return 'rgb(134, 239, 172)'; // light green
                                case 'construction': return 'rgb(254, 240, 138)'; // light yellow
                                case 'aftercare': return 'rgb(209, 213, 219)'; // light grey
                                default: return 'rgb(156, 163, 175)';
                              }
                            })(),
                            borderColor: (() => {
                              switch (project.status) {
                                case 'tender': return 'rgb(147, 197, 253)';
                                case 'precon': return 'rgb(134, 239, 172)';
                                case 'construction': return 'rgb(254, 240, 138)';
                                case 'aftercare': return 'rgb(209, 213, 219)';
                                default: return 'rgb(156, 163, 175)';
                              }
                            })()
                          }}>SOS</span>
                          <span className="bg-white text-black px-1 py-0.5 rounded-r-sm" style={{ 
                            fontSize: '10px',
                            borderTop: `1px solid ${(() => {
                              switch (project.status) {
                                case 'tender': return 'rgb(147, 197, 253)';
                                case 'precon': return 'rgb(134, 239, 172)';
                                case 'construction': return 'rgb(254, 240, 138)';
                                case 'aftercare': return 'rgb(209, 213, 219)';
                                default: return 'rgb(156, 163, 175)';
                              }
                            })()}`,
                            borderRight: `1px solid ${(() => {
                              switch (project.status) {
                                case 'tender': return 'rgb(147, 197, 253)';
                                case 'precon': return 'rgb(134, 239, 172)';
                                case 'construction': return 'rgb(254, 240, 138)';
                                case 'aftercare': return 'rgb(209, 213, 219)';
                                default: return 'rgb(156, 163, 175)';
                              }
                            })()}`,
                            borderBottom: `1px solid ${(() => {
                              switch (project.status) {
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
                        {project.status !== 'precon' && project.status !== 'tender' && (
                          <div className="flex items-center" title="Construction Practical Completion Date">
                            <span className="text-white border px-1 py-0.5 rounded-l-sm" style={{ 
                              fontSize: '10px',
                              backgroundColor: (() => {
                                switch (project.status) {
                                  case 'construction': return 'rgb(250, 204, 21)'; // middle yellow shade
                                  case 'aftercare': return 'rgb(156, 163, 175)'; // middle grey shade
                                  default: return 'rgb(147, 197, 253)';
                                }
                              })(),
                              borderColor: (() => {
                                switch (project.status) {
                                  case 'construction': return 'rgb(250, 204, 21)';
                                  case 'aftercare': return 'rgb(156, 163, 175)';
                                  default: return 'rgb(147, 197, 253)';
                                }
                              })()
                            }}>CONST</span>
                            <span className="bg-white text-black px-1 py-0.5 rounded-r-sm" style={{ 
                              fontSize: '10px',
                              borderTop: `1px solid ${(() => {
                                switch (project.status) {
                                  case 'construction': return 'rgb(250, 204, 21)';
                                  case 'aftercare': return 'rgb(156, 163, 175)';
                                  default: return 'rgb(147, 197, 253)';
                                }
                              })()}`,
                              borderRight: `1px solid ${(() => {
                                switch (project.status) {
                                  case 'construction': return 'rgb(250, 204, 21)';
                                  case 'aftercare': return 'rgb(156, 163, 175)';
                                  default: return 'rgb(147, 197, 253)';
                                }
                              })()}`,
                              borderBottom: `1px solid ${(() => {
                                switch (project.status) {
                                  case 'construction': return 'rgb(250, 204, 21)';
                                  case 'aftercare': return 'rgb(156, 163, 175)';
                                  default: return 'rgb(147, 197, 253)';
                                }
                              })()}`
                            }}>{weekInfo.anticipatedDate.toUpperCase()}</span>
                          </div>
                        )}

                        <div className="flex items-center" title="Contract Practical Completion Date">
                          <span className="text-white border px-1 py-0.5 rounded-l-sm" style={{ 
                            fontSize: '10px',
                            backgroundColor: (() => {
                              switch (project.status) {
                                case 'tender': return 'rgb(59, 130, 246)'; // dark blue
                                case 'precon': return 'rgb(34, 197, 94)'; // dark green
                                case 'construction': return 'rgb(234, 179, 8)'; // dark yellow
                                case 'aftercare': return 'rgb(107, 114, 128)'; // dark grey
                                default: return 'rgba(31, 41, 55, 0.7)';
                              }
                            })(),
                            borderColor: (() => {
                              switch (project.status) {
                                case 'tender': return 'rgb(59, 130, 246)';
                                case 'precon': return 'rgb(34, 197, 94)';
                                case 'construction': return 'rgb(234, 179, 8)';
                                case 'aftercare': return 'rgb(107, 114, 128)';
                                default: return 'rgb(107, 114, 128)';
                              }
                            })()
                          }}>CONTR</span>
                          <span className="bg-white text-black px-1 py-0.5 rounded-r-sm" style={{ 
                            fontSize: '10px',
                            borderTop: `1px solid ${(() => {
                              switch (project.status) {
                                case 'tender': return 'rgb(59, 130, 246)';
                                case 'precon': return 'rgb(34, 197, 94)';
                                case 'construction': return 'rgb(234, 179, 8)';
                                case 'aftercare': return 'rgb(107, 114, 128)';
                                default: return 'rgb(107, 114, 128)';
                              }
                            })()}`,
                            borderRight: `1px solid ${(() => {
                              switch (project.status) {
                                case 'tender': return 'rgb(59, 130, 246)';
                                case 'precon': return 'rgb(34, 197, 94)';
                                case 'construction': return 'rgb(234, 179, 8)';
                                case 'aftercare': return 'rgb(107, 114, 128)';
                                default: return 'rgb(107, 114, 128)';
                              }
                            })()}`,
                            borderBottom: `1px solid ${(() => {
                              switch (project.status) {
                                case 'tender': return 'rgb(59, 130, 246)';
                                case 'precon': return 'rgb(34, 197, 94)';
                                case 'construction': return 'rgb(234, 179, 8)';
                                case 'aftercare': return 'rgb(107, 114, 128)';
                                default: return 'rgb(107, 114, 128)';
                              }
                            })()}`
                          }}>{weekInfo.contractDate.toUpperCase()}</span>
                        </div>

                        {/* EEV indicator for construction projects */}
                        {project.status !== 'aftercare' && weekInfo && !weekInfo.hideWeekIndicator && !isZeroOrNegativeValue(project.value) && (
                          <div className="flex items-center" title="Estimated Earned Value">
                            <span className="text-white border px-1 py-0.5 rounded-l-sm" style={{ 
                              fontSize: '10px',
                              backgroundColor: 'rgb(115, 115, 115)',
                              borderColor: 'rgb(115, 115, 115)'
                            }}>
                              EEV
                            </span>
                            <span className="bg-white text-black border border-gray-300 px-1 py-0.5 rounded-r-sm" style={{ fontSize: '10px' }}>
                              {(() => {
                                const projectValueNum = parseFloat(project.value?.replace(/[£,]/g, '') || '0');
                                const weeklyValue = projectValueNum / weekInfo.totalWeeksToContract;
                                let evaValue = weeklyValue * weekInfo.currentWeek;
                                
                                const isLate = weekInfo.currentWeek > weekInfo.totalWeeksToContract;
                                if (isLate) {
                                  evaValue = Math.min(evaValue, projectValueNum);
                                }
                                
                                const percentComplete = Math.min((weekInfo.currentWeek / weekInfo.totalWeeksToContract) * 100, 100);
                                return `${formatValue(`£${evaValue}`)} (${percentComplete.toFixed(0)}%)`;
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
                <div className={`mt-2 relative flex items-center ${weekInfo.hasPositiveRetention && project.status === 'aftercare' ? 'opacity-60' : ''}`}>
                  <div className={`h-1 rounded-sm overflow-hidden flex ${
                    project.status === 'aftercare' ? 'bg-gray-200' : 'bg-gray-100'
                  }`} style={{ width: '95%' }}>
                    {(() => {
                      const currentWeek = weekInfo.currentWeek;
                      const totalWeeksToAnticipated = weekInfo.totalWeeksToAnticipated;
                      const totalWeeksToContract = weekInfo.totalWeeksToContract;
                      
                      if (weekInfo.isGreyedOut || weekInfo.hasPositiveRetention) {
                        return (
                          <div 
                            className="bg-gray-400 h-full opacity-40" 
                            style={{ width: '100%' }}
                            title="Project finished"
                          />
                        );
                      }
                      
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
                                  switch (project.status) {
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
                  {weekInfo && !weekInfo.hideWeekIndicator && (() => {
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
                              switch (project.status) {
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
                            if (project.status === 'precon' || project.status === 'tender') {
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
                      switch (project.status) {
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
        <div className={`flex justify-end relative ${weekInfo.hasPositiveRetention && project.status === 'aftercare' ? 'opacity-60' : ''}`} style={{ marginTop: '-3px', marginRight: '25px' }}>
          <div className="bg-white rounded-b-lg px-3 py-1.5 text-gray-600 inline-block italic flex justify-center" style={{ 
            fontSize: '11.73px', 
            zIndex: -1,
            border: `1px solid ${(() => {
              if (weekInfo.isGreyedOut || weekInfo.hasPositiveRetention) return 'rgba(204, 204, 204, 0.5)';
              switch (project.status) {
                case 'tender': return 'rgba(59, 130, 246, 0.5)';
                case 'precon': return 'rgba(34, 197, 94, 0.5)';
                case 'construction': return 'rgba(249, 115, 22, 0.5)';
                case 'aftercare': return 'rgba(168, 85, 247, 0.5)';
                default: return 'rgba(107, 114, 128, 0.5)';
              }
            })()}`
          }}>
            {weekInfo.isGreyedOut || weekInfo.hasPositiveRetention ? (
              <span className="text-gray-500 font-medium">Project Complete</span>
            ) : (
              <>
                {project.status === 'tender' || project.status === 'precon' ? (
                  <>Weeks to Completion <span className="font-bold" style={{ 
                    marginLeft: '3px', 
                    marginRight: '3px',
                    color: project.status === 'tender' ? 'rgb(59, 130, 246)' : 'rgb(34, 197, 94)'
                  }}>{Math.max(0, weekInfo.totalWeeksToContract - weekInfo.currentWeek)}</span></>
                ) : (
                  <>Weeks to Construction <span className="font-bold" style={{ 
                    marginLeft: '3px', 
                    marginRight: '3px',
                    color: project.status === 'construction' ? 'rgb(234, 179, 8)' : project.status === 'aftercare' ? 'rgb(107, 114, 128)' : 'rgb(59, 130, 246)'
                  }}>{Math.max(0, weekInfo.totalWeeksToAnticipated - weekInfo.currentWeek)}</span> Contract <span className="font-bold text-gray-800" style={{ marginLeft: '3px', marginRight: '3px' }}>{Math.max(0, weekInfo.totalWeeksToContract - weekInfo.currentWeek)}</span></>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}