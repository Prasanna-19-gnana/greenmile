import fs from 'fs';
import path from 'path';

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'metro' | 'train' | 'bus';
}

export interface Connection {
  from: string;
  to: string;
  mode: 'metro' | 'train' | 'bus' | 'walk' | 'car' | 'bike';
  distance_km: number;
  duration_min: number;
  cost: number;
  frequency_min: number;
  co2_factor: number;
}

export interface RouteLeg {
  from: Station | { id: string; name: string; lat: number; lng: number };
  to: Station | { id: string; name: string; lat: number; lng: number };
  mode: string;
  distance: number;
  duration: number;
  cost: number;
  co2: number;
  intermediateStops?: string[];
  intermediateCoords?: [number, number][];
}

export interface RouteOption {
  id: string;
  label: string;
  legs: RouteLeg[];
  totalDistance: number;
  totalDuration: number;
  totalCost: number;
  totalCo2: number;
  isRecommended?: boolean;
  recommendationReason?: string;
  geminiExplanation?: string;
}

// Haversine formula
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// In-memory Graph
const stations: Record<string, Station> = {};
const adjacencyList: Record<string, Connection[]> = {};
let isLoaded = false;

function loadData() {
  if (isLoaded) return;
  const dataDir = path.join(process.cwd(), 'data');
  const stationsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'stations.json'), 'utf-8')) as Station[];
  const connectionsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'connections.json'), 'utf-8')) as Connection[];

  stationsData.forEach(st => {
    stations[st.id] = st;
    adjacencyList[st.id] = [];
  });

  connectionsData.forEach(conn => {
    if (adjacencyList[conn.from]) {
      adjacencyList[conn.from].push(conn);
    }
  });

  isLoaded = true;
}

export function getStationByName(name: string): Station | null {
  loadData();
  const lowerName = name.toLowerCase().trim();
  const match = Object.values(stations).find(st => 
    st.name.toLowerCase() === lowerName || 
    st.name.toLowerCase().includes(lowerName) ||
    lowerName.includes(st.name.toLowerCase())
  );
  return match || null;
}

type WeightType = 'time' | 'cost' | 'co2' | 'balanced';

function getWeight(conn: Connection, type: WeightType, isModeSwitch: boolean): number {
  switch(type) {
    case 'time':
      // add wait time only if we switch modes to board this transit
      return conn.duration_min + (isModeSwitch ? (conn.frequency_min / 2) : 0);
    case 'cost':
      return conn.cost;
    case 'co2':
      return (conn.distance_km * conn.co2_factor) / 1000; // in kg
    case 'balanced':
      // normalize and sum
      const timeW = (conn.duration_min + (isModeSwitch ? (conn.frequency_min / 2) : 0)) / 60; // hours
      const costW = conn.cost / 50; // assuming 50 is base cost unit
      const co2W = (conn.distance_km * conn.co2_factor) / 1000;
      return timeW + costW + co2W;
  }
}

class PriorityQueue<T> {
  elements: { item: T, priority: number }[] = [];

  enqueue(item: T, priority: number) {
    this.elements.push({item, priority});
    this.elements.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.elements.shift()?.item;
  }

  isEmpty() {
    return this.elements.length === 0;
  }
}

