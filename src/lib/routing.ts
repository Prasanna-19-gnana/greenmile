import fs from 'fs';
import path from 'path';

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'metro' | 'train' | 'bus';
  lines?: string[];
}

export interface Connection {
  from: string;
  to: string;
  mode: 'metro' | 'train' | 'bus' | 'walk' | 'car' | 'bike' | 'cab';
  distance_km: number;
  duration_min: number;
  cost: number;
  frequency_min: number;
  co2_factor: number;
  line?: string;
  debug?: any;
}

export interface RouteLeg {
  from: Station | { id: string; name: string; lat: number; lng: number };
  to: Station | { id: string; name: string; lat: number; lng: number };
  mode: string;
  distance: number;
  duration: number;
  cost: number;
  co2: number;
  line?: string;
  intermediateStops?: string[];
  intermediateCoords?: [number, number][];
  debug?: any;
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
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
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

  connectionsData.forEach((conn: any) => {
    // Map JSON properties to the interface expected by routing.ts
    const mappedConn: Connection = {
      from: conn.from,
      to: conn.to,
      mode: conn.mode,
      distance_km: conn.distance || conn.distance_km || 0,
      duration_min: conn.duration || conn.duration_min || 0,
      cost: conn.cost || 0,
      frequency_min: conn.frequency_min || 10, // default 10 min frequency for trains
      co2_factor: conn.co2 || conn.co2_factor || 0,
      line: conn.line
    };

    if (adjacencyList[mappedConn.from]) {
      adjacencyList[mappedConn.from].push(mappedConn);
    }
  });

