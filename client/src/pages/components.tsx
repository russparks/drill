import { useState } from "react";
import { FileText, Search, Settings, Layers, Code, Package, MapPin } from "lucide-react";
import { ProjectHeader, PhaseFilters, TimelineCard } from "@/components/project-timeline";

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
        
        <hr className="border-gray-200 mb-8" />

        {/* Tab Content */}
        {activeTab === "timeline" && (
          <>
            {/* Timeline Card Examples */}
            <section className="mb-16">

              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Phase Timeline</h3>
                  <TimelineCard project={sampleProject1} />
                </div>
                
                {/* <div>
                  <div className="border-l-4 border-gray-200 pl-4 mb-4">
                    <h3 className="text-lg font-medium text-gray-700">Example 2: Construction Phase Timeline (Large Project)</h3>
                    <p className="text-sm text-gray-500">Timeline for larger scale projects</p>
                  </div>
                  <TimelineCard project={sampleProject2} />
                </div> */}
              </div>
            </section>

            {/* Project Header Examples */}
            <section className="mb-16">
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Project Header</h3>
                  <ProjectHeader project={sampleProject1} />
                </div>
                
                {/* <div>
                  <div className="border-l-4 border-gray-200 pl-4 mb-4">
                    <h3 className="text-lg font-medium text-gray-700">Example 2: Precon Phase Project</h3>
                    <p className="text-sm text-gray-500">Header for precon phase projects</p>
                  </div>
                  <ProjectHeader project={sampleProject2} />
                </div> */}
              </div>
            </section>

            {/* Phase Filters Examples */}
            <section className="mb-16">
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Phase Filters</h3>
                  <PhaseFilters 
                    activePhases={activePhases2}
                    onPhaseToggle={handlePhaseToggle2}
                    phases={samplePhases2}
                  />
                </div>
              </div>
            </section>
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