export function findRoute(
  startLat: number, startLng: number, startName: string,
  endLat: number, endLng: number, endName: string,
  weightType: WeightType,
  directMode?: 'car' | 'bike' | 'walk'
): RouteOption {
  loadData();

  const startId = 'START_NODE';
  const endId = 'END_NODE';

  // If calculating a direct route (no transit)
  if (directMode) {
    const d = getDistance(startLat, startLng, endLat, endLng);
    const speed = directMode === 'car' ? 30 : directMode === 'bike' ? 20 : 5;
    const co2F = directMode === 'car' ? 120 : directMode === 'bike' ? 70 : 0;
    const costP = directMode === 'car' ? 12 : directMode === 'bike' ? 5 : 0;

    return {
      id: `${directMode}_direct`,
      label: `Direct ${directMode.charAt(0).toUpperCase() + directMode.slice(1)}`,
      legs: [{
        from: { id: startId, name: startName, lat: startLat, lng: startLng },
        to: { id: endId, name: endName, lat: endLat, lng: endLng },
        mode: directMode,
        distance: d,
        duration: (d / speed) * 60,
        cost: d * costP,
        co2: (d * co2F) / 1000
      }],
      totalDistance: d,
      totalDuration: (d / speed) * 60,
      totalCost: d * costP,
      totalCo2: (d * co2F) / 1000
    };
  }

  // Construct virtual edges to the network
  const virtAdjacency: Record<string, Connection[]> = { ...adjacencyList };
  virtAdjacency[startId] = [];
  virtAdjacency[endId] = [];

  const WALKING_SPEED = 5; // km/h

  // Connect start to top 5 nearest stations
  Object.values(stations).forEach(st => {
    const dStart = getDistance(startLat, startLng, st.lat, st.lng);
    if (dStart < 5) { // within 5km walk
      virtAdjacency[startId].push({
        from: startId, to: st.id, mode: 'walk',
        distance_km: dStart, duration_min: (dStart / WALKING_SPEED) * 60,
        cost: 0, frequency_min: 0, co2_factor: 0
      });
    }

    const dEnd = getDistance(st.lat, st.lng, endLat, endLng);
    if (dEnd < 5) {
      if (!virtAdjacency[st.id]) virtAdjacency[st.id] = [];
      // create a shallow copy so we don't mutate the global adjacencyList permanently for concurrent reqs
      virtAdjacency[st.id] = [...virtAdjacency[st.id], {
        from: st.id, to: endId, mode: 'walk',
        distance_km: dEnd, duration_min: (dEnd / WALKING_SPEED) * 60,
        cost: 0, frequency_min: 0, co2_factor: 0
      }];
    }
  });

  // Dijkstra
  const distances: Record<string, number> = {};
  const previous: Record<string, Connection | null> = {};
  const pq = new PriorityQueue<string>();

  Object.keys(virtAdjacency).forEach(node => {
    distances[node] = Infinity;
    previous[node] = null;
  });

  distances[startId] = 0;
  pq.enqueue(startId, 0);

  while (!pq.isEmpty()) {
    const current = pq.dequeue();
    if (!current) break;

    if (current === endId) break;

    const neighbors = virtAdjacency[current] || [];
    for (const conn of neighbors) {
      const isModeSwitch = (!previous[current] && conn.mode !== 'walk') || (previous[current] && previous[current]!.mode !== conn.mode && conn.mode !== 'walk');
      const weight = getWeight(conn, weightType, !!isModeSwitch);
      const alt = distances[current] + weight;
      
      if (alt < distances[conn.to]) {
        distances[conn.to] = alt;
        previous[conn.to] = conn;
        pq.enqueue(conn.to, alt);
      }
    }
  }

  // Backtrack
  const legs: RouteLeg[] = [];
  let curr = endId;
  while (previous[curr]) {
    const conn = previous[curr]!;
    
    let fromNode: any = stations[conn.from];
    if (conn.from === startId) fromNode = { id: startId, name: startName, lat: startLat, lng: startLng };
    if (conn.from === endId) fromNode = { id: endId, name: endName, lat: endLat, lng: endLng };

    let toNode: any = stations[conn.to];
    if (conn.to === startId) toNode = { id: startId, name: startName, lat: startLat, lng: startLng };
    if (conn.to === endId) toNode = { id: endId, name: endName, lat: endLat, lng: endLng };

    legs.unshift({
      from: fromNode,
      to: toNode,
      mode: conn.mode,
      distance: conn.distance_km,
      duration: conn.duration_min,
      cost: conn.cost,
      co2: (conn.distance_km * conn.co2_factor) / 1000
    });
    curr = conn.from;
  }

  // If no path found, fallback to direct car
  if (legs.length === 0) {
    return findRoute(startLat, startLng, startName, endLat, endLng, endName, weightType, 'car');
  }

  // Group consecutive legs of same mode
  let groupedLegs: RouteLeg[] = [];
  if (legs.length > 0) {
    let currentGroup = { ...legs[0], intermediateStops: [] as string[], intermediateCoords: [] as [number, number][] };
    for (let i = 1; i < legs.length; i++) {
      if (legs[i].mode === currentGroup.mode) {
        currentGroup.to = legs[i].to;
        currentGroup.distance += legs[i].distance;
        currentGroup.duration += legs[i].duration;
        currentGroup.cost += legs[i].cost;
        currentGroup.co2 += legs[i].co2;
        
        // Add the station we just passed through to intermediates
        const passedStationName = typeof legs[i].from === 'string' ? legs[i].from : (legs[i].from as any).name;
        if (passedStationName) {
          currentGroup.intermediateStops.push(passedStationName);
        }
        currentGroup.intermediateCoords.push([(legs[i].from as any).lat, (legs[i].from as any).lng]);
      } else {
        groupedLegs.push(currentGroup);
        currentGroup = { ...legs[i], intermediateStops: [], intermediateCoords: [] };
      }
    }
    groupedLegs.push(currentGroup);
  }

  // Filter out zero-distance walks but preserve start/end names
  const filteredLegs: RouteLeg[] = [];
  for (let i = 0; i < groupedLegs.length; i++) {
    const leg = groupedLegs[i];
    if (leg.mode === 'walk' && leg.distance < 0.1) {
      if (i === 0 && groupedLegs.length > 1) {
        groupedLegs[i+1].from = leg.from;
      } else if (i === groupedLegs.length - 1 && filteredLegs.length > 0) {
        filteredLegs[filteredLegs.length - 1].to = leg.to;
      }
      continue;
    }
    filteredLegs.push(leg);
  }
  groupedLegs = filteredLegs.length > 0 ? filteredLegs : groupedLegs;

  const totalDist = groupedLegs.reduce((s, l) => s + l.distance, 0);
  const totalDur = groupedLegs.reduce((s, l) => s + l.duration, 0);
  const totalCost = groupedLegs.reduce((s, l) => s + l.cost, 0);
  const totalCo2 = groupedLegs.reduce((s, l) => s + l.co2, 0);

  return {
    id: `route_${weightType}`,
    label: weightType.charAt(0).toUpperCase() + weightType.slice(1) + ' Route',
    legs: groupedLegs,
    totalDistance: totalDist,
    totalDuration: totalDur,
    totalCost: totalCost,
    totalCo2: totalCo2
  };
}
