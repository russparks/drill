import { useState, useRef, useEffect } from "react";
import { FileText, Search, Settings, Layers, Code, Package, MapPin, ChevronDown } from "lucide-react";
import { ProjectHeader, PhaseFilters, TimelineCard } from "@/components/project-timeline";
import { useQuery } from "@tanstack/react-query";

const sampleProject1 = {
  id: 19,
  projectNumber: "W0013",
  name: "Municipal Water Treatment",
  status: "construction",
  startOnSiteDate: "2024-06-01T00:00:00.000Z",
  contractCompletionDate: "2025-10-30T00:00:00.000Z",
  constructionCompletionDate: "2025-08-15T00:00:00.000Z",
  value: "£12300000",
  retention: "£0.6",
  postcode: "DN4 5HT",
  description: "Advanced water treatment facility upgrade with modern filtration systems, automated monitoring, and environmental compliance features. Capacity expansion to serve growing municipal population."
};

const sampleProject2 = {
  id: 17,
  projectNumber: "L0011",
  name: "Luxury Hotel Development",
  status: "construction",
  startOnSiteDate: "2024-05-01T00:00:00.000Z",
  contractCompletionDate: "2027-06-15T00:00:00.000Z",
  constructionCompletionDate: "2027-05-10T00:00:00.000Z",
  value: "£22500000",
  retention: "£1.1",
  postcode: "YO31 0UR",
  description: "Five-star hotel with conference facilities, spa, restaurants, and premium amenities. Sustainable building practices with green roof systems and energy-efficient climate control."
};

const samplePhases1 = [
  { key: 'tender', label: 'Tender', count: 12, value: '£2.4M' },
  { key: 'precon', label: 'Precon', count: 8, value: '£1.8M' },
  { key: 'construction', label: 'Construction', count: 24, value: '£15.2M' },
  { key: 'aftercare', label: 'Aftercare', count: 3, value: '£0.5M' }
];

const samplePhases2 = [
  { key: 'tender', label: 'Tender', count: 5, value: '£890K' },
  { key: 'precon', label: 'Precon', count: 15, value: '£3.2M' },
  { key: 'construction', label: 'Construction', count: 45, value: '£28.7M' },
  { key: 'aftercare', label: 'Aftercare', count: 2, value: '£180K' }
];

