import { Card, CardContent, CardTitle } from "@/components/ui/card";

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
}

export default function TimelineCard({ project }: TimelineCardProps) {
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
              <div className={`flex items-center gap-2 mb-0.5 ${weekInfo?.hasPositiveRetention ? 'opacity-60' : ''}`}>
                <CardTitle className="text-lg flex items-center">
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
                  }}>{project.name}{project.postcode && (
                    <span style={{ 
                      fontSize: '0.7em',
                      color: (() => {
                        switch (project.status) {
                          case 'tender': return 'rgb(59, 130, 246)'; // blue
                          case 'precon': return 'rgb(34, 197, 94)'; // green
                          case 'construction': return 'rgb(234, 179, 8)'; // yellow
                          case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                          default: return 'inherit';
                        }
                      })(),
                      opacity: 0.8
                    }}>
                      {`, ${(() => {
                        const postcodeToCity: { [key: string]: string } = {
                          'SW1A 1AA': 'London',
                          'M1 1AA': 'Manchester',
                          'B1 1TT': 'Birmingham',
                          'E1 6AN': 'London',
                          'LS1 2TW': 'Leeds',
                          'NE1 7RU': 'Newcastle',
                          'CB2 1TN': 'Cambridge',
                          'BS1 6XN': 'Bristol',
                          'SE1 7TP': 'London',
                          'CF10 3NP': 'Cardiff',
                          'G1 2FF': 'Glasgow',
                          'RG1 3EH': 'Reading',
                          'NG1 5DT': 'Nottingham',
                          'L1 8JQ': 'Liverpool',
                          'DN4 5HT': 'Doncaster',
                          'YO31 0UR': 'York',
                          'LS6 3HG': 'Leeds',
                          'YO19 5LJ': 'York',
                          'WF2 6SE': 'Wakefield'
                        };
                        return postcodeToCity[project.postcode] || 'UK';
                      })()}`}
                    </span>
                  )}</span>
                </CardTitle>
                {project.value && (
                  <span className="text-sm text-action-text-secondary">
                    (<span className={isZeroOrNegativeValue(project.value) ? 'text-red-400' : ''}>{formatValue(project.value)}</span>)
                  </span>
                )}
                {/* Process indicator */}
                <div className="ml-auto">
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
                </div>
              </div>
              {weekInfo && (
                <div className="flex items-center justify-between" style={{ fontSize: '10px' }}>
                  <div className="flex items-center" style={{ gap: '10px' }}>
                    {/* Indicators that get greyed out for projects with positive retention */}
                    <div className={weekInfo.hasPositiveRetention ? 'opacity-60' : ''}>
                      <div className="flex items-center gap-[10px]">
                        <div className="flex items-center" title="Start on Site Date">
                          <span className="border px-1 py-0.5 rounded-l-sm" style={{ 
                            fontSize: '10px',
                            color: project.status === 'construction' ? 'rgb(31, 41, 55)' : 'white', // mid grey font for construction
                            backgroundColor: (() => {
                              switch (project.status) {
                                case 'tender': return 'rgb(147, 197, 253)'; // light blue
                                case 'precon': return 'rgb(134, 239, 172)'; // light green
                                case 'construction': return 'rgb(254, 240, 138)'; // light yellow
                                case 'aftercare': return 'rgb(209, 213, 219)'; // light grey
                                default: return 'rgb(156, 163, 175)'; // default gray-400
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
                        {/* Hide CONSTR indicator for precon and tender projects */}
                        {project.status !== 'precon' && project.status !== 'tender' && (
                          <div className="flex items-center" title="Construction Practical Completion Date">
                            <span className="text-white border px-1 py-0.5 rounded-l-sm" style={{ 
                              fontSize: '10px',
                              backgroundColor: (() => {
                                switch (project.status) {
                                  case 'construction': return 'rgb(250, 204, 21)'; // middle yellow shade
                                  case 'aftercare': return 'rgb(156, 163, 175)'; // middle grey shade
                                  default: return 'rgb(147, 197, 253)'; // default blue-300
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
                                default: return 'rgba(31, 41, 55, 0.7)'; // default dark gray
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
                        {/* EVA indicator for non-aftercare projects with non-zero values */}
                        {project.status !== 'aftercare' && weekInfo && !weekInfo.hideWeekIndicator && !isZeroOrNegativeValue(project.value) && (
                          <div className="flex items-center" title="Estimated Earned Value - calculated as (Project Value ÷ Total Weeks) × Weeks Completed">
                            <span className="text-white border px-1 py-0.5 rounded-l-sm" style={{ 
                              fontSize: '10px',
                              backgroundColor: 'rgb(115, 115, 115)', // 55% black (45% opacity from black)
                              borderColor: 'rgb(115, 115, 115)'
                            }}>
                              EEV
                            </span>
                            <span className="bg-white text-black border border-gray-300 px-1 py-0.5 rounded-r-sm" style={{ fontSize: '10px' }}>
                              {(() => {
                                const projectValueNum = parseFloat(project.value?.replace(/[£,]/g, '') || '0');
                                const weeklyValue = projectValueNum / weekInfo.totalWeeksToContract;
                                let evaValue = weeklyValue * weekInfo.currentWeek;
                                
                                // Cap EEV at project value for late projects
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
                    {/* Retention display for aftercare projects only - always full opacity */}
                    {project.status === 'aftercare' && (
                      <div className="flex items-center" title="Project Retention Value">
                        <span className="text-white px-1 py-0.5 rounded-l-sm border" style={{ 
                          fontSize: '10px',
                          backgroundColor: isZeroOrNegativeValue(project.retention) ? 'rgb(4, 120, 87)' : 'rgb(248, 113, 113)', // emerald-700 : red-400
                          borderColor: isZeroOrNegativeValue(project.retention) ? 'rgb(4, 120, 87)' : 'rgb(248, 113, 113)'
                        }}>
                          RET
                        </span>
                        <span className="bg-white text-black px-1 py-0.5 rounded-r-sm" style={{ 
                          fontSize: '10px',
                          borderTop: `1px solid ${isZeroOrNegativeValue(project.retention) ? 'rgb(4, 120, 87)' : 'rgb(248, 113, 113)'}`, // emerald-700 : red-400
                          borderRight: `1px solid ${isZeroOrNegativeValue(project.retention) ? 'rgb(4, 120, 87)' : 'rgb(248, 113, 113)'}`,
                          borderBottom: `1px solid ${isZeroOrNegativeValue(project.retention) ? 'rgb(4, 120, 87)' : 'rgb(248, 113, 113)'}`
                        }}>
                          {formatValue(project.retention)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}