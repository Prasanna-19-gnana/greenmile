import fs from 'fs';
import path from 'path';

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'metro' | 'train' | 'bus';
}

interface Connection {
  from: string;
  to: string;
  mode: 'metro' | 'train' | 'bus' | 'walk';
  distance_km: number;
  duration_min: number;
  cost: number;
  frequency_min: number;
  co2_factor: number;
}

// Train Line (Beach to Chengalpattu)
const trainStations: Station[] = [
  { id: 't1', name: 'Chennai Beach Station', lat: 13.092, lng: 80.292, type: 'train' },
  { id: 't2', name: 'Chennai Fort Station', lat: 13.082, lng: 80.281, type: 'train' },
  { id: 't3', name: 'Chennai Park Station', lat: 13.081, lng: 80.273, type: 'train' },
  { id: 't4', name: 'Chennai Egmore Station', lat: 13.078, lng: 80.261, type: 'train' },
  { id: 't5', name: 'Chetpet Station', lat: 13.071, lng: 80.244, type: 'train' },
  { id: 't6', name: 'Nungambakkam Station', lat: 13.061, lng: 80.235, type: 'train' },
  { id: 't7', name: 'Kodambakkam Station', lat: 13.051, lng: 80.224, type: 'train' },
  { id: 't8', name: 'Mambalam Station', lat: 13.039, lng: 80.228, type: 'train' },
  { id: 't9', name: 'Saidapet Station', lat: 13.021, lng: 80.221, type: 'train' },
  { id: 't10', name: 'Guindy Railway Station', lat: 13.008, lng: 80.213, type: 'train' },
  { id: 't11', name: 'St Thomas Mount Station', lat: 12.995, lng: 80.198, type: 'train' },
  { id: 't12', name: 'Palavanthangal Station', lat: 12.986, lng: 80.187, type: 'train' },
  { id: 't13', name: 'Minambakkam Station', lat: 12.980, lng: 80.176, type: 'train' },
  { id: 't14', name: 'Tirusulam Station', lat: 12.981, lng: 80.165, type: 'train' },
  { id: 't15', name: 'Pallavaram Station', lat: 12.968, lng: 80.150, type: 'train' },
  { id: 't16', name: 'Chromepet Station', lat: 12.951, lng: 80.141, type: 'train' },
  { id: 't17', name: 'Tambaram Sanatorium Station', lat: 12.939, lng: 80.126, type: 'train' },
  { id: 't18', name: 'Tambaram Railway Station', lat: 12.924, lng: 80.114, type: 'train' },
  { id: 't19', name: 'Perungalathur Station', lat: 12.905, lng: 80.091, type: 'train' },
  { id: 't20', name: 'Vandalur Station', lat: 12.889, lng: 80.078, type: 'train' },
  { id: 't21', name: 'Urapakkam Station', lat: 12.868, lng: 80.069, type: 'train' },
  { id: 't22', name: 'Guduvancheri Station', lat: 12.846, lng: 80.059, type: 'train' },
  { id: 't23', name: 'Potheri Railway Station', lat: 12.823, lng: 80.044, type: 'train' },
  { id: 't24', name: 'Kattankulathur Railway Station', lat: 12.812, lng: 80.038, type: 'train' },
  { id: 't25', name: 'Maraimalai Nagar Railway Station', lat: 12.793, lng: 80.024, type: 'train' },
  { id: 't26', name: 'Singaperumal Koil Station', lat: 12.763, lng: 80.005, type: 'train' },
  { id: 't27', name: 'Paranur Station', lat: 12.730, lng: 79.992, type: 'train' },
  { id: 't28', name: 'Chengalpattu Jn', lat: 12.684, lng: 79.980, type: 'train' },
];