export default function Components() {
  const [activeTab, setActiveTab] = useState("timeline");
  const [activePhases1, setActivePhases1] = useState(['tender', 'precon', 'construction', 'aftercare']);
  const [activePhases2, setActivePhases2] = useState(['precon', 'construction']);
  const [isPackageDropdownOpen, setIsPackageDropdownOpen] = useState(false);
  const [selectedPackageProject, setSelectedPackageProject] = useState(sampleProject1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all projects for the dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects']
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPackageDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePhaseToggle1 = (phase: string) => {
    setActivePhases1(prev => 
      prev.includes(phase) 
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    );
  };

  const handlePhaseToggle2 = (phase: string) => {
    setActivePhases2(prev => 
      prev.includes(phase) 
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Component Library Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-gray-900">Component Library</h1>
          </div>
          <p className="text-gray-600 mb-4">Interactive showcase of reusable UI components for project management</p>
          <hr className="border-gray-200" />
        </div>

        {/* Component Title */}
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-700">Tabbed Navigation</h3>
        </div>

        {/* Tab Navigation with subtle background */}
        <div className="mb-9 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="grid w-full" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            <div 
              className={`flex flex-col items-center gap-1 cursor-pointer group ${
                activeTab === "timeline" ? "text-gray-700" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("timeline")}
            >
              <Layers className={`h-6 w-6 ${activeTab === "timeline" ? "text-[#333333]" : "text-gray-400"}`} />
              <span className="text-base">Timeline</span>
            </div>
            <div 
              className={`flex flex-col items-center gap-1 cursor-pointer group ${
                activeTab === "widgets" ? "text-gray-700" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("widgets")}
            >
              <Package className={`h-6 w-6 ${activeTab === "widgets" ? "text-[#333333]" : "text-gray-400"}`} />
              <span className="text-base">Widgets</span>
            </div>
            <div 
              className={`flex flex-col items-center gap-1 cursor-pointer group ${
                activeTab === "forms" ? "text-gray-700" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("forms")}
            >
              <FileText className={`h-6 w-6 ${activeTab === "forms" ? "text-[#333333]" : "text-gray-400"}`} />
              <span className="text-base">Forms</span>
            </div>
            <div 
              className={`flex flex-col items-center gap-1 cursor-pointer group ${
                activeTab === "utilities" ? "text-gray-700" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("utilities")}
            >
              <Code className={`h-6 w-6 ${activeTab === "utilities" ? "text-[#333333]" : "text-gray-400"}`} />
              <span className="text-base">Utilities</span>
            </div>
            <div 
              className={`flex flex-col items-center gap-1 cursor-pointer group ${
                activeTab === "settings" ? "text-gray-700" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("settings")}
            >
              <Settings className={`h-6 w-6 ${activeTab === "settings" ? "text-[#333333]" : "text-gray-400"}`} />
              <span className="text-base">Settings</span>
            </div>
          </div>
        </div>
        
        <hr className="border-gray-200 mt-[20px] mb-[20px]" />

        {/* Tab Content */}
        {activeTab === "timeline" && (
          <>
            {/* Timeline Card Examples */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Phase Timeline</h3>
              <TimelineCard project={sampleProject1} />
              <hr className="border-gray-200 mt-[20px] mb-[20px]" />
            </div>

            {/* Package Timeline Examples */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Package Timeline</h3>
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm relative z-10 pl-[10px] pr-[10px] pt-[13.5px] pb-[13.5px]">
                <div className="flex items-baseline gap-1 mb-0.5">
                  <div className="text-lg flex items-center mt-[3px] mb-[3px]">
                    <span className="font-normal text-sm" style={{
                      color: (() => {
                        switch (selectedPackageProject.status) {
                          case 'tender': return 'rgb(59, 130, 246)'; // blue
                          case 'precon': return 'rgb(34, 197, 94)'; // green
                          case 'construction': return 'rgb(234, 179, 8)'; // yellow
                          case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                          default: return 'rgb(55, 65, 81)'; // default gray-700
                        }
                      })()
                    }}>{selectedPackageProject.projectNumber}</span> 
                    <span className="font-light mx-1" style={{
                      color: (() => {
                        switch (selectedPackageProject.status) {
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
                        switch (selectedPackageProject.status) {
                          case 'tender': return 'rgb(59, 130, 246)'; // blue
                          case 'precon': return 'rgb(34, 197, 94)'; // green
                          case 'construction': return 'rgb(234, 179, 8)'; // yellow
                          case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                          default: return 'inherit'; // default color
                        }
                      })()
                    }}>{selectedPackageProject.name}</span>
                  </div>
                </div>
                
                <div className="flex items-end gap-4 mb-1" style={{ marginTop: '15px' }}>
                  <div className="flex items-center justify-end gap-1 w-24">
                    <span className="text-xs font-medium text-gray-700">Main Project</span>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    {/* Timeline bar with week markers */}
                    <div className="relative h-2 mb-3" style={{ marginTop: '-16px' }}>
                      {/* Week numbers above timeline */}
                      {(() => {
                        const startDate = new Date(selectedPackageProject.startOnSiteDate);
                        const contractDate = new Date(selectedPackageProject.contractCompletionDate);
                        const totalWeeks = Math.ceil((contractDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                        
                        // Calculate week positions: week 1, interim weeks every 4 weeks, and last week
                        const weekPositions = [];
                        
                        // Add week 1
                        weekPositions.push({ week: 1, position: 0 });
                        
                        // Add interim weeks every 4 weeks, but omit the last one to avoid clashing with final week
                        for (let week = 4; week < totalWeeks; week += 4) {
                          // Skip if this interim week is too close to the final week
                          if (week >= totalWeeks - 3) {
                            break;
                          }
                          const position = (week / totalWeeks) * 100;
                          weekPositions.push({ week, position });
                        }
                        
                        // Add last week
                        weekPositions.push({ week: totalWeeks, position: 100 });
                        
                        return weekPositions.map((item, i) => (
                          <div
                            key={i}
                            className="absolute text-gray-400"
                            style={{
                              left: `${item.position}%`,
                              top: '-12px',
                              fontSize: '8px',
                              transform: i === 0 ? 'translateX(0%)' : i === weekPositions.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)'
                            }}
                          >
                            w{item.week}
                          </div>
                        ));
                      })()}
                      
                      {/* Horizontal timeline line */}
                      <div className="absolute top-1/2 w-full h-px bg-gray-400"></div>
                      
                      {/* Week markers */}
                      {(() => {
                        // Calculate total project duration from start to contract completion
                        const startDate = new Date(selectedPackageProject.startOnSiteDate);
                        const contractDate = new Date(selectedPackageProject.contractCompletionDate);
                        const totalWeeks = Math.ceil((contractDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                        
                        // Use 2-week intervals if project duration > 70 weeks, otherwise 1-week
                        const weekInterval = totalWeeks > 70 ? 2 : 1;
                        const markerCount = Math.ceil(totalWeeks / weekInterval) + 1; // Total markers + 1 for end marker
                        
                        return Array.from({ length: markerCount }, (_, i) => (
                          <div
                            key={i}
                            className="absolute bg-gray-400"
                            style={{
                              left: `${(i / (markerCount - 1)) * 100}%`,
                              bottom: '0px',
                              width: '1px',
                              height: '5px',
                              transform: 'translateX(-0.5px)'
                            }}
                          />
                        ));
                      })()}
                    </div>
                    
                    {/* Main Project progress bar */}
                    <div className="h-[5px] relative">
                      <div className="h-full bg-gray-100 rounded-sm overflow-hidden flex">
                        {(() => {
                        // Use the same progress bar logic as Phase Timeline card
                        if (!selectedPackageProject.startOnSiteDate || !selectedPackageProject.contractCompletionDate || !selectedPackageProject.constructionCompletionDate) {
                          return <div className="bg-gray-300 h-full opacity-65" style={{ width: '100%' }} />;
                        }

                        const startDate = new Date(selectedPackageProject.startOnSiteDate);
                        const contractDate = new Date(selectedPackageProject.contractCompletionDate);
                        const constructionDate = new Date(selectedPackageProject.constructionCompletionDate);
                        const currentDate = new Date();

                        const totalWeeksToContract = Math.ceil((contractDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
                        const totalWeeksToAnticipated = Math.ceil((constructionDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
                        const currentWeek = Math.ceil((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

                        const retentionValue = parseFloat(selectedPackageProject.retention?.replace(/[£,]/g, '') || '0');
                        const isPastContractDate = currentDate > contractDate;
                        const isProjectCompleted = (retentionValue === 0 && selectedPackageProject.status === 'aftercare') || 
                                                 (isPastContractDate && selectedPackageProject.status !== 'aftercare');
                        const hasPositiveRetention = retentionValue > 0;

                        // Grey out completed projects or projects with positive retention in aftercare
                        if (isProjectCompleted || (hasPositiveRetention && selectedPackageProject.status === 'aftercare')) {
                          return (
                            <div 
                              className="bg-gray-400 h-full" 
                              style={{ width: '100%' }}
                              title="Project finished"
                            />
                          );
                        }
                        
                        // Use the exact same progress bar logic as timeline card
                        const greyPercent = Math.min((Math.max(1, currentWeek) / totalWeeksToContract) * 100, 100);
                        const lightBluePercent = Math.max(0, Math.min(((totalWeeksToAnticipated - Math.max(1, currentWeek)) / totalWeeksToContract) * 100, 100 - greyPercent));
                        const amberPercent = Math.max(0, ((totalWeeksToContract - totalWeeksToAnticipated) / totalWeeksToContract) * 100);
                        
                        return (
                          <>
                            {greyPercent > 0 && (
                              <div 
                                className="bg-gray-400 h-full" 
                                style={{ width: `${greyPercent}%` }}
                                title={`Elapsed: ${Math.max(1, currentWeek)} weeks`}
                              />
                            )}
                            {lightBluePercent > 0 && (
                              <div 
                                className="h-full" 
                                style={{ 
                                  width: `${lightBluePercent}%`,
                                  backgroundColor: (() => {
                                    switch (selectedPackageProject.status) {
                                      case 'tender': return 'rgb(59, 130, 246)'; // blue
                                      case 'precon': return 'rgb(34, 197, 94)'; // green
                                      case 'construction': return 'rgb(234, 179, 8)'; // yellow
                                      case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                                      default: return 'rgb(147, 197, 253)';
                                    }
                                  })()
                                }}
                                title={`Remaining to anticipated: ${Math.max(0, totalWeeksToAnticipated - Math.max(1, currentWeek))} weeks`}
                              />
                            )}
                            {amberPercent > 0 && (
                              <div 
                                className="bg-gray-800 h-full" 
                                style={{ width: `${amberPercent}%` }}
                                title={`Buffer to contract: ${totalWeeksToContract - totalWeeksToAnticipated} weeks`}
                              />
                            )}
                          </>
                        );
                      })()}
                      </div>

                    </div>
                  </div>
                </div>
                <hr className="border-gray-200 mt-[5px] mb-[5px]" />
                <div className="flex flex-col gap-2">
                  {(() => {
                    // Calculate total project weeks for positioning
                    const startDate = new Date(selectedPackageProject.startOnSiteDate);
                    const contractDate = new Date(selectedPackageProject.contractCompletionDate);
                    const totalWeeks = Math.ceil((contractDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                    
                    // Calculate construction completion week (anticipated completion)
                    const constructionDate = new Date(selectedPackageProject.constructionCompletionDate);
                    const constructionWeeks = Math.ceil((constructionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                    
                    // Define package durations with realistic construction sequencing
                    const packages = [
                      { name: 'Foundations', startWeek: 2, duration: 12, color: 'rgb(139, 69, 19)' }, // brown - weeks 2-14
                      { name: 'Envelope', startWeek: 8, duration: 18, color: 'rgb(34, 197, 94)' }, // green - weeks 8-26
                      { name: 'Internals', startWeek: 20, duration: Math.max(16, constructionWeeks - 24), color: 'rgb(59, 130, 246)' }, // blue - overlapping with envelope
                      { name: 'MEP', startWeek: 25, duration: Math.max(12, constructionWeeks - 29), color: 'rgb(234, 179, 8)' }, // yellow - overlapping with internals
                      { name: 'Externals', startWeek: Math.max(30, constructionWeeks - 8), duration: 8, color: 'rgb(168, 85, 247)' } // purple - finishes around 2 weeks before construction completion
                    ];
                    
                    return packages.map((pkg, index) => (
                      <div key={index} className="flex items-center h-[11px]">
                        {/* Package title */}
                        <div className="flex items-center justify-end gap-1 w-24 text-right">
                          <span className="text-xs font-medium text-gray-700">{pkg.name}</span>
                        </div>
                        
                        {/* Progress bar container with dashed line */}
                        <div className="flex-1 ml-4 h-[5px] relative">
                          {/* Horizontal dashed line behind progress bars */}
                          <div className="absolute inset-0 flex items-center z-0" style={{ top: '-1px', right: '10px' }}>
                            <div className="w-full h-px border-t border-dashed border-gray-400" style={{ opacity: 0.5 }}></div>
                          </div>

                          {/* Package duration bar with elapsed weeks shading */}
                          <div
                            className="h-full absolute z-20 rounded"
                            style={{
                              top: '-1px',
                              left: `${(pkg.startWeek / totalWeeks) * 100}%`,
                              width: `${(pkg.duration / totalWeeks) * 100}%`
                            }}
                          >
                            {(() => {
                              // Calculate current week for elapsed shading
                              const currentDate = new Date();
                              const currentWeek = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                              const packageEndWeek = pkg.startWeek + pkg.duration;
                              
                              // Calculate elapsed portion within this package
                              const elapsedInPackage = Math.max(0, Math.min(currentWeek - pkg.startWeek, pkg.duration));
                              const elapsedPercent = elapsedInPackage / pkg.duration * 100;
                              const remainingPercent = 100 - elapsedPercent;
                              
                              return (
                                <>
                                  {/* Elapsed portion (light gray) */}
                                  {elapsedPercent > 0 && (
                                    <div
                                      className="h-full bg-gray-300"
                                      style={{
                                        width: `${elapsedPercent}%`,
                                        float: 'left'
                                      }}
                                      title={`${pkg.name} elapsed: ${elapsedInPackage} weeks`}
                                    />
                                  )}
                                  {/* Remaining portion (yellow construction color) */}
                                  {remainingPercent > 0 && (
                                    <div
                                      className="h-full"
                                      style={{
                                        backgroundColor: 'rgb(234, 179, 8)', // Construction color (yellow)
                                        width: `${remainingPercent}%`,
                                        float: 'left'
                                      }}
                                      title={`${pkg.name} remaining: ${pkg.duration - elapsedInPackage} weeks`}
                                    />
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
              
              {/* Package Timeline Dropdown */}
              <div className="relative text-[12px] font-thin" style={{ marginTop: '3px', marginLeft: '25px', width: 'fit-content', zIndex: 0 }}>
                <div className="relative inline-block" ref={dropdownRef}>
                  <button
                    onClick={() => setIsPackageDropdownOpen(!isPackageDropdownOpen)}
                    className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-[#5e5e5e] pl-[9px] pr-[9px] pt-[3px] pb-[3px] mt-[-9px] mb-[-9px]"
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                  >
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform ${isPackageDropdownOpen ? 'rotate-180' : ''}`}
                      style={{
                        color: (() => {
                          switch (selectedPackageProject.status) {
                            case 'tender': return 'rgb(59, 130, 246)'; // blue
                            case 'precon': return 'rgb(34, 197, 94)'; // green
                            case 'construction': return 'rgb(234, 179, 8)'; // yellow
                            case 'aftercare': return 'rgb(107, 114, 128)'; // grey
                            default: return 'rgb(107, 114, 128)'; // default gray
                          }
                        })()
                      }}
                    />
                  </button>
                  
                  {isPackageDropdownOpen && (
                    <div className="absolute left-0 top-full w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto mt-[-22px] mb-[-22px] ml-[28px] mr-[28px] pt-[3px] pb-[3px]">
                      <div className="py-1">
                        {(() => {
                          // Filter to only include construction and aftercare projects, then sort
                          const filteredProjects = (projects as any[]).filter(project => 
                            project.status === 'construction' || project.status === 'aftercare'
                          );
                          const sortedProjects = [...filteredProjects].sort((a, b) => {
                            const getProjectInfo = (project: any) => {
                              const retentionValue = parseFloat(project.retention?.replace(/[£,]/g, '') || '0');
                              const contractDate = new Date(project.contractCompletionDate);
                              const currentDate = new Date();
                              const isPastContractDate = currentDate > contractDate;
                              
                              // A project is completed if:
                              // 1. It's in aftercare with zero retention, OR
                              // 2. It's past contract completion date (regardless of status)
                              const isCompleted = (project.status === 'aftercare' && retentionValue === 0) || 
                                                isPastContractDate;
                              
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
                            
                            const orderDiff = getOrderValue(aInfo) - getOrderValue(bInfo);
                            
                            // If same order value (same phase and completion status), sort by most recent first
                            if (orderDiff === 0) {
                              // For completed projects in same phase, sort by most recent completion date
                              if (aInfo.isCompleted && bInfo.isCompleted) {
                                const aDate = new Date(a.contractCompletionDate);
                                const bDate = new Date(b.contractCompletionDate);
                                return bDate.getTime() - aDate.getTime(); // Most recent first
                              }
                              // For live projects in same phase, sort by start date (most recent first)
                              else {
                                const aStart = new Date(a.startOnSiteDate);
                                const bStart = new Date(b.startOnSiteDate);
                                return bStart.getTime() - aStart.getTime(); // Most recent first
                              }
                            }
                            
                            return orderDiff;
                          });
                          
                          return sortedProjects.map((proj: any) => {
                            const getPhaseColors = (status: string) => {
                              switch (status) {
                                case 'tender': return { bg: 'bg-blue-50', border: 'border-l-blue-500' };
                                case 'precon': return { bg: 'bg-green-50', border: 'border-l-green-500' };
                                case 'construction': return { bg: 'bg-yellow-50', border: 'border-l-yellow-500' };
                                case 'aftercare': return { bg: 'bg-gray-50', border: 'border-l-gray-500' };
                                default: return { bg: 'bg-gray-50', border: 'border-l-gray-500' };
                              }
                            };
                            
                            const colors = getPhaseColors(proj.status);
                            
                            return (
                              <button
                                key={proj.id}
                                onClick={() => {
                                  setSelectedPackageProject(proj);
                                  setIsPackageDropdownOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1 hover:bg-gray-100 transition-colors border-l-4 ${
                                  proj.id === selectedPackageProject.id ? `${colors.bg} ${colors.border}` : 'border-l-transparent'
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
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <hr className="border-gray-200 mt-[20px] mb-[20px]" />
            </div>

            
          </>
        )}

        {/* Other tab content placeholders */}
        {activeTab === "widgets" && (
          <div className="text-center py-12 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Widgets content coming soon...</p>
          </div>
        )}

        {activeTab === "forms" && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Forms content coming soon...</p>
          </div>
        )}

        {activeTab === "utilities" && (
          <div className="text-center py-12 text-gray-500">
            <Code className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Utilities content coming soon...</p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="text-center py-12 text-gray-500">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Settings content coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}