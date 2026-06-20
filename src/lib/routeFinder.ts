import fs from 'fs';
import path from 'path';

export interface Location {
  lat: number;
  lng: number;
}

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
}

export interface Connection {
  from: string;
  to: string;
  mode: string;
  distance_km: number;
  duration_min: number;
  cost: number;
}

interface GraphNode {
  id: string;
  edges: { to: string; duration: number }[];
}

export class RouteFinder {
  private stations: Station[] = [];
  private connections: Connection[] = [];
  private graph: Map<string, GraphNode> = new Map();

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      
      const stationsPath = path.join(dataDir, 'stations.json');
      if (fs.existsSync(stationsPath)) {
        this.stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
      }

      const connectionsPath = path.join(dataDir, 'connections.json');
      if (fs.existsSync(connectionsPath)) {
        this.connections = JSON.parse(fs.readFileSync(connectionsPath, 'utf8'));
      }

      this.buildGraph();
    } catch (err) {
      console.error('Failed to load routing data', err);
    }
  }

  private buildGraph() {
    for (const station of this.stations) {
      this.graph.set(station.id, { id: station.id, edges: [] });
    }

    for (const conn of this.connections) {
      const node = this.graph.get(conn.from);
      if (node) {
        node.edges.push({ to: conn.to, duration: conn.duration_min });
      }
    }
    
    // Process the new suburban CSV
    try {
      const csvPath = path.join(process.cwd(), 'chennai_suburban_routes_dataset.csv');
      if (fs.existsSync(csvPath)) {
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.split('\n').filter(l => l.trim().length > 0);
        // Header: route,station_order,station_name,minutes_from_previous,cumulative_minutes
        
        // Find station IDs for names
        const nameToId = new Map(this.stations.map(s => [s.name.toLowerCase(), s.id]));
        
        let previousStationId: string | null = null;
        let previousRoute: string | null = null;

        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',');
          if (parts.length < 5) continue;
          const route = parts[0];
          const name = parts[2];
          const durationStr = parts[3];
          
          const duration = parseFloat(durationStr);
          const stationId = nameToId.get(name.toLowerCase());
          
          if (stationId) {
            if (!this.graph.has(stationId)) {
              this.graph.set(stationId, { id: stationId, edges: [] });
            }
            
            // Link to previous station if on the same route
            if (previousRoute === route && previousStationId && !isNaN(duration) && duration > 0) {
              this.graph.get(previousStationId)?.edges.push({ to: stationId, duration });
              this.graph.get(stationId)?.edges.push({ to: previousStationId, duration }); // Assume bidirectional
            }
            
            previousStationId = stationId;
            previousRoute = route;
          } else {
            // Station from CSV not found in JSON
            previousStationId = null;
          }
        }
      }
    } catch (err) {
      console.error('Failed to parse suburban CSV', err);
    }
  }

  // Haversine formula to find distance between two coordinates
  private getDistanceKm(loc1: Location, loc2: Location): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(loc2.lat - loc1.lat);
    const dLon = this.deg2rad(loc2.lng - loc1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(loc1.lat)) * Math.cos(this.deg2rad(loc2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  public findNearestStation(loc: Location): Station | null {
    if (this.stations.length === 0) return null;

    let nearest = this.stations[0];
    let minDistance = this.getDistanceKm(loc, { lat: nearest.lat, lng: nearest.lng });

    for (const station of this.stations) {
      const distance = this.getDistanceKm(loc, { lat: station.lat, lng: station.lng });
      if (distance < minDistance) {
        nearest = station;
        minDistance = distance;
      }
    }

    return nearest;
  }

  public findRoute(startLoc: Location, endLoc: Location) {
    const startStation = this.findNearestStation(startLoc);
    const endStation = this.findNearestStation(endLoc);

    if (!startStation || !endStation) {
      return { error: "Could not find nearby stations." };
    }

    // Dijkstra's algorithm to find shortest path
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    for (const nodeId of Array.from(this.graph.keys())) {
      distances.set(nodeId, Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    }

    distances.set(startStation.id, 0);

    while (unvisited.size > 0) {
      let currentLocId: string | null = null;
      let minDst = Infinity;
      
      for (const nodeId of Array.from(unvisited)) {
        const dst = distances.get(nodeId) || Infinity;
        if (dst < minDst) {
          minDst = dst;
          currentLocId = nodeId;
        }
      }

      if (currentLocId === null || minDst === Infinity) {
        break; // Unreachable
      }

      if (currentLocId === endStation.id) {
        break; // Found destination
      }

      unvisited.delete(currentLocId);

      const node = this.graph.get(currentLocId);
      if (node) {
        for (const edge of node.edges) {
          if (unvisited.has(edge.to)) {
            const alt = (distances.get(currentLocId) || Infinity) + edge.duration;
            if (alt < (distances.get(edge.to) || Infinity)) {
              distances.set(edge.to, alt);
              previous.set(edge.to, currentLocId);
            }
          }
        }
      }
    }

    const path: Station[] = [];
    let current: string | null = endStation.id;

    if (previous.get(current) !== null || current === startStation.id) {
      while (current !== null) {
        const station = this.stations.find(s => s.id === current);
        if (station) path.unshift(station);
        current = previous.get(current) || null;
      }
    }

    const totalDuration = distances.get(endStation.id);

    return {
      startStation,
      endStation,
      path,
      totalDurationMinutes: totalDuration === Infinity ? null : totalDuration
    };
  }
}
