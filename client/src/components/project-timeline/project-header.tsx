import { Calendar, MapPin, Clock, Pound } from "lucide-react";

interface ProjectHeaderProps {
  project: {
    projectNumber: string;
    name: string;
    status: string;
    startOnSiteDate: string;
    contractCompletionDate: string;
    constructionCompletionDate: string;
    value: string;
    retention: string;
    postcode: string;
    description: string;
  };
}

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'tender': return 'rgb(59, 130, 246)'; // blue-500
      case 'precon': return 'rgb(34, 197, 94)'; // green-500
      case 'construction': return 'rgb(234, 179, 8)'; // yellow-500
      case 'aftercare': return 'rgb(107, 114, 128)'; // gray-500
      default: return 'rgb(156, 163, 175)'; // gray-400
    }
  };

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case 'tender': return 'rgb(219, 234, 254)'; // blue-100
      case 'precon': return 'rgb(220, 252, 231)'; // green-100
      case 'construction': return 'rgb(254, 249, 195)'; // yellow-100
      case 'aftercare': return 'rgb(243, 244, 246)'; // gray-100
      default: return 'rgb(229, 231, 235)'; // gray-200
    }
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value.replace(/[£,]/g, ''));
    if (numValue < 0) {
      return `-£${Math.abs(numValue).toLocaleString()}`;
    }
    return `£${numValue.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div 
      className="rounded-lg p-6 mb-6"
      style={{ backgroundColor: getStatusBackgroundColor(project.status) }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {project.projectNumber} - {project.name}
          </h1>
          <div 
            className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: getStatusColor(project.status) }}
          >
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Start: {formatDate(project.startOnSiteDate)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Complete: {formatDate(project.constructionCompletionDate)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Pound className="h-4 w-4" />
          <span>Value: {formatCurrency(project.value)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{project.postcode}</span>
        </div>
      </div>

      <p className="text-gray-700 text-sm">{project.description}</p>
    </div>
  );
}