// Metro Blue Line
const blueLineStations: Station[] = [
  { id: 'm1', name: 'Wimco Nagar Depot Station', lat: 13.155, lng: 80.305, type: 'metro' },
  { id: 'm2', name: 'Wimco Nagar Metro', lat: 13.149, lng: 80.302, type: 'metro' },
  { id: 'm3', name: 'Thiruvottriyur', lat: 13.141, lng: 80.298, type: 'metro' },
  { id: 'm4', name: 'Thiruvottriyur Theradi', lat: 13.135, lng: 80.295, type: 'metro' },
  { id: 'm5', name: 'Kaladipet', lat: 13.128, lng: 80.293, type: 'metro' },
  { id: 'm6', name: 'TollGate', lat: 13.120, lng: 80.290, type: 'metro' },
  { id: 'm7', name: 'New Washermanpet', lat: 13.115, lng: 80.288, type: 'metro' },
  { id: 'm8', name: 'Tondiarpet', lat: 13.111, lng: 80.286, type: 'metro' },
  { id: 'm9', name: 'Sri Theagaraya College', lat: 13.109, lng: 80.284, type: 'metro' },
  { id: 'm10', name: 'Washermanpet', lat: 13.107, lng: 80.287, type: 'metro' },
  { id: 'm11', name: 'Mannadi', lat: 13.095, lng: 80.288, type: 'metro' },
  { id: 'm12', name: 'High Court', lat: 13.087, lng: 80.285, type: 'metro' },
  { id: 'm13', name: 'Puratchi Thalaivar Dr. M.G. Ramachandran Central', lat: 13.082, lng: 80.275, type: 'metro' },
  { id: 'm14', name: 'Government Estate', lat: 13.069, lng: 80.272, type: 'metro' },
  { id: 'm15', name: 'LIC', lat: 13.064, lng: 80.264, type: 'metro' },
  { id: 'm16', name: 'Thousand Lights', lat: 13.056, lng: 80.254, type: 'metro' },
  { id: 'm17', name: 'AG-DMS', lat: 13.048, lng: 80.249, type: 'metro' },
  { id: 'm18', name: 'Teynampet', lat: 13.041, lng: 80.245, type: 'metro' },
  { id: 'm19', name: 'Nandanam', lat: 13.031, lng: 80.237, type: 'metro' },
  { id: 'm20', name: 'Saidapet Metro', lat: 13.024, lng: 80.227, type: 'metro' },
  { id: 'm21', name: 'Little Mount', lat: 13.016, lng: 80.222, type: 'metro' },
  { id: 'm22', name: 'Guindy Metro', lat: 13.009, lng: 80.213, type: 'metro' },
  { id: 'm23', name: 'Arignar Anna Alandur', lat: 13.004, lng: 80.201, type: 'metro' },
  { id: 'm24', name: 'OTA-Nanganallur Road', lat: 12.996, lng: 80.188, type: 'metro' },
  { id: 'm25', name: 'Meenambakkam Metro', lat: 12.988, lng: 80.178, type: 'metro' },
  { id: 'm26', name: 'Chennai Airport', lat: 12.981, lng: 80.170, type: 'metro' },
];

// Metro Green Line
const greenLineStations: Station[] = [
  // Shared with blue line, reuse same ID
  { id: 'm13', name: 'Puratchi Thalaivar Dr. M.G. Ramachandran Central', lat: 13.082, lng: 80.275, type: 'metro' },
  { id: 'g2', name: 'Egmore Metro', lat: 13.078, lng: 80.261, type: 'metro' },
  { id: 'g3', name: 'Nehru Park', lat: 13.079, lng: 80.250, type: 'metro' },
  { id: 'g4', name: 'Kilpauk Medical College', lat: 13.079, lng: 80.240, type: 'metro' },
  { id: 'g5', name: 'Pachaiyappa\'s College', lat: 13.077, lng: 80.230, type: 'metro' },
  { id: 'g6', name: 'Shenoy Nagar', lat: 13.078, lng: 80.220, type: 'metro' },
  { id: 'g7', name: 'Anna Nagar East', lat: 13.083, lng: 80.215, type: 'metro' },
  { id: 'g8', name: 'Anna Nagar Tower', lat: 13.084, lng: 80.205, type: 'metro' },
  { id: 'g9', name: 'Thirumangalam', lat: 13.085, lng: 80.194, type: 'metro' },
  { id: 'g10', name: 'Koyambedu', lat: 13.075, lng: 80.194, type: 'metro' },
  { id: 'g11', name: 'Koyambedu Depot', lat: 13.067, lng: 80.195, type: 'metro' },
  { id: 'g12', name: 'Puratchi Thalaivi Dr. J. Jayalalithaa CMBT', lat: 13.067, lng: 80.205, type: 'metro' },
  { id: 'g13', name: 'Arumbakkam', lat: 13.061, lng: 80.208, type: 'metro' },
  { id: 'g14', name: 'Vadapalani', lat: 13.050, lng: 80.211, type: 'metro' },
  { id: 'g15', name: 'Ashok Nagar', lat: 13.038, lng: 80.210, type: 'metro' },
  { id: 'g16', name: 'Ekkattuthangal', lat: 13.020, lng: 80.206, type: 'metro' },
  // Shared with blue line, reuse same ID
  { id: 'm23', name: 'Arignar Anna Alandur', lat: 13.004, lng: 80.201, type: 'metro' },
  { id: 'g18', name: 'St. Thomas Mount Metro', lat: 12.995, lng: 80.198, type: 'metro' }, // Note: train interchange here!
];

