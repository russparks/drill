import { useState } from "react";
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Component Library</h1>
          <p className="text-gray-600">Reusable components for project timeline pages</p>
        </div>

        {/* Timeline Card Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Timeline Card Component</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Example 1: Construction Phase Timeline</h3>
              <TimelineCard project={sampleProject1} />
            </div>
            
            {/* <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Example 2: Construction Phase Timeline (Large Project)</h3>
              <TimelineCard project={sampleProject2} />
            </div> */}
          </div>
        </section>

        {/* Project Header Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Project Header Component</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Example 1: Construction Phase Project</h3>
              <ProjectHeader project={sampleProject1} />
            </div>
            
            {/* <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Example 2: Precon Phase Project</h3>
              <ProjectHeader project={sampleProject2} />
            </div> */}
          </div>
        </section>

        {/* Phase Filters Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Phase Filters Component</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Example 1: All Phases Active</h3>
              <PhaseFilters 
                activePhases={activePhases1}
                onPhaseToggle={handlePhaseToggle1}
                phases={samplePhases1}
              />
              <div className="mt-4 p-4 bg-white rounded-lg border">
                <p className="text-sm text-gray-600">
                  Active phases: {activePhases1.join(', ')}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Example 2: Selective Phase Filtering</h3>
              <PhaseFilters 
                activePhases={activePhases2}
                onPhaseToggle={handlePhaseToggle2}
                phases={samplePhases2}
              />
              <div className="mt-4 p-4 bg-white rounded-lg border">
                <p className="text-sm text-gray-600">
                  Active phases: {activePhases2.join(', ')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Usage Instructions */}
        <section className="bg-white rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Usage Instructions</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Import Components:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`import { ProjectHeader, PhaseFilters } from "@/components/project-timeline";`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">ProjectHeader Props:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>project: Object with projectNumber, name, status, dates, value, retention, postcode, description</li>
                <li>Automatically handles status colors and formatting</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">PhaseFilters Props:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>activePhases: Array of currently active phase keys</li>
                <li>onPhaseToggle: Function to handle phase toggle (phase: string) =&gt; void</li>
                <li>phases: Array of phase objects with key, label, count, value</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Available Utility Functions:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>getStatusColor(status) - Returns color for project status</li>
                <li>getStatusBackgroundColor(status) - Returns background color</li>
                <li>formatCurrency(value) - Formats currency values</li>
                <li>formatDate(dateString) - Formats dates to GB locale</li>
                <li>calculateWeekInfo(project) - Calculates week progression</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}