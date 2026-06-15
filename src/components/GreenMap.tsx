'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import { MultiStageRoute } from '@/app/compare/results/page';

// Fix Leaflet's default icon path issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Demo Coords as [lat, lon]
const DEMO_COORDS: Record<string, [number, number]> = {
  'SRM Kattankulathur': [12.823, 80.044],
  'Guindy': [13.0108, 80.2206],
  'Tambaram': [12.9249, 80.1100],
  'Chennai Central': [13.0827, 80.2707],
  'Velachery': [12.9754, 80.2206],
  'T Nagar': [13.0418, 80.2341],
  'Anna Nagar': [13.0827, 80.2116],
  'Marina Beach': [13.0500, 80.2824],
};

function MapBounds({ route, source, destination }: { route?: MultiStageRoute, source: [number, number], destination: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (route && route.legs.length > 0) {
      const bounds = L.latLngBounds([source, destination]);
      route.legs.forEach(leg => {
        bounds.extend([leg.fromLat, leg.fromLng]);
        bounds.extend([leg.toLat, leg.toLng]);
      });
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      const bounds = L.latLngBounds([source, destination]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, route, source, destination]);
  return null;
}

const MODE_COLORS: Record<string, string> = {
  car: '#9ca3af', // gray
  metro: '#3b82f6', // blue
  train: '#a855f7', // purple
  bus: '#fb923c', // orange
  cycle: '#22c55e', // green
  walk: '#2dd4bf', // teal
};

export default function GreenMap({ route, sourceName, destName }: { route?: MultiStageRoute, sourceName: string, destName: string }) {
  // Default to first demo route if not found (lat, lon)
  const source = DEMO_COORDS[sourceName] || [12.823, 80.044]; 
  const destination = DEMO_COORDS[destName] || [13.0108, 80.2206];

  // If no route passed (loading state), draw straight line
  if (!route) {
    return (
      <div className="h-full w-full bg-gray-50 z-0">
        <MapContainer
          center={source}
          zoom={11}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={source}><Popup>Source: {sourceName}</Popup></Marker>
          <Marker position={destination}><Popup>Destination: {destName}</Popup></Marker>
          <Polyline positions={[source, destination]} color="#9ca3af" weight={4} dashArray="5, 10" />
          <MapBounds source={source} destination={destination} />
        </MapContainer>
      </div>
    );
  }

  // Draw complex graph route
  const stops = new Map<string, [number, number]>();
  route.legs.forEach(leg => {
    stops.set(leg.fromName, [leg.fromLat, leg.fromLng]);
    stops.set(leg.toName, [leg.toLat, leg.toLng]);
  });

  return (
    <div className="h-full w-full z-0 relative">
      <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur rounded-xl p-3 shadow-lg border text-xs flex flex-col gap-2">
        <span className="font-bold border-b pb-1">Map Legend</span>
        {Object.entries(MODE_COLORS).map(([mode, color]) => {
          // Only show modes used in this route
          if (!route.legs.some(l => l.mode === mode)) return null;
          return (
            <div key={mode} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize">{mode}</span>
            </div>
          );
        })}
      </div>
      <MapContainer
        center={source}
        zoom={11}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Draw all intermediate stops */}
        {Array.from(stops.entries()).map(([name, coords], idx) => {
          const isSource = coords[0] === source[0] && coords[1] === source[1];
          const isDest = coords[0] === destination[0] && coords[1] === destination[1];
          return (
            <Marker key={idx} position={coords} opacity={isSource || isDest ? 1 : 0.6}>
              <Popup>{name} {isSource ? '(Start)' : isDest ? '(End)' : '(Transit Stop)'}</Popup>
            </Marker>
          );
        })}

        {/* Draw leg polylines */}
        {route.legs.map((leg, idx) => {
          const positions: [number, number][] = [[leg.fromLat, leg.fromLng]];
          if (leg.intermediateCoords && leg.intermediateCoords.length > 0) {
            positions.push(...leg.intermediateCoords);
          }
          positions.push([leg.toLat, leg.toLng]);

          return (
          <Polyline 
            key={idx}
            positions={positions} 
            color={MODE_COLORS[leg.mode] || '#22c55e'} 
            weight={leg.mode === 'walk' ? 4 : 6} 
            opacity={0.8} 
            dashArray={leg.mode === 'walk' ? "5, 10" : undefined}
          >
            <Popup>{leg.mode.toUpperCase()}: {leg.fromName} → {leg.toName} ({leg.distance.toFixed(1)} km)</Popup>
          </Polyline>
        )})}
        
        <MapBounds route={route} source={source} destination={destination} />
      </MapContainer>
    </div>
  );
}
