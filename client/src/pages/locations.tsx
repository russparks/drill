import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus, Building2, Navigation, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

// Declare global google variable for TypeScript
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function Locations() {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);

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

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        setMapLoaded(true);
        return;
      }

      // Since GOOGLE_MAPS_API_KEY is not prefixed with VITE_, we need to get it from the server
      fetch('/api/google-maps-key')
        .then(res => res.text())
        .then(apiKey => {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
          script.async = true;
          script.defer = true;
          script.onload = () => setMapLoaded(true);
          document.head.appendChild(script);
        })
        .catch(err => {
          console.error('Failed to load Google Maps API key:', err);
        });
    };

    loadGoogleMaps();
  }, []);

  // Initialize map when Google Maps is loaded and we have projects
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !projects.length || map) return;

    const ukCenter = { lat: 54.5, lng: -2.0 }; // Approximate UK center
    const newMap = new window.google.maps.Map(mapRef.current, {
      center: ukCenter,
      zoom: 6,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    setMap(newMap);
  }, [mapLoaded, projects, map]);

  // Add markers when map is ready
  useEffect(() => {
    if (!map || !projects.length) return;

    const infoWindow = new window.google.maps.InfoWindow();

    // Approximate coordinates for UK cities (hardcoded to avoid Geocoding API requirement)
    const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
      'London': { lat: 51.5074, lng: -0.1278 },
      'Manchester': { lat: 53.4808, lng: -2.2426 },
      'Birmingham': { lat: 52.4862, lng: -1.8904 },
      'Leeds': { lat: 53.8008, lng: -1.5491 },
      'Glasgow': { lat: 55.8642, lng: -4.2518 },
      'Liverpool': { lat: 53.4084, lng: -2.9916 },
      'Edinburgh': { lat: 55.9533, lng: -3.1883 },
      'Bristol': { lat: 51.4545, lng: -2.5879 },
      'Cardiff': { lat: 51.4816, lng: -3.1791 },
      'Sheffield': { lat: 53.3811, lng: -1.4701 },
      'Newcastle': { lat: 54.9783, lng: -1.6178 },
      'Nottingham': { lat: 52.9548, lng: -1.1581 },
      'Leicester': { lat: 52.6369, lng: -1.1398 },
      'Coventry': { lat: 52.4068, lng: -1.5197 },
      'Bradford': { lat: 53.7960, lng: -1.7594 },
      'Stoke-on-Trent': { lat: 53.0027, lng: -2.1794 },
      'Wolverhampton': { lat: 52.5855, lng: -2.1282 },
      'Plymouth': { lat: 50.3755, lng: -4.1427 },
      'Derby': { lat: 52.9225, lng: -1.4746 },
      'Southampton': { lat: 50.9097, lng: -1.4044 },
      'Salford': { lat: 53.4875, lng: -2.2901 },
      'Aberdeen': { lat: 57.1497, lng: -2.0943 },
      'Portsmouth': { lat: 50.8198, lng: -1.0880 },
      'York': { lat: 53.9600, lng: -1.0873 },
      'Peterborough': { lat: 52.5695, lng: -0.2405 },
      'Dundee': { lat: 56.4620, lng: -2.9707 },
      'Lancaster': { lat: 54.0466, lng: -2.8007 },
      'Oxford': { lat: 51.7520, lng: -1.2577 },
      'Cambridge': { lat: 52.2053, lng: 0.1218 },
      'Exeter': { lat: 50.7184, lng: -3.5339 },
      'Bath': { lat: 51.3811, lng: -2.3590 },
      'Chelmsford': { lat: 51.7356, lng: 0.4685 },
      'Preston': { lat: 53.7632, lng: -2.7031 },
    };

    // Group projects by city to avoid duplicate markers
    Object.entries(projectsByCity).forEach(([city, cityProjects]) => {
      if (city === 'Unknown') return;
      
      // Find coordinates for this city
      const cityCoords = cityCoordinates[city];
      if (!cityCoords) {
        // For cities not in our list, try to approximate based on postcode area
        const firstProject = cityProjects[0];
        if (!firstProject.postcode) return;
        
        // Basic postcode area mapping (first 1-2 letters)
        const postcodeArea = firstProject.postcode.split(/\d/)[0].toUpperCase();
        const postcodeCoords: { [key: string]: { lat: number; lng: number } } = {
          'B': { lat: 52.4862, lng: -1.8904 }, // Birmingham
          'M': { lat: 53.4808, lng: -2.2426 }, // Manchester
          'LS': { lat: 53.8008, lng: -1.5491 }, // Leeds
          'L': { lat: 53.4084, lng: -2.9916 }, // Liverpool
          'S': { lat: 53.3811, lng: -1.4701 }, // Sheffield
          'E': { lat: 51.5074, lng: -0.1278 }, // East London
          'N': { lat: 51.5074, lng: -0.1278 }, // North London
          'SW': { lat: 51.5074, lng: -0.1278 }, // Southwest London
          'SE': { lat: 51.5074, lng: -0.1278 }, // Southeast London
          'W': { lat: 51.5074, lng: -0.1278 }, // West London
          'NW': { lat: 51.5074, lng: -0.1278 }, // Northwest London
          'EC': { lat: 51.5074, lng: -0.1278 }, // East Central London
          'WC': { lat: 51.5074, lng: -0.1278 }, // West Central London
        };
        
        const coords = postcodeCoords[postcodeArea];
        if (!coords) return;
        
        createMarker(coords, city, cityProjects, infoWindow);
      } else {
        createMarker(cityCoords, city, cityProjects, infoWindow);
      }
    });

    function createMarker(position: { lat: number; lng: number }, city: string, cityProjects: Project[], infoWindow: any) {
      // Get the most advanced phase for marker color
      const phases = ['tender', 'precon', 'construction', 'aftercare'];
      const mostAdvancedPhase = cityProjects.reduce((advanced, project) => {
        const currentIndex = phases.indexOf(project.status);
        const advancedIndex = phases.indexOf(advanced);
        return currentIndex > advancedIndex ? project.status : advanced;
      }, 'tender');

      // Create marker
      const marker = new window.google.maps.Marker({
        position,
        map,
        title: `${city} (${cityProjects.length} projects)`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: getPhaseColor(mostAdvancedPhase),
          fillOpacity: 0.9,
          strokeColor: 'white',
          strokeWeight: 3,
        },
      });

      // Create info window content
      const infoContent = `
        <div style="padding: 8px; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; color: #374151; font-size: 16px;">${city}</h3>
          <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">${cityProjects.length} project${cityProjects.length !== 1 ? 's' : ''}</p>
          <div style="max-height: 120px; overflow-y: auto;">
            ${cityProjects.map(project => `
              <div style="margin-bottom: 6px; padding: 4px; background: #F9FAFB; border-radius: 4px;">
                <div style="font-weight: 500; color: #111827; font-size: 12px;">${project.projectNumber}</div>
                <div style="color: #6B7280; font-size: 11px; margin-top: 2px;">${project.name}</div>
                <div style="color: ${getPhaseColor(project.status)}; font-size: 10px; text-transform: uppercase; margin-top: 2px;">${project.status}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      marker.addListener('click', () => {
        infoWindow.setContent(infoContent);
        infoWindow.open(map, marker);
      });
    }
  }, [map, projects, projectsByCity]);

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

      {/* Google Maps */}
      <div className="mb-8">
        <Card className="material-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-blue-600" />
              Project Locations Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapRef} 
              className="w-full h-96 rounded-lg"
              style={{ minHeight: '400px' }}
            >
              {!mapLoaded && (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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