// Deduplicate stations using map
const stationMap = new Map<string, Station>();
[...trainStations, ...blueLineStations, ...greenLineStations].forEach(s => stationMap.set(s.id, s));

const busStations: Station[] = [
  { id: 'b1', name: 'CMBT (Koyambedu) Bus Stand', lat: 13.067, lng: 80.205, type: 'bus' },
  { id: 'b2', name: 'Broadway Bus Stand', lat: 13.088, lng: 80.288, type: 'bus' },
  { id: 'b3', name: 'Tambaram Bus Stand', lat: 12.923, lng: 80.113, type: 'bus' },
  { id: 'b4', name: 'Guindy Bus Stand', lat: 13.008, lng: 80.214, type: 'bus' },
  { id: 'b5', name: 'Kelambakkam Bus Stand', lat: 12.788, lng: 80.220, type: 'bus' },
  { id: 'b6', name: 'T Nagar Bus Terminus', lat: 13.038, lng: 80.233, type: 'bus' },
];

busStations.forEach(s => stationMap.set(s.id, s));

const stations = Array.from(stationMap.values());

// Chennai Bounds
const LAT_MIN = 12.65;
const LAT_MAX = 13.15;
const LNG_MIN = 79.95;
const LNG_MAX = 80.30;

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function haversineDist(lat1: number, lon1: number, lat2: number, lon2: number) {
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

// Generate synthetic stations (buses/misc) to reach 200
const prefixes = ["Velachery", "Adyar", "Thiruvanmiyur", "Besant Nagar", "Mylapore", "Nungambakkam", "Chetpet", "Anna Nagar", "Kilpauk", "Perambur", "Madhavaram", "Tondiarpet", "Royapuram", "Triplicane", "Alwarpet", "Mandaveli", "Kk Nagar", "Ashok Nagar", "Vadapalani", "Saligramam", "Virugambakkam", "Porur", "Valasaravakkam", "Ramapuram", "Madipakkam", "Pallikaranai", "Medavakkam", "Sholinganallur", "Siruseri", "Navalur", "Padur"];
const suffixes = ["Bus Stop", "Junction", "Cross"];

let stationIdCounter = 1;
while (stations.length < 210) {
  const name = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
  stations.push({
    id: `syn_${stationIdCounter++}`,
    name,
    lat: randomInRange(LAT_MIN, LAT_MAX),
    lng: randomInRange(LNG_MIN, LNG_MAX),
    type: 'bus'
  });
}

const connections: Connection[] = [];
const CO2 = { metro: 30, train: 30, bus: 80 };
const SPEEDS = { metro: 45, train: 40, bus: 25 }; 
const COST_PER_KM = { metro: 3, train: 0.5, bus: 2 }; 

function addConnection(from: string, to: string, mode: 'metro' | 'train', stationsArr: Station[]) {
  const st1 = stationsArr.find(s => s.id === from);
  const st2 = stationsArr.find(s => s.id === to);
  if (!st1 || !st2) return;
  const d = haversineDist(st1.lat, st1.lng, st2.lat, st2.lng);
  connections.push({
    from: st1.id,
    to: st2.id,
    mode,
    distance_km: d,
    duration_min: (d / SPEEDS[mode]) * 60,
    cost: d * COST_PER_KM[mode],
    frequency_min: mode === 'train' ? 15 : 5,
    co2_factor: CO2[mode]
  });
  connections.push({
    to: st1.id,
    from: st2.id,
    mode,
    distance_km: d,
    duration_min: (d / SPEEDS[mode]) * 60,
    cost: d * COST_PER_KM[mode],
    frequency_min: mode === 'train' ? 15 : 5,
    co2_factor: CO2[mode]
  });
}

// 1. Connect fixed chains (Train line: Beach -> Chengalpattu)
for(let i=0; i < trainStations.length - 1; i++) {
  addConnection(trainStations[i].id, trainStations[i+1].id, 'train', trainStations);
}

// 2. Connect Blue Line
for(let i=0; i < blueLineStations.length - 1; i++) {
  addConnection(blueLineStations[i].id, blueLineStations[i+1].id, 'metro', stations);
}

// 3. Connect Green Line
for(let i=0; i < greenLineStations.length - 1; i++) {
  addConnection(greenLineStations[i].id, greenLineStations[i+1].id, 'metro', stations);
}

// 4. Connect Interchange stations (e.g., Guindy Metro <-> Guindy Train, etc)
// If nodes are within 500 meters of each other and of different types, link them with a 2-min walk.
for (let i = 0; i < stations.length; i++) {
  for (let j = i + 1; j < stations.length; j++) {
    const d = haversineDist(stations[i].lat, stations[i].lng, stations[j].lat, stations[j].lng);
    if (d < 0.5) { // 500m
      connections.push({
        from: stations[i].id,
        to: stations[j].id,
        mode: 'walk',
        distance_km: d,
        duration_min: (d / 5) * 60, // 5km/h walk
        cost: 0,
        frequency_min: 0,
        co2_factor: 0
      });
      connections.push({
        from: stations[j].id,
        to: stations[i].id,
        mode: 'walk',
        distance_km: d,
        duration_min: (d / 5) * 60,
        cost: 0,
        frequency_min: 0,
        co2_factor: 0
      });
    }
  }
}

// 5. Procedural Connections for buses
// Connect only buses to nearby other stations
for (let i = 0; i < stations.length; i++) {
  const st1 = stations[i];
  if (st1.type !== 'bus') continue; // only build out bus network randomly
  
  const dists = stations
    .map((st2, idx) => ({ idx, dist: haversineDist(st1.lat, st1.lng, st2.lat, st2.lng) }))
    .filter(d => d.idx !== i)
    .sort((a, b) => a.dist - b.dist);
  
  // Take 4 nearest neighbors
  const neighbors = dists.slice(0, 4);
  
  for (const neighbor of neighbors) {
    const st2 = stations[neighbor.idx];
    const d = neighbor.dist;
    
    // Avoid too long dense connections
    if (d > 10 && Math.random() > 0.2) continue;
    
    const conn: Connection = {
      from: st1.id,
      to: st2.id,
      mode: 'bus',
      distance_km: d,
      duration_min: (d / SPEEDS['bus']) * 60,
      cost: d * COST_PER_KM['bus'],
      frequency_min: Math.floor(randomInRange(10, 30)),
      co2_factor: CO2['bus']
    };
    
    const exists = connections.find(c => c.from === conn.from && c.to === conn.to && c.mode === conn.mode);
    if (!exists) {
      connections.push(conn);
      connections.push({ ...conn, from: conn.to, to: conn.from });
    }
  }
}

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

fs.writeFileSync(path.join(dataDir, 'stations.json'), JSON.stringify(stations, null, 2));
fs.writeFileSync(path.join(dataDir, 'connections.json'), JSON.stringify(connections, null, 2));

console.log(`Generated ${stations.length} stations and ${connections.length} connections.`);
