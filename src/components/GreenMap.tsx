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
  'Tambaram': [12.925, 80.127],
  'Chennai Central': [13.0827, 80.2707],
  'Velachery': [12.9754, 80.2206],
  'T Nagar': [13.0418, 80.2341],
  'Anna Nagar': [13.0827, 80.2116],
  'Marina Beach': [13.0500, 80.2824],
  'Potheri': [12.823, 80.045],
  'Potheri Railway Station': [12.823, 80.045],
  'Sipcot': [12.83, 80.22],
  'SIPCoT IT Park': [12.83, 80.22],
  'Siruseri': [12.83, 80.22],
  'Kelambakkam': [12.79, 80.22],
  'Vandalur': [12.892, 80.081],
  'Guduvanchery': [12.845, 80.06],
};

function isValidChennaiCoord(coord: [number, number] | null | undefined): boolean {
  if (!coord) return false;
  const [lat, lng] = coord;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= 12.3 &&
    lat <= 13.5 &&
    lng >= 79.7 &&
    lng <= 80.5
  );
}

function MapBounds({ route, source, destination }: { route?: MultiStageRoute, source: [number, number], destination: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const validPoints: [number, number][] = [];
    if (isValidChennaiCoord(source)) validPoints.push(source);
    if (isValidChennaiCoord(destination)) validPoints.push(destination);

    if (route && route.legs.length > 0) {
      route.legs.forEach(leg => {
        if (isValidChennaiCoord([leg.fromLat, leg.fromLng])) validPoints.push([leg.fromLat, leg.fromLng]);
        if (isValidChennaiCoord([leg.toLat, leg.toLng])) validPoints.push([leg.toLat, leg.toLng]);
        if (leg.intermediateCoords) {
          leg.intermediateCoords.forEach(coord => {
            if (isValidChennaiCoord(coord)) validPoints.push(coord);
          });
        }
      });
    }

    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(validPoints);
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
  let source = DEMO_COORDS[sourceName] || null; 
  let destination = DEMO_COORDS[destName] || null;
  
  if (!isValidChennaiCoord(source)) source = [13.0827, 80.2707]; // Chennai Central fallback
  if (!isValidChennaiCoord(destination)) destination = [13.0827, 80.2707]; // Chennai Central fallback

  // If no route passed (loading state), draw straight line
  if (!route) {
    return (
      <div className="h-full w-full bg-gray-50 z-0">
        <MapContainer
          center={source!}
          zoom={11}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={source!}><Popup>Source: {sourceName}</Popup></Marker>
          <Marker position={destination!}><Popup>Destination: {destName}</Popup></Marker>
          <Polyline positions={[source!, destination!]} color="#9ca3af" weight={4} dashArray="5, 10" />
          <MapBounds source={source!} destination={destination!} />
        </MapContainer>
      </div>
    );
  }

  // Draw complex graph route
  const stops = new Map<string, [number, number]>();
  const allRouteCoords: [number, number][] = [];
  const validPoints: [number, number][] = [];
  const rejectedPoints: [number, number][] = [];

  route.legs.forEach(leg => {
    const fromCoord: [number, number] = [leg.fromLat, leg.fromLng];
    const toCoord: [number, number] = [leg.toLat, leg.toLng];
    
    allRouteCoords.push(fromCoord);
    if (isValidChennaiCoord(fromCoord)) {
      stops.set(leg.fromName, fromCoord);
      validPoints.push(fromCoord);
    } else {
      rejectedPoints.push(fromCoord);
    }

    if (isValidChennaiCoord(toCoord)) {
      stops.set(leg.toName, toCoord);
      validPoints.push(toCoord);
    } else {
      rejectedPoints.push(toCoord);
    }
    allRouteCoords.push(toCoord);
  });

  if (process.env.NODE_ENV === 'development') {
    console.log("Map points before filtering", allRouteCoords);
    console.log("Valid map points", validPoints);
    console.log("Rejected map points", rejectedPoints);
  }

  return (
    <div className="h-full w-full z-0 relative">
      <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur rounded-xl p-3 shadow-lg border text-xs flex flex-col gap-2">
        <span className="font-bold border-b pb-1">Map Legend</span>
        {Object.entries(MODE_COLORS).map(([mode, color]) => {
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
        center={source!}
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
          const isSource = coords[0] === source![0] && coords[1] === source![1];
          const isDest = coords[0] === destination![0] && coords[1] === destination![1];
          return (
            <Marker key={idx} position={coords} opacity={isSource || isDest ? 1 : 0.6}>
              <Popup>{name} {isSource ? '(Start)' : isDest ? '(End)' : '(Transit Stop)'}</Popup>
            </Marker>
          );
        })}

        {/* Draw leg polylines */}
        {validPoints.length >= 2 ? route.legs.map((leg, idx) => {
          const positions: [number, number][] = [];
          if (isValidChennaiCoord([leg.fromLat, leg.fromLng])) positions.push([leg.fromLat, leg.fromLng]);
          
          if (leg.intermediateCoords && leg.intermediateCoords.length > 0) {
            leg.intermediateCoords.forEach(coord => {
              if (isValidChennaiCoord(coord)) positions.push(coord);
            });
          }
          if (isValidChennaiCoord([leg.toLat, leg.toLng])) positions.push([leg.toLat, leg.toLng]);

          if (positions.length < 2) return null; // Can't draw a line without 2 valid points

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
          )
        }) : (
          <Polyline positions={[source!, destination!]} color="#9ca3af" weight={4} dashArray="5, 10" />
        )}
        
        <MapBounds route={route} source={source!} destination={destination!} />
      </MapContainer>
    </div>
  );
}