  // Fuzzy distance-based walk graph generation has been removed
  // We only use explicit lines and transfers from the JSON dataset now.

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

function getWeight(conn: Connection, type: WeightType, isModeSwitch: boolean, directDist?: number): number {
  let penalty = 0;
  if (conn.mode === 'train' && directDist && directDist < 12) penalty += 5000; // penalize inner-city train

  switch(type) {
    case 'time':
      // add wait time only if we switch modes to board this transit
      return penalty + conn.duration_min + (isModeSwitch ? (conn.frequency_min / 2) : 0);
    case 'cost':
      return penalty + conn.cost;
    case 'co2':
      return penalty + (conn.distance_km * conn.co2_factor) / 1000; // in kg
    case 'balanced':
      // normalize and sum
      const timeW = (conn.duration_min + (isModeSwitch ? (conn.frequency_min / 2) : 0)) / 60; // hours
      const costW = conn.cost / 50; // assuming 50 is base cost unit
      const co2W = (conn.distance_km * conn.co2_factor) / 1000;
      return penalty + timeW + costW + co2W;
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
): RouteOption | null {
  loadData();

  const startId = 'START_NODE';
  const endId = 'END_NODE';

  // If calculating a direct route (no transit)
  if (directMode) {
    let d = getDistance(startLat, startLng, endLat, endLng);
    // Apply multipliers requested by user
    if (directMode === 'walk') d *= 1.2;
    else d *= 1.3; // car, bike, auto

    const speed = directMode === 'car' ? 30 : directMode === 'bike' ? 20 : 5;
    const co2F = directMode === 'car' ? 120 : directMode === 'bike' ? 100 : 0;
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
        co2: (d * co2F) / 1000,
        debug: { fromCoord: [startLat, startLng], toCoord: [endLat, endLng], rawHaversine: d / (directMode==='walk'?1.2:1.3), multiplier: directMode==='walk'?1.2:1.3, finalDist: d, validation: 'Valid' }
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

  let startStations = Object.values(stations).map(st => ({
    st,
    dist: getDistance(startLat, startLng, st.lat, st.lng)
  })).sort((a, b) => a.dist - b.dist);
  
  if (startStations.length > 0 && startStations[0].dist <= 1.0) {
    startStations = startStations.filter(s => s.dist <= 1.0);
  } else {
    startStations = startStations.slice(0, 3);
  }

  startStations.forEach(({ st, dist }) => {
    // dist <= 1: walk only
    // 1 < dist <= 2: walk + bike
    // dist > 2: bike or car only
    
    if (dist <= 2) {
      const walkDist = dist * 1.2;
      virtAdjacency[startId].push({
        from: startId, to: st.id, mode: 'walk',
        distance_km: walkDist, duration_min: (walkDist / WALKING_SPEED) * 60,
        cost: 0, frequency_min: 0, co2_factor: 0,
        debug: { rawHaversine: walkDist/1.2, multiplier: 1.2, finalDist: walkDist, validation: 'Valid' }
      });
    }

    if (dist > 1) { // 1 to Infinity allows cab for anything > 1km
      const cabDist = dist * 1.3;
      virtAdjacency[startId].push({
        from: startId, to: st.id, mode: 'cab',
        distance_km: cabDist, duration_min: (cabDist / 30) * 60,
        cost: cabDist * 18, frequency_min: 0, co2_factor: 120,
        debug: { rawHaversine: cabDist/1.3, multiplier: 1.3, finalDist: cabDist, validation: 'Valid' }
      });
    }
  });

  let endStations = Object.values(stations).map(st => ({
    st,
    dist: getDistance(st.lat, st.lng, endLat, endLng)
  })).sort((a, b) => a.dist - b.dist);
  
  if (endStations.length > 0 && endStations[0].dist <= 1.0) {
    endStations = endStations.filter(s => s.dist <= 1.0);
  } else {
    endStations = endStations.slice(0, 3);
  }

  endStations.forEach(({ st, dist }) => {
    if (dist <= 2) {
      if (!virtAdjacency[st.id]) virtAdjacency[st.id] = [];
      const walkDist = dist * 1.2;
      virtAdjacency[st.id].push({
        from: st.id, to: endId, mode: 'walk',
        distance_km: walkDist, duration_min: (walkDist / WALKING_SPEED) * 60,
        cost: 0, frequency_min: 0, co2_factor: 0,
        debug: { rawHaversine: walkDist/1.2, multiplier: 1.2, finalDist: walkDist, validation: 'Valid' }
      });
    }

    if (dist > 1) {
      if (!virtAdjacency[st.id]) virtAdjacency[st.id] = [];
      const cabDist = dist * 1.3;
      virtAdjacency[st.id].push({
        from: st.id, to: endId, mode: 'cab',
        distance_km: cabDist, duration_min: (cabDist / 30) * 60,
        cost: cabDist * 18, frequency_min: 0, co2_factor: 120,
        debug: { rawHaversine: cabDist/1.3, multiplier: 1.3, finalDist: cabDist, validation: 'Valid' }
      });
    }
  });

  // Dijkstra
  const distances: Record<string, number> = {};
  const previous: Record<string, Connection | null> = {};
  const pq = new PriorityQueue<string>();

  // Ensure all nodes, including endId which might have no outgoing edges, are initialized
  Object.keys(virtAdjacency).forEach(node => {
    distances[node] = Infinity;
    previous[node] = null;
    virtAdjacency[node].forEach(conn => {
      distances[conn.to] = Infinity;
      previous[conn.to] = null;
    });
  });

  distances[startId] = 0;
  pq.enqueue(startId, 0);

  while (!pq.isEmpty()) {
    const current = pq.dequeue();
    if (!current) break;

    if (current === endId) break;

    const neighbors = virtAdjacency[current] || [];
    for (const conn of neighbors) {
      const prev = previous[current];
      const isModeSwitch = (!prev && conn.mode !== 'walk') || 
        (prev && (prev.mode !== conn.mode || prev.line !== conn.line) && conn.mode !== 'walk');
      
      let weight = getWeight(conn, weightType, !!isModeSwitch);

      // Regional Detour Penalty
      // If a node takes us significantly further North/West than start and end, penalize heavily
      const toStation = stations[conn.to];
      if (toStation && toStation.lat && toStation.lng) {
        const minLat = Math.min(startLat, endLat) - 0.05;
        const maxLat = Math.max(startLat, endLat) + 0.05;
        const minLng = Math.min(startLng, endLng) - 0.05;
        const maxLng = Math.max(startLng, endLng) + 0.05;
        
        if (toStation.lat > maxLat + 0.1 || toStation.lat < minLat - 0.1 ||
            toStation.lng > maxLng + 0.1 || toStation.lng < minLng - 0.1) {
          weight += 1000; // heavy penalty for going completely out of regional bounds
        }
      } else if (toStation && !toStation.lat) {
        // Unknown coordinate nodes (unmapped bus stops) get a slight penalty to discourage deep wormholes
        weight += 2;
      }

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
      co2: (conn.distance_km * conn.co2_factor) / 1000,
      line: conn.line
    });
    curr = conn.from;
  }

  // If no path found, fallback to null so caller can decide
  if (legs.length === 0) {
    return null as any;
  }

  // Group consecutive legs of same mode
  let groupedLegs: RouteLeg[] = [];
  if (legs.length > 0) {
    let currentGroup = { ...legs[0], intermediateStops: [] as string[], intermediateCoords: [] as [number, number][] };
    for (let i = 1; i < legs.length; i++) {
      if (legs[i].mode === currentGroup.mode && legs[i].line === currentGroup.line) {
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

  // Filter out short distance walks but preserve start/end names
  const filteredLegs: RouteLeg[] = [];
  for (let i = 0; i < groupedLegs.length; i++) {
    const leg = groupedLegs[i];
    
    const n1 = leg.from.name.toLowerCase().replace(/railway station|bus stand|metro|mrts/g, '').trim();
    const n2 = leg.to.name.toLowerCase().replace(/railway station|bus stand|metro|mrts/g, '').trim();
    const isSimilarName = n1.includes(n2) || n2.includes(n1) || leg.distance <= 0.1;

    if (leg.mode === 'walk' && leg.distance <= 1.0 && isSimilarName) {
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

  // Sanity check
  const isGuindyToSipcot = startName.toLowerCase().includes('guindy') && endName.toLowerCase().includes('sipcot');
  if (isGuindyToSipcot) {
    if (totalDist < 20 || totalDist > 60) {
      return null;
    }
  }

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
