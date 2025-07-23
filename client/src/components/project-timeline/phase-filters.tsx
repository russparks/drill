interface PhaseFiltersProps {
  activePhases: string[];
  onPhaseToggle: (phase: string) => void;
  phases: Array<{
    key: string;
    label: string;
    count: number;
    value: string;
  }>;
}

export default function PhaseFilters({ activePhases, onPhaseToggle, phases }: PhaseFiltersProps) {
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'tender': return '#3b82f6'; // blue-500
      case 'precon': return '#22c55e'; // green-500
      case 'construction': return '#eab308'; // yellow-500
      case 'aftercare': return '#6b7280'; // gray-500
      default: return '#9ca3af'; // gray-400
    }
  };

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {phases.map((phase) => {
        const isActive = activePhases.includes(phase.key);
        return (
          <button
            key={phase.key}
            onClick={() => onPhaseToggle(phase.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 border-dashed ${
              isActive 
                ? 'text-white' 
                : 'text-gray-600 bg-white hover:bg-gray-50'
            }`}
            style={{
              backgroundColor: isActive ? getPhaseColor(phase.key) : 'white',
              borderColor: getPhaseColor(phase.key),
            }}
          >
            <div className="text-left">
              <div className="font-medium">{phase.label}</div>
              <div className="text-xs opacity-90">{phase.value}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}