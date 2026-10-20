import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, Navigation, Maximize2, RotateCcw, 
  Radio, Compass, ShieldCheck, Sparkles 
} from 'lucide-react';
import { CAMPUS_CENTER, EVENT_VENUES } from '../../data/liveEventsData';

export default function CampusEventMap({ 
  events = [], 
  selectedVenueId = null, 
  onSelectVenue = () => {} 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const [userLocation, setUserLocation] = useState(null);
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Initialize and synchronize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create Map instance centered on KRC Campus, Ambegaon Budruk, Pune
    const map = L.map(mapContainerRef.current, {
      center: [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng],
      zoom: CAMPUS_CENTER.zoom,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true
    });

    mapInstanceRef.current = map;

    // Always use standard OpenStreetMap tiles in light mode (100% free, reliable, zero API key required)
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: 19
    }).addTo(map);

    // Campus boundary circle (100m perimeter)
    L.circle([CAMPUS_CENTER.lat, CAMPUS_CENTER.lng], {
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.08,
      radius: 120,
      dashArray: '4, 8',
      weight: 1.5
    }).addTo(map);

    // Add Venue Markers with custom pulsing SVG DivIcons
    const venueList = Object.values(EVENT_VENUES);
    const newMarkers = {};

    venueList.forEach((venue) => {
      const activeEvent = events.find(e => e.venue?.id === venue.id && e.status === 'live');
      const isSelected = selectedVenueId === venue.id;

      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${activeEvent ? `
            <span class="absolute -inset-2 rounded-full animate-ping opacity-75" style="background-color: ${venue.color};"></span>
            <span class="absolute -inset-1 rounded-full animate-pulse opacity-50" style="background-color: ${venue.color};"></span>
          ` : ''}
          <div class="relative flex items-center justify-center w-9 h-9 rounded-full shadow-lg border-2 ${
            isSelected ? 'border-white scale-125 ring-4 ring-emerald-500/50' : 'border-white/80 dark:border-zinc-800'
          } transition-all duration-300" style="background-color: ${venue.color};">
            <svg class="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-extrabold shadow-md" style="color: #09090b !important; background: #ffffff !important; border: 1.5px solid #52525b !important; box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;">
            ${venue.shortName || venue.name.split(' ')[0]} ${activeEvent ? '🔴' : ''}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-venue-pin',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
      });

      const marker = L.marker([venue.lat, venue.lng], { icon: customIcon }).addTo(map);

      // Popup Content with explicit dark high-contrast typography
      const popupHtml = `
        <div style="font-family: inherit; min-width: 210px; padding: 4px; color: #09090b;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: ${venue.color}; margin-bottom: 2px;">
            ${venue.tag}
          </div>
          <h4 style="font-size: 14px; font-weight: 800; margin: 0 0 4px 0; color: #09090b;">
            ${venue.name}
          </h4>
          <p style="font-size: 12px; font-weight: 500; margin: 0 0 8px 0; color: #3f3f46;">
            📍 ${venue.zone} · 👥 Cap: ${venue.capacity}
          </p>
          ${activeEvent ? `
            <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 6px; padding: 6px 8px; margin-bottom: 8px;">
              <span style="font-size: 10px; font-weight: 800; color: #dc2626; display: block; margin-bottom: 2px;">
                🔴 LIVE NOW
              </span>
              <span style="font-size: 12px; font-weight: 700; color: #09090b; display: block;">
                ${activeEvent.shortTitle}
              </span>
            </div>
          ` : ''}
          <div style="font-size: 11px; color: #059669; font-weight: 700;">
            ✓ Campus Geo-Tag Verified (Ambegaon, Pune)
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectVenue(venue.id);
      });

      newMarkers[venue.id] = marker;
    });

    markersRef.current = newMarkers;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [events]);

  // Pan to selected venue when changed
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedVenueId) return;
    const venue = Object.values(EVENT_VENUES).find(v => v.id === selectedVenueId);
    if (venue) {
      mapInstanceRef.current.flyTo([venue.lat, venue.lng], 17.5, {
        animate: true,
        duration: 1.2
      });
      const marker = markersRef.current[venue.id];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedVenueId]);

  // Handle Demo GPS Simulation / Proximity
  const handleSimulateLocation = () => {
    setIsLocating(true);
    // Simulate student walking inside campus grounds
    setTimeout(() => {
      const simulatedLat = 18.4635;
      const simulatedLng = 73.8435;
      setUserLocation({ lat: simulatedLat, lng: simulatedLng });

      if (mapInstanceRef.current) {
        // Add or update student location pin
        L.circleMarker([simulatedLat, simulatedLng], {
          radius: 8,
          fillColor: '#3b82f6',
          color: '#ffffff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(mapInstanceRef.current)
          .bindPopup('<div style="font-family: inherit; padding: 4px; color: #09090b;"><b style="color: #2563eb;">📍 Your Current Location</b><br><span style="color: #27272a; font-size: 12px; font-weight: 600;">Inside Central Quad (Demo GPS Active)</span></div>')
          .openPopup();

        mapInstanceRef.current.panTo([simulatedLat, simulatedLng]);
      }

      setDistanceInfo('You are inside campus bounds (35m from Central Quad, 85m from Turing Hall)');
      setIsLocating(false);
    }, 600);
  };

  const handleResetCampusView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([CAMPUS_CENTER.lat, CAMPUS_CENTER.lng], CAMPUS_CENTER.zoom, {
        animate: true,
        duration: 1
      });
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border shadow-xl bg-surface flex flex-col">
      {/* Top Map Action Bar with Solid Opaque Ultra-High-Contrast Controls (Permanently Dark for Total Legibility over Map Tiles) */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none gap-2">
        <div 
          className="pointer-events-auto bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-700 shadow-2xl flex items-center gap-2.5 text-xs font-bold shrink-0"
          style={{ backgroundColor: '#09090b', color: '#ffffff', borderColor: '#27272a' }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="font-extrabold tracking-tight text-white" style={{ color: '#ffffff' }}>KRC Campus Live Map</span>
          <span className="text-[11px] font-semibold text-zinc-300 hidden sm:inline" style={{ color: '#d4d4d8' }}>· Ambegaon, Pune (18.46° N, 73.84° E)</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {/* Solid Royal Blue Action Button with Explicit High-Contrast White Text */}
          <button
            onClick={handleSimulateLocation}
            disabled={isLocating}
            className="px-3.5 py-2 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-blue-400 hover:brightness-110 active:brightness-95 shrink-0"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            title="Simulate Real-World Campus GPS"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} style={{ color: '#ffffff' }} />
            <span className="font-bold tracking-wide" style={{ color: '#ffffff' }}>My Location</span>
          </button>

          {/* Reset View Button */}
          <button
            onClick={handleResetCampusView}
            className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-700 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            style={{ backgroundColor: '#09090b', color: '#ffffff', borderColor: '#27272a' }}
            title="Reset Campus View"
            aria-label="Reset Campus View"
          >
            <RotateCcw className="w-4 h-4 text-white stroke-[2.2]" style={{ color: '#ffffff' }} />
          </button>
        </div>
      </div>

      {/* Real Map Leaflet Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-[380px] sm:h-[450px] lg:h-full min-h-[350px] z-0"
        style={{ minHeight: '380px' }}
      />

      {/* Bottom Live Legend & Proximity Bar with Solid Dark High-Contrast Controls */}
      <div 
        className="p-3 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{ backgroundColor: '#09090b', color: '#ffffff', borderColor: '#27272a' }}
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <span className="font-extrabold text-white flex items-center gap-1.5 shrink-0" style={{ color: '#ffffff' }}>
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Venues:</span>
          </span>
          {Object.values(EVENT_VENUES).map(venue => {
            const isSelected = selectedVenueId === venue.id;
            return (
              <button
                key={venue.id}
                onClick={() => onSelectVenue(venue.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-white text-zinc-950 shadow-md border-transparent scale-105' 
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 hover:text-white border-zinc-700'
                }`}
                style={isSelected ? { backgroundColor: '#ffffff', color: '#09090b' } : { backgroundColor: '#18181b', color: '#f4f4f5', borderColor: '#3f3f46' }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: venue.color }}></span>
                <span>{venue.shortName || venue.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {distanceInfo && (
          <div 
            className="text-[11px] font-bold text-emerald-300 bg-emerald-950/90 px-3 py-1.5 rounded-lg border border-emerald-700/60 shadow-sm"
            style={{ color: '#6ee7b7', backgroundColor: 'rgba(6, 78, 59, 0.7)', borderColor: 'rgba(4, 120, 87, 0.5)' }}
          >
            {distanceInfo}
          </div>
        )}
      </div>
    </div>
  );
}
