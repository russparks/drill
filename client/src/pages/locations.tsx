import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus, Building2, Navigation, Map, Calendar, DollarSign, Filter } from "lucide-react";
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
  const currentOverlayRef = useRef<any>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(['tender', 'precon', 'construction', 'aftercare']);
  const [hasInitializedZoom, setHasInitializedZoom] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);


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

  // Demo sequence effect
  useEffect(() => {
    if (!isDemoMode || !map || !projects.length) return;

    const phases = ['tender', 'precon', 'construction', 'aftercare'];
    
    const runDemo = async () => {
      // Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show each phase one by one
      for (let i = 0; i < phases.length; i++) {
        setActiveFilters([phases[i]]);
        setDemoStep(i + 1);
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
      
      // Show all phases together
      await new Promise(resolve => setTimeout(resolve, 500));
      setActiveFilters(['tender', 'precon', 'construction', 'aftercare']);
      
      // End demo mode
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsDemoMode(false);
      setDemoStep(0);
    };

    runDemo();
  }, [map, projects.length]);



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
          script.onload = () => {
            setMapLoaded(true);
          };
          script.onerror = (err) => {
            console.error('Failed to load Google Maps script:', err);
          };
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

    // Add global click listener to close any open overlays
    const mapClickListener = map.addListener('click', () => {
      if (currentOverlayRef.current) {
        currentOverlayRef.current.fadeOut(() => {
          currentOverlayRef.current = null;
          setHoverOverlay(null);
        });
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

      const duration = project.startOnSiteDate && project.contractCompletionDate 
        ? Math.ceil((new Date(project.contractCompletionDate).getTime() - new Date(project.startOnSiteDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Get city from postcode
      const city = project.postcode ? postcodeToCity[project.postcode] || project.postcode : 'Unknown Location';

      // Format value to 1 decimal place with k/m suffix
      const formatValue = (value: string) => {
        const num = Math.abs(parseFloat(value.replace(/[£,]/g, '')));
        if (num >= 1000000) {
          return `£${(num / 1000000).toFixed(1)}m`;
        } else if (num >= 1000) {
          return `£${(num / 1000).toFixed(1)}k`;
        }
        return `£${num.toFixed(1)}`;
      };

      // Phase order and styling
      const phaseOrder = ['tender', 'precon', 'construction', 'aftercare'];
      const currentPhaseIndex = phaseOrder.indexOf(project.status);

      return (
        <Card className="w-fit min-w-64 max-w-96 shadow-lg border-2 rounded-2xl">
          <CardHeader className="pb-3 px-4">
            <CardTitle className="text-lg font-semibold leading-tight">
              {project.name} <span className="text-xs font-normal opacity-70">{project.projectNumber}</span>
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {city}
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-4 pb-4">
            <div className="space-y-3 flex flex-col h-full">
              <div className="flex flex-wrap gap-4 text-sm">
                {duration && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{Math.round(duration / 7)} weeks</span>
                  </div>
                )}
                
                {project.value && (
                  <div className="flex items-center gap-1">
                    <span>{formatValue(project.value)}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-auto flex gap-1">
                {phaseOrder.map((phase, index) => {
                  const isActive = index === currentPhaseIndex;
                  const phaseColors = {
                    'tender': isActive ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-400 border-gray-200',
                    'precon': isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-400 border-gray-200', 
                    'construction': isActive ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-gray-100 text-gray-400 border-gray-200',
                    'aftercare': isActive ? 'bg-gray-100 text-gray-800 border-gray-200' : 'bg-gray-100 text-gray-400 border-gray-200'
                  };
                  
                  return (
                    <Badge 
                      key={phase}
                      variant="secondary" 
                      className={`text-xs px-2 py-1 ${phaseColors[phase as keyof typeof phaseColors]}`}
                    >
                      {phase.charAt(0).toUpperCase() + phase.slice(1)}
                    </Badge>
                  );
                })}
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
        this.div.style.opacity = '0';
        this.div.style.transition = 'opacity 0.2s ease-in-out';
        
        // Create React root and render component
        this.root = createRoot(this.div);
        this.root.render(<HoverCardComponent project={this.project} />);
        
        const panes = this.getPanes();
        panes?.floatPane.appendChild(this.div);
        
        // Trigger fade in after a brief delay
        setTimeout(() => {
          if (this.div) {
            this.div.style.opacity = '1';
          }
        }, 50);
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

      fadeOut(callback?: () => void) {
        if (this.div) {
          this.div.style.opacity = '0';
          setTimeout(() => {
            this.onRemove();
            if (callback) callback();
          }, 200); // Wait for fade out animation
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

    const bounds = new window.google.maps.LatLngBounds();
    let markersCreated = 0;
    const totalProjects = projects.filter(p => p.latitude && p.longitude).length;
    
    // Create individual markers for each project using stored coordinates
    projects.forEach((project, index) => {
      if (!project.latitude || !project.longitude) return;
      
      // Filter projects based on active filters
      if (!activeFilters.includes(project.status)) return;

      // Use stored coordinates directly
      const basePosition = new window.google.maps.LatLng(
        parseFloat(project.latitude),
        parseFloat(project.longitude)
      );
      
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
      
      // Phase-based color coding for pins
      const phaseColors = {
        tender: { fill: '#87ceeb', stroke: '#0ea5e9' },    // Light blue fill, dark blue stroke
        precon: { fill: '#86efac', stroke: '#10b981' },    // Light green fill, dark green stroke
        construction: { fill: '#fcd34d', stroke: '#f59e0b' }, // Light yellow fill, dark yellow stroke
        aftercare: { fill: '#d1d5db', stroke: '#6b7280' }  // Light gray fill, dark gray stroke
      };

      const colors = phaseColors[project.status as keyof typeof phaseColors] || phaseColors.aftercare;

      // Create individual project marker
      const marker = new window.google.maps.Marker({
        position,
        map: map, // Show all markers immediately
        title: project.name,
        icon: {
          path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
          fillColor: colors.fill,
          fillOpacity: 1.0,
          strokeColor: colors.stroke,
          strokeWeight: 1,
          scale: 1.0,
          anchor: new window.google.maps.Point(0, 0),
        },
      });

      // Store marker reference for cleanup
      markersRef.current.push(marker);

      // Add click listener for individual markers
      marker.addListener('click', () => {
        // Function to create new overlay
        const createNewOverlay = () => {
          // Smoothly pan to the clicked project's exact coordinates
          map.panTo(basePosition);
          
          // Create new overlay immediately (don't wait for pan)
          const newOverlay = new CustomOverlay(position, project);
          newOverlay.setMap(map);
          currentOverlayRef.current = newOverlay;
          setHoverOverlay(newOverlay);

          // Add click handler to close when clicking the card
          setTimeout(() => {
            if (newOverlay && newOverlay.div) {
              newOverlay.div.addEventListener('click', (e: Event) => {
                e.stopPropagation();
                newOverlay.fadeOut(() => {
                  currentOverlayRef.current = null;
                  setHoverOverlay(null);
                });
              });
            }
          }, 100);
        };

        // If there's already an overlay showing, fade it out then create new one
        if (currentOverlayRef.current) {
          currentOverlayRef.current.fadeOut(() => {
            currentOverlayRef.current = null;
            setHoverOverlay(null);
            createNewOverlay();
          });
        } else {
          // No existing overlay, create new one directly
          createNewOverlay();
        }
      });
    });



    // Only fit bounds and set zoom on initial load, not when filters change
    if (markersCreated > 0 && !hasInitializedZoom) {
      map.fitBounds(bounds);
      
      // Set reasonable zoom level (decreased by 5% from 9 to 8.55)
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 8.55) {
          map.setZoom(8.55);
        }
        setHasInitializedZoom(true);
        window.google.maps.event.removeListener(listener);
      });
    }





    // Cleanup function
    return () => {
      if (mapClickListener) {
        window.google.maps.event.removeListener(mapClickListener);
      }
      // Clean up any active overlay
      if (currentOverlayRef.current) {
        currentOverlayRef.current.setMap(null);
        currentOverlayRef.current = null;
        setHoverOverlay(null);
      }
      // Clean up markers on unmount
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [map, projects, activeFilters]);

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
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Locations</h1>
            <p className="text-gray-600">Interactive map view of all projects</p>
          </div>
        </div>
      </div>

      {/* Google Maps */}
      <div className="mb-8 mt-6">
        <Card className="material-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-blue-600" />
                Project Locations
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 relative">
                  {['tender', 'precon', 'construction', 'aftercare'].map((phase) => {
                    const isActive = activeFilters.includes(phase);
                    const phaseProjects = projects.filter(p => p.status === phase);
                    const phaseColors = {
                      tender: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', circle: 'bg-blue-600' },
                      precon: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', circle: 'bg-green-600' },
                      construction: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', circle: 'bg-yellow-600' },
                      aftercare: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', circle: 'bg-gray-600' }
                    };
                    const colors = phaseColors[phase as keyof typeof phaseColors];
                    
                    // Calculate total value for this phase
                    const totalValue = phaseProjects.reduce((sum, project) => {
                      let valueStr = project.value || '0';
                      
                      // For aftercare phase, use retention value instead
                      if (phase === 'aftercare' && project.retention) {
                        valueStr = project.retention;
                      }
                      
                      // Clean the value string and parse
                      const cleanValue = valueStr.replace(/[£,\s]/g, '');
                      const value = parseFloat(cleanValue) || 0;
                      // Use absolute value to handle negative tender values
                      return sum + Math.abs(value);
                    }, 0);
                    
                    // Format value
                    const formatValue = (value: number) => {
                      if (value === 0) {
                        return '£0.0k';
                      }
                      if (value >= 1000000) {
                        return `£${(value / 1000000).toFixed(1)}m`;
                      } else if (value >= 1000) {
                        return `£${(value / 1000).toFixed(1)}k`;
                      }
                      return `£${value.toFixed(1)}`;
                    };
                    
                    return (
                      <div key={phase} className="relative">
                        {/* Value Tab - positioned behind button */}
                        <div 
                          className={`absolute bg-white border border-gray-200 rounded-b-lg px-2 py-1 text-xs font-medium ${colors.text} z-0 text-center`}
                          style={{
                            top: '21px', // -3px from button height
                            left: '5%',
                            width: '90%'
                          }}
                        >
                          {formatValue(totalValue)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveFilters(prev => 
                              isActive 
                                ? prev.filter(f => f !== phase)
                                : [...prev, phase]
                            );
                          }}
                          className={`text-xs px-2 py-0.5 transition-all duration-300 rounded-lg h-7 flex items-center gap-2 relative z-10 shadow-sm ${
                            isActive 
                              ? `${colors.bg} ${colors.text} ${colors.border} border-2` 
                              : 'bg-gray-50 text-gray-400 border-gray-200'
                          }`}
                        >
                          <span>{phase.toUpperCase()}</span>
                          <div className={`w-5 h-5 rounded-full ${colors.circle} flex items-center justify-center`}>
                            <span className="text-xs font-bold text-white">{phaseProjects.length}</span>
                          </div>
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <div className="relative">
                  <Filter 
                    className="h-4 w-4 text-gray-400" 
                  />
                  {activeFilters.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-0.5 bg-gray-400 rotate-45"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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
              <div className="flex justify-end">
                <span className="text-sm text-gray-500">
                  {Object.keys(projectsByCity).length} Cities | {projects.length} Projects
                </span>
              </div>
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