'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom amber dot marker (avoids broken default Leaflet icon paths in Next.js)
const createDotIcon = (isLatest) =>
  L.divIcon({
    className: 'custom-map-dot',
    html: `<div style="
      width: ${isLatest ? '14px' : '10px'};
      height: ${isLatest ? '14px' : '10px'};
      background-color: ${isLatest ? '#d97706' : '#57534e'};
      border: 2px solid #ffffff;
      border-radius: 9999px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: isLatest ? [14, 14] : [10, 10],
    iconAnchor: isLatest ? [7, 7] : [5, 5],
  });

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 10);
    } else {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [map, points]);

  return null;
}

export default function JourneyMap({ stops }) {
  // Filter to stops that have valid coordinates, sorted oldest -> newest for the trail
  const mappedStops = stops
    .filter((s) => typeof s.lat === 'number' && typeof s.lng === 'number')
    .slice()
    .reverse();

  if (mappedStops.length === 0) return null;

  const points = mappedStops.map((s) => [s.lat, s.lng]);

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
      <div className="h-56 sm:h-64 w-full relative z-0">
        <MapContainer
          center={points[points.length - 1]}
          zoom={4}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={points} />

          {/* Dashed line connecting stops */}
          {points.length > 1 && (
            <Polyline
              positions={points}
              pathOptions={{ color: '#d97706', weight: 2, dashArray: '5, 6', opacity: 0.7 }}
            />
          )}

          {/* Stop Markers */}
          {mappedStops.map((stop, idx) => {
            const isLatest = idx === mappedStops.length - 1;
            return (
              <Marker
                key={stop.id || idx}
                position={[stop.lat, stop.lng]}
                icon={createDotIcon(isLatest)}
              >
                <Popup>
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-stone-900">{stop.reader_name || 'Reader'}</p>
                    <p className="text-stone-600">{stop.location}</p>
                    <p className="text-[10px] text-stone-400">{stop.status_event}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
