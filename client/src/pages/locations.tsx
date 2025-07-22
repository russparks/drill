import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus, Building2, Navigation, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Locations() {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Group projects by city
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

  const projectsByCity = projects.reduce((acc, project) => {
    const city = project.postcode ? postcodeToCity[project.postcode] || 'Unknown' : 'Unknown';
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(project);
    return acc;
  }, {} as { [key: string]: Project[] });

  const getPhaseColor = (status: string) => {
    switch (status) {
      case 'tender': return 'rgb(59, 130, 246)'; // blue
      case 'precon': return 'rgb(34, 197, 94)'; // green
      case 'construction': return 'rgb(234, 179, 8)'; // yellow
      case 'aftercare': return 'rgb(107, 114, 128)'; // grey
      default: return 'rgb(107, 114, 128)';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
              <p className="text-gray-600">Project locations across the UK</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {Object.keys(projectsByCity).length} cities • {projects.length} projects
            </span>
          </div>
        </div>
      </div>


      {/* Location Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(projectsByCity).map(([city, cityProjects]) => (
          <Card key={city} className="material-shadow hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
                {city}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {cityProjects.length} project{cityProjects.length !== 1 ? 's' : ''}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cityProjects.map((project) => (
                  <div 
                    key={project.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {project.projectNumber}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full" style={{
                          backgroundColor: `${getPhaseColor(project.status)}20`,
                          color: getPhaseColor(project.status),
                        }}>
                          {project.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {project.name}
                      </p>
                      {project.postcode && (
                        <p className="text-xs text-gray-500 mt-1">
                          {project.postcode}
                        </p>
                      )}
                    </div>
                    <div className="ml-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getPhaseColor(project.status) }}
                        title={`${project.status.charAt(0).toUpperCase() + project.status.slice(1)} phase`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Location Summary */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Phases:</span>
                  <div className="flex gap-1">
                    {['tender', 'precon', 'construction', 'aftercare'].map(phase => {
                      const count = cityProjects.filter(p => p.status === phase).length;
                      if (count === 0) return null;
                      return (
                        <span 
                          key={phase}
                          className="px-1.5 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: `${getPhaseColor(phase)}20`,
                            color: getPhaseColor(phase),
                          }}
                        >
                          {count}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="material-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(projectsByCity).length}
            </div>
            <div className="text-sm text-gray-600">Cities</div>
          </CardContent>
        </Card>
        
        <Card className="material-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {projects.length}
            </div>
            <div className="text-sm text-gray-600">Total Projects</div>
          </CardContent>
        </Card>
        
        <Card className="material-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {projects.filter(p => p.status === 'construction').length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        
        <Card className="material-shadow">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {(projects.filter(p => p.postcode && p.postcode.includes('London')).length > 0 ? 
                Math.round((projects.filter(p => p.postcode && ['SW1A 1AA', 'E1 6AN', 'SE1 7TP'].includes(p.postcode)).length / projects.length) * 100) : 0)}%
            </div>
            <div className="text-sm text-gray-600">London</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}