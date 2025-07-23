import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus, Building2, Navigation, Map, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { createRoot } from "react-dom/client";
import { format } from "date-fns";

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
  const [hoverOverlay, setHoverOverlay] = useState<any>(null);
  const markersRef = useRef<any[]>([]);


  // Group projects by city (Yorkshire postcodes)
  const postcodeToCity: { [key: string]: string } = {
    'LS1 4DT': 'Leeds',
    'LS6 3HG': 'Leeds',
    'S1 2HE': 'Sheffield', 
    'YO19 5LJ': 'York',
    'BD1 1DB': 'Bradford',
    'BD18 3SE': 'Shipley',
    'YO1 7PR': 'York',
    'YO24 4AB': 'York',
    'YO31 0UR': 'York',
    'HG1 2RQ': 'Harrogate',
    'WF2 6SE': 'Wakefield',
    'HD3 4UY': 'Huddersfield',
    'HU1 3UB': 'Hull',
    'DN4 5HT': 'Doncaster'
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

    const yorkshireCenter = { lat: 53.8, lng: -1.5 }; // Yorkshire center
    const newMap = new window.google.maps.Map(mapRef.current, {
      center: yorkshireCenter,
      zoom: 8, // Start with closer zoom, will be adjusted by bounds
      styles: [
        {
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#f5f5f5"
            }
          ]
        },
        {
          "elementType": "labels.icon",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#616161"
            }
          ]
        },
        {
          "elementType": "labels.text.stroke",
          "stylers": [
            {
              "color": "#f5f5f5"
            }
          ]
        },
        {
          "featureType": "administrative.land_parcel",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#bdbdbd"
            }
          ]
        },
        {
          "featureType": "poi",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#eeeeee"
            }
          ]
        },
        {
          "featureType": "poi",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#757575"
            }
          ]
        },
        {
          "featureType": "poi.park",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#e5e5e5"
            }
          ]
        },
        {
          "featureType": "poi.park",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#9e9e9e"
            }
          ]
        },
        {
          "featureType": "road",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#ffffff"
            }
          ]
        },
        {
          "featureType": "road.arterial",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#757575"
            }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#dadada"
            }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#616161"
            }
          ]
        },
        {
          "featureType": "road.local",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#9e9e9e"
            }
          ]
        },
        {
          "featureType": "transit.line",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#e5e5e5"
            }
          ]
        },
        {
          "featureType": "transit.station",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#eeeeee"
            }
          ]
        },
        {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#c9c9c9"
            }
          ]
        },
        {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#9e9e9e"
            }
          ]
        }
      ]
    });

    setMap(newMap);
  }, [mapLoaded, projects, map]);

  // Add markers when map is ready
  useEffect(() => {
    if (!map || !projects.length) return;

    // Clear existing markers to prevent duplicates
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    console.log(`Creating markers for ${projects.length} projects`);

    // Add global click listener to close any open overlays
    const mapClickListener = map.addListener('click', () => {
      if (hoverOverlay) {
        hoverOverlay.setMap(null);
        setHoverOverlay(null);
      }
    });

    // React component for hover card content
    const HoverCardComponent = ({ project }: { project: Project }) => {
      const statusColors = {
        'tender': 'bg-blue-100 text-blue-800 border-blue-200',
        'precon': 'bg-green-100 text-green-800 border-green-200', 
        'construction': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'aftercare': 'bg-gray-100 text-gray-800 border-gray-200'
      };

      const statusIcons = {
        'tender': Building2,
        'precon': MapPin,
        'construction': Navigation,
        'aftercare': Map
      };

      const StatusIcon = statusIcons[project.status as keyof typeof statusIcons] || Building2;
      const duration = project.startOnSiteDate && project.contractCompletionDate 
        ? Math.ceil((new Date(project.contractCompletionDate).getTime() - new Date(project.startOnSiteDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Get city from postcode
      const city = project.postcode ? postcodeToCity[project.postcode] || project.postcode : 'Unknown Location';

      return (
        <Card className="w-80 shadow-lg border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {city}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <Badge 
                variant="secondary" 
                className={statusColors[project.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
              >
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{project.projectNumber}</span>
                </div>
                
                {duration && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{Math.round(duration / 7)} weeks</span>
                  </div>
                )}
                
                {project.value && (
                  <div className="flex items-center gap-1">
                    <span>£{Math.abs(parseFloat(project.value.replace(/[£,]/g, ''))).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    };

    // Custom overlay class for click cards
    class CustomOverlay extends window.google.maps.OverlayView {
      private position: any;
      private project: Project;
      public div: HTMLDivElement | null = null;
      private root: any = null;

      constructor(position: any, project: Project) {
        super();
        this.position = position;
        this.project = project;
      }

      onAdd() {
        this.div = document.createElement('div');
        this.div.style.position = 'absolute';
        this.div.style.pointerEvents = 'auto';
        this.div.style.zIndex = '9999';
        this.div.style.cursor = 'pointer';
        
        // Create React root and render component
        this.root = createRoot(this.div);
        this.root.render(<HoverCardComponent project={this.project} />);
        
        const panes = this.getPanes();
        panes?.floatPane.appendChild(this.div);
      }

      draw() {
        if (!this.div) return;
        
        const overlayProjection = this.getProjection();
        const position = overlayProjection.fromLatLngToDivPixel(this.position);
        
        if (position) {
          this.div.style.left = (position.x - 160) + 'px'; // Center horizontally
          this.div.style.top = (position.y - 180) + 'px'; // Position above marker
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          // Unmount React component
          if (this.root) {
            this.root.unmount();
            this.root = null;
          }
          
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    const geocoder = new window.google.maps.Geocoder();
    const bounds = new window.google.maps.LatLngBounds();
    let markersCreated = 0;
    const totalProjects = projects.filter(p => p.postcode).length;
    
    // Create individual markers for each project - one marker per project
    projects.forEach((project, index) => {
      if (!project.postcode) return;

      geocoder.geocode(
        { address: `${project.postcode}, UK` },
        (results: any[], status: string) => {
          if (status === 'OK' && results[0]) {
            const basePosition = results[0].geometry.location;
            
            // Add small deterministic offset based on project index to spread out markers
            const offsetRadius = 0.005; // Small offset radius
            const angle = (index * 137.5) % 360; // Golden angle spacing for even distribution
            const offsetLat = offsetRadius * Math.cos(angle * Math.PI / 180);
            const offsetLng = offsetRadius * Math.sin(angle * Math.PI / 180);
            
            const position = new window.google.maps.LatLng(
              basePosition.lat() + offsetLat,
              basePosition.lng() + offsetLng
            );
            
            // Add position to bounds
            bounds.extend(position);
            markersCreated++;
            
            // Create individual project marker
            const marker = new window.google.maps.Marker({
              position,
              map: map, // Show all markers immediately
              title: project.name,
              icon: {
                path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0",
                fillColor: '#706f6f',
                fillOpacity: 0.9,
                strokeColor: getPhaseColor(project.status),
                strokeWeight: 2.8,
                scale: 1.0,
                anchor: new window.google.maps.Point(0, 0),
              },
            });

            // Store marker reference for cleanup
            markersRef.current.push(marker);

            // Store overlay reference for this specific marker
            let currentOverlay: any = null;

            // Add click listener for individual markers
            marker.addListener('click', () => {
              // If this marker already has an overlay, remove it
              if (currentOverlay) {
                currentOverlay.setMap(null);
                currentOverlay = null;
                if (hoverOverlay === currentOverlay) {
                  setHoverOverlay(null);
                }
                return;
              }

              // Clean up any existing global overlay
              if (hoverOverlay) {
                hoverOverlay.setMap(null);
                setHoverOverlay(null);
              }
              
              // Create new overlay for this marker
              currentOverlay = new CustomOverlay(position, project);
              currentOverlay.setMap(map);
              setHoverOverlay(currentOverlay);

              // Add click handler to close when clicking the card
              setTimeout(() => {
                if (currentOverlay && currentOverlay.div) {
                  currentOverlay.div.addEventListener('click', (e: Event) => {
                    e.stopPropagation();
                    currentOverlay.setMap(null);
                    currentOverlay = null;
                    setHoverOverlay(null);
                  });
                }
              }, 100);
            });

            // Once all markers are created, fit bounds
            if (markersCreated === totalProjects) {
              map.fitBounds(bounds);
              
              // Set reasonable zoom level
              const listener = window.google.maps.event.addListener(map, 'idle', () => {
                if (map.getZoom() > 9) {
                  map.setZoom(9);
                }
                window.google.maps.event.removeListener(listener);
              });
            }
          }
        }
      );
    });





    // Cleanup function
    return () => {
      if (mapClickListener) {
        window.google.maps.event.removeListener(mapClickListener);
      }
      // Clean up markers on unmount
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [map, projects]);

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
              className="w-full rounded-lg"
              style={{ height: '500px' }}
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