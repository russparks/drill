import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

interface Project {
  id: number;
  projectNumber: string;
  name: string;
  description?: string;
  status: string;
  value?: string;
  retention?: string;
  startOnSiteDate?: string;
  contractCompletionDate?: string;
  constructionCompletionDate?: string;
  postcode?: string;
}

export default function W0013() {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Find the W0013 project
  const w0013Project = projects?.find(p => p.projectNumber === "W0013");

  const isZeroOrNegativeValue = (value?: string) => {
    if (!value) return false;
    const numValue = parseFloat(value.replace(/[£,\s]/g, ''));
    return numValue <= 0;
  };

  const formatValue = (value?: string) => {
    if (!value) return '';
    
    // Clean the value string and parse
    const cleanValue = value.replace(/[£,\s]/g, '');
    const numValue = parseFloat(cleanValue);
    
    if (isNaN(numValue)) return value;
    
    // If negative, show as is with £ symbol
    if (numValue < 0) {
      return `£${numValue.toFixed(1)}k`;
    }
    
    // Format based on magnitude
    if (numValue >= 1000000) {
      return `£${(numValue / 1000000).toFixed(1)}m`;
    } else if (numValue >= 1000) {
      return `£${(numValue / 1000).toFixed(1)}k`;
    }
    return `£${numValue.toFixed(1)}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
        <div>Loading...</div>
      </div>
    );
  }

  if (!w0013Project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
        <div>Project W0013 not found</div>
      </div>
    );
  }

  // Calculate current project week and totals
  const getCurrentWeekInfo = () => {
    if (!w0013Project.startOnSiteDate || !w0013Project.constructionCompletionDate || !w0013Project.contractCompletionDate) {
      return null;
    }
    
    const startDate = new Date(w0013Project.startOnSiteDate);
    const anticipatedDate = new Date(w0013Project.constructionCompletionDate);
    const contractDate = new Date(w0013Project.contractCompletionDate);
    const currentDate = new Date();
    
    // Check if project end dates have passed or project is completed
    const hasPreconEnded = w0013Project.status === 'precon' && currentDate > contractDate;
    const hasTenderEnded = w0013Project.status === 'tender' && currentDate > contractDate;
    const hasConstructionEnded = w0013Project.status === 'construction' && currentDate > contractDate;
    const isCompleted = w0013Project.status === 'aftercare';
    const isFinished = hasPreconEnded || hasTenderEnded || hasConstructionEnded || isCompleted;
    
    // For aftercare projects, check if retention is positive
    const hasPositiveRetention = w0013Project.status === 'aftercare' && !isZeroOrNegativeValue(w0013Project.retention);
    const shouldGreyOutCompletely = isFinished && !hasPositiveRetention;
    
    const currentWeek = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const totalWeeksToAnticipated = Math.ceil((anticipatedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const totalWeeksToContract = Math.ceil((contractDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    
    return {
      currentWeek: Math.max(1, currentWeek),
      totalWeeksToAnticipated: Math.max(1, totalWeeksToAnticipated),
      totalWeeksToContract: Math.max(1, totalWeeksToContract),
      startDate: startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
      anticipatedDate: anticipatedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
      contractDate: contractDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
      hideWeekIndicator: isFinished,
      isGreyedOut: shouldGreyOutCompletely,
      hasPositiveRetention: hasPositiveRetention
    };
  };

  const weekInfo = getCurrentWeekInfo();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
      {/* W0013 Project Card */}
      <div className={weekInfo?.isGreyedOut ? 'opacity-60' : ''}>
        <Card className="material-shadow">
          <CardContent className="p-2.5 pb-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className={`flex items-center gap-2 mb-0.5 ${weekInfo?.hasPositiveRetention ? 'opacity-60' : ''}`}>
                  <CardTitle className="text-lg flex items-center">
                    <span className="font-normal text-sm" style={{
                      color: (() => {
                        switch (w0013Project.status) {
                          case 'tender': return 'rgb(59, 130, 246)'; // blue
                          case 'precon': return 'rgb(34, 197, 94)'; // green
                          case 'construction': return 'rgb(234, 179, 8)'; // yellow
                          case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                          default: return 'rgb(55, 65, 81)'; // default gray-700
                        }
                      })()
                    }}>{w0013Project.projectNumber}</span> <span className="font-light mx-1" style={{
                      color: (() => {
                        switch (w0013Project.status) {
                          case 'tender': return 'rgb(59, 130, 246)'; // blue
                          case 'precon': return 'rgb(34, 197, 94)'; // green
                          case 'construction': return 'rgb(234, 179, 8)'; // yellow
                          case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                          default: return 'inherit';
                        }
                      })()
                    }}>|</span> <span style={{
                      color: (() => {
                        switch (w0013Project.status) {
                          case 'tender': return 'rgb(59, 130, 246)'; // blue
                          case 'precon': return 'rgb(34, 197, 94)'; // green
                          case 'construction': return 'rgb(234, 179, 8)'; // yellow
                          case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                          default: return 'inherit'; // default color
                        }
                      })()
                    }}>{w0013Project.name}{w0013Project.postcode && (
                      <span style={{ 
                        fontSize: '0.7em',
                        color: (() => {
                          switch (w0013Project.status) {
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
                            'L1 8JQ': 'Liverpool'
                          };
                          return postcodeToCity[w0013Project.postcode] || 'UK';
                        })()}`}
                      </span>
                    )}</span>
                  </CardTitle>
                  {w0013Project.value && (
                    <span className="text-sm text-action-text-secondary">
                      (<span className={isZeroOrNegativeValue(w0013Project.value) ? 'text-red-400' : ''}>{formatValue(w0013Project.value)}</span>)
                    </span>
                  )}
                  {/* Process indicator */}
                  <div className="ml-auto">
                    <button
                      className={`
                        rounded-full px-2 py-0.5 text-xs font-medium border transition-colors
                        ${w0013Project.status === "tender" ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
                        ${w0013Project.status === "precon" ? "bg-green-100 text-green-800 border-green-200" : ""}
                        ${w0013Project.status === "construction" ? "bg-yellow-100 text-yellow-800 border-yellow-200" : ""}
                        ${w0013Project.status === "aftercare" ? "bg-gray-100 text-gray-800 border-gray-200" : ""}
                        ${!w0013Project.status ? "bg-gray-100 text-gray-800 border-gray-200" : ""}
                      `}
                    >
                      {w0013Project.status === "tender" && "TEN"}
                      {w0013Project.status === "precon" && "PRE"}
                      {w0013Project.status === "construction" && "CON"}
                      {w0013Project.status === "aftercare" && "AFT"}
                      {!w0013Project.status && "UNK"}
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
                              color: w0013Project.status === 'construction' ? 'rgb(31, 41, 55)' : 'white', // mid grey font for construction
                              backgroundColor: (() => {
                                switch (w0013Project.status) {
                                  case 'tender': return 'rgb(147, 197, 253)'; // light blue
                                  case 'precon': return 'rgb(134, 239, 172)'; // light green
                                  case 'construction': return 'rgb(254, 240, 138)'; // light yellow
                                  case 'aftercare': return 'rgb(209, 213, 219)'; // light grey
                                  default: return 'rgb(156, 163, 175)'; // default gray-400
                                }
                              })(),
                              borderColor: (() => {
                                switch (w0013Project.status) {
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
                                switch (w0013Project.status) {
                                  case 'tender': return 'rgb(147, 197, 253)';
                                  case 'precon': return 'rgb(134, 239, 172)';
                                  case 'construction': return 'rgb(254, 240, 138)';
                                  case 'aftercare': return 'rgb(209, 213, 219)';
                                  default: return 'rgb(156, 163, 175)';
                                }
                              })()}`,
                              borderRight: `1px solid ${(() => {
                                switch (w0013Project.status) {
                                  case 'tender': return 'rgb(147, 197, 253)';
                                  case 'precon': return 'rgb(134, 239, 172)';
                                  case 'construction': return 'rgb(254, 240, 138)';
                                  case 'aftercare': return 'rgb(209, 213, 219)';
                                  default: return 'rgb(156, 163, 175)';
                                }
                              })()}`,
                              borderBottom: `1px solid ${(() => {
                                switch (w0013Project.status) {
                                  case 'tender': return 'rgb(147, 197, 253)';
                                  case 'precon': return 'rgb(134, 239, 172)';
                                  case 'construction': return 'rgb(254, 240, 138)';
                                  case 'aftercare': return 'rgb(209, 213, 219)';
                                  default: return 'rgb(156, 163, 175)';
                                }
                              })()}`
                            }}>{weekInfo.startDate}</span>
                          </div>

                          <div className="flex items-center" title="Anticipated PC Date">
                            <span className="border px-1 py-0.5 rounded-l-sm" style={{ 
                              fontSize: '10px',
                              color: w0013Project.status === 'construction' ? 'rgb(31, 41, 55)' : 'white',
                              backgroundColor: (() => {
                                switch (w0013Project.status) {
                                  case 'tender': return 'rgb(147, 197, 253)';
                                  case 'precon': return 'rgb(134, 239, 172)';
                                  case 'construction': return 'rgb(254, 240, 138)';
                                  case 'aftercare': return 'rgb(209, 213, 219)';
                                  default: return 'rgb(156, 163, 175)';
                                }
                              })(),
                              borderColor: (() => {
                                switch (w0013Project.status) {
                                  case 'tender': return 'rgb(147, 197, 253)';
                                  case 'precon': return 'rgb(134, 239, 172)';
                                  case 'construction': return 'rgb(254, 240, 138)';
                                  case 'aftercare': return 'rgb(209, 213, 219)';
                                  default: return 'rgb(156, 163, 175)';
                                }
                              })()
                            }}>APC</span>
                            <span className="bg-white text-black px-1 py-0.5 rounded-r-sm" style={{ 
                              fontSize: '10px',
                              borderTop: `1px solid ${(() => {
                                switch (w0013Project.status) {
                                  case 'tender': return 'rgb(147, 197, 253)';
                                  case 'precon': return 'rgb(134, 239, 172)';
                                  case 'construction': return 'rgb(254, 240, 138)';
                                  case 'aftercare': return 'rgb(209, 213, 219)';
                                  default: return 'rgb(156, 163, 175)';
                                }
                              })()}`,
                              borderRight: `1px solid ${(() => {
                                switch (w0013Project.status) {
                                  case 'tender': return 'rgb(147, 197, 253)';
                                  case 'precon': return 'rgb(134, 239, 172)';
                                  case 'construction': return 'rgb(254, 240, 138)';
                                  case 'aftercare': return 'rgb(209, 213, 219)';
                                  default: return 'rgb(156, 163, 175)';
                                }
                              })()}`,
                              borderBottom: `1px solid ${(() => {
                                switch (w0013Project.status) {
                                  case 'tender': return 'rgb(147, 197, 253)';
                                  case 'precon': return 'rgb(134, 239, 172)';
                                  case 'construction': return 'rgb(254, 240, 138)';
                                  case 'aftercare': return 'rgb(209, 213, 219)';
                                  default: return 'rgb(156, 163, 175)';
                                }
                              })()}`
                            }}>{weekInfo.anticipatedDate}</span>
                          </div>

                          <div className="flex items-center" title="Contract PC Date">
                            <span className="border px-1 py-0.5 rounded-l-sm" style={{ 
                              fontSize: '10px',
                              color: w0013Project.status === 'construction' ? 'rgb(31, 41, 55)' : 'white',
                              backgroundColor: (() => {
                                switch (w0013Project.status) {
                                  case 'tender': return 'rgb(147, 197, 253)';
                                  case 'precon': return 'rgb(134, 239, 172)';
                                  case 'construction': return 'rgb(254, 240, 138)';
                                  case 'aftercare': return 'rgb(209, 213, 219)';
                                  default: return 'rgb(156, 163, 175)';
                                }
                              })(),
                              borderColor: (() => {
                                switch (w0013Project.status) {
                                  case 'tender': return 'rgb(147, 197, 253)';
                                  case 'precon': return 'rgb(134, 239, 172)';
                                  case 'construction': return 'rgb(254, 240, 138)';
                                  case 'aftercare': return 'rgb(209, 213, 219)';
                                  default: return 'rgb(156, 163, 175)';
                                }
                              })()
                            }}>CPC</span>
                            <span className="bg-white text-black px-1 py-0.5 rounded-r-sm" style={{ 
                              fontSize: '10px',
                              borderTop: `1px solid ${(() => {
                                switch (w0013Project.status) {
                                  case 'tender': return 'rgb(147, 197, 253)';
                                  case 'precon': return 'rgb(134, 239, 172)';
                                  case 'construction': return 'rgb(254, 240, 138)';
                                  case 'aftercare': return 'rgb(209, 213, 219)';
                                  default: return 'rgb(156, 163, 175)';
                                }
                              })()}`,
                              borderRight: `1px solid ${(() => {
                                switch (w0013Project.status) {
                                  case 'tender': return 'rgb(147, 197, 253)';
                                  case 'precon': return 'rgb(134, 239, 172)';
                                  case 'construction': return 'rgb(254, 240, 138)';
                                  case 'aftercare': return 'rgb(209, 213, 219)';
                                  default: return 'rgb(156, 163, 175)';
                                }
                              })()}`,
                              borderBottom: `1px solid ${(() => {
                                switch (w0013Project.status) {
                                  case 'tender': return 'rgb(147, 197, 253)';
                                  case 'precon': return 'rgb(134, 239, 172)';
                                  case 'construction': return 'rgb(254, 240, 138)';
                                  case 'aftercare': return 'rgb(209, 213, 219)';
                                  default: return 'rgb(156, 163, 175)';
                                }
                              })()}`
                            }}>{weekInfo.contractDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Week indicator - only show if not greyed out for positive retention */}
                    {!weekInfo.hideWeekIndicator && !weekInfo.hasPositiveRetention && (
                      <div className="flex items-center gap-1">
                        <div style={{ fontSize: '10px', color: '#666' }}>
                          Week {weekInfo.currentWeek} of {weekInfo.totalWeeksToAnticipated}
                        </div>
                        <div className="flex items-center">
                          <div 
                            className="h-1.5 rounded-full"
                            style={{
                              width: '50px',
                              backgroundColor: (() => {
                                switch (w0013Project.status) {
                                  case 'tender': return 'rgb(219, 234, 254)'; // very light blue
                                  case 'precon': return 'rgb(220, 252, 231)'; // very light green
                                  case 'construction': return 'rgb(254, 249, 195)'; // very light yellow
                                  case 'aftercare': return 'rgb(243, 244, 246)'; // very light grey
                                  default: return 'rgb(229, 231, 235)'; // default gray-200
                                }
                              })()
                            }}
                          >
                            <div 
                              className="h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, (weekInfo.currentWeek / weekInfo.totalWeeksToAnticipated) * 100)}%`,
                                backgroundColor: (() => {
                                  switch (w0013Project.status) {
                                    case 'tender': return 'rgb(59, 130, 246)'; // blue-500
                                    case 'precon': return 'rgb(34, 197, 94)'; // green-500
                                    case 'construction': return 'rgb(234, 179, 8)'; // yellow-500
                                    case 'aftercare': return 'rgb(107, 114, 128)'; // gray-500
                                    default: return 'rgb(156, 163, 175)'; // default gray-400
                                  }
                                })()
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}