const fs = require('fs');

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isValidChennaiCoord(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < 12.3 || lat > 13.5) return false;
  if (lng < 79.7 || lng > 80.5) return false;
  return true;
}

function normalizeName(name) {
  if (!name) return "";
  let n = name.toLowerCase().trim();
  if (n.includes('potheri')) return 'Potheri';
  if (n.includes('guindy')) return 'Guindy';
  if (n.includes('srm kattankulathur') || n.includes('kattangulattur')) return 'Kattankulathur';
  if (n.includes('maraimalai nagar') || n.includes('maraimali nagar')) return 'Maraimalai Nagar';
  if (n.includes('tambaram railway station')) return 'Tambaram';
  if (n === 'tambaram sanatorium') return 'Tambaram Sanatorium';
  if (n.includes('sipcot it park') || n.includes('siruseri')) return 'SIPCOT';
  
  n = n.replace(/railway station/g, '').replace(/bus stop/g, '').replace(/bus stand/g, '').replace(/bus terminal/g, '');
  return n.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Canonical map
const coords = {
    "Guindy": [13.0080, 80.2130],
    "Chetpet": [13.0715, 80.2435],
    "Navalur": [12.8459, 80.2265],
    "SIPCOT": [12.8300, 80.2200],
    "Sipcot": [12.8300, 80.2200],
    "Tambaram": [12.9250, 80.1110],
    "Potheri": [12.8220, 80.0380],
    "Kelambakkam": [12.7900, 80.2200],
    "Tidel Park": [12.9896, 80.2489],
    "Thiruvanmiyur": [12.9840, 80.2520],
    "Velachery": [12.9754, 80.2206],
    "St Thomas Mount": [12.9950, 80.1980],
    "Chennai Central": [13.0827, 80.2707],
    "Chennai Beach": [13.0925, 80.2933],
    "CMBT": [13.0673, 80.2058],
    "Broadway": [13.0878, 80.2845],
    "Anna Nagar": [13.0850, 80.2101],
    "Parrys": [13.0886, 80.2869],
    "Adyar": [13.0067, 80.2575],
        "Anna Nagar East Metro": [13.0848, 80.2198],
    "Thirumangalam Metro": [13.0852, 80.1948],
    "Government Estate": [13.0673, 80.2730],
    "Chepauk MRTS": [13.0645, 80.2818],
    "Triplicane / Marina": [13.0560, 80.2800],
"Sholinganallur": [12.9010, 80.2279],

    // Keep some existing suburban lines so they don't break
    "Chennai Fort": [13.0820, 80.2810],
    "Chennai Park": [13.0818, 80.2736],
    "Park Town": [13.0811, 80.2747],
    "Chennai Egmore": [13.0785, 80.2608],
    "Nungambakkam": [13.0594, 80.2355],
    "Kodambakkam": [13.0506, 80.2268],
    "Mambalam": [13.0390, 80.2280],
    "Saidapet": [13.0210, 80.2210],
    "Pazhavanthangal": [12.9860, 80.1870],
    "Meenambakkam": [12.9810, 80.1790],
    "Tirusulam": [12.9770, 80.1650],
    "Pallavaram": [12.9690, 80.1480],
    "Chromepet": [12.9540, 80.1380],
    "Tambaram Sanatorium": [12.9370, 80.1220],
    "Perungalathur": [12.9050, 80.0950],
    "Vandalur": [12.8880, 80.0840],
    "Urapakkam": [12.8680, 80.0650],
    "Guduvancheri": [12.8440, 80.0550],
    "Kattankulathur": [12.8120, 80.0260],
    "Maraimalai Nagar": [12.7930, 80.0130],
    "Singaperumal Koil": [12.7600, 79.9980],
    "Paranur": [12.7210, 79.9860],
    "Chengalpattu": [12.6950, 79.9760]
};

const overpassMap = {};
if (fs.existsSync('data/overpass_bus_stops.json')) {
  const overpassData = JSON.parse(fs.readFileSync('data/overpass_bus_stops.json', 'utf-8'));
  overpassData.elements.forEach(node => {
    if (node.tags && node.tags.name) {
      const norm = normalizeName(node.tags.name);
      if (!overpassMap[norm]) {
        overpassMap[norm] = [node.lat, node.lon];
      }
    }
  });
}

const stations = {}; // name -> station object
const connections = [];

function getOrCreateStation(name, type, line) {
  const norm = normalizeName(name);
  if (!stations[norm]) {
    stations[norm] = {
      id: `st_${Object.keys(stations).length + 1}`,
      name: norm,
      lat: coords[norm] ? coords[norm][0] : null,
      lng: coords[norm] ? coords[norm][1] : null,
      type: type,
      lines: []
    };
  }
  if (line && !stations[norm].lines.includes(line)) {
    stations[norm].lines.push(line);
  }
  if (type === 'train' && stations[norm].type === 'bus') {
    stations[norm].type = 'train';
  }
  if (stations[norm].lat === null && coords[norm]) {
    stations[norm].lat = coords[norm][0];
    stations[norm].lng = coords[norm][1];
  }
  if (stations[norm].lat === null && overpassMap[norm]) {
    stations[norm].lat = overpassMap[norm][0];
    stations[norm].lng = overpassMap[norm][1];
  }
  // Validate bounding box
  if (stations[norm].lat !== null && !isValidChennaiCoord(stations[norm].lat, stations[norm].lng)) {
    stations[norm].lat = null;
    stations[norm].lng = null;
  }
  return stations[norm];
}

// Parse Train
const trainCsv = fs.readFileSync('chennai_suburban_50_routes_directions.csv', 'utf-8').split('\n');
const trainRoutes = {};

for (let i = 1; i < trainCsv.length; i++) {
  if (!trainCsv[i].trim()) continue;
  const row = trainCsv[i].split(',');
  const routeId = row[0].trim();
  const line = row[2].trim();
  const stationName = row[4].trim();

  if (!trainRoutes[routeId]) trainRoutes[routeId] = [];
  const st = getOrCreateStation(stationName, 'train', line);
  trainRoutes[routeId].push({ st, line });
}

// Create Train Edges
for (const routeId in trainRoutes) {
  const routeSeq = trainRoutes[routeId];
  let lastValidNode = null;
  for (let i = 0; i < routeSeq.length; i++) {
    const node = routeSeq[i];
    if (node.st.lat === null || node.st.lng === null) continue;

    if (lastValidNode && lastValidNode.st.id !== node.st.id) {
      let baseDist = haversineDistanceKm(lastValidNode.st.lat, lastValidNode.st.lng, node.st.lat, node.st.lng);
      if (baseDist <= 0 || baseDist > 60) {
        lastValidNode = node;
        continue;
      }
      const adjDist = baseDist * 1.05; // train/metro = haversine x 1.05
      connections.push({
        from: lastValidNode.st.id,
        to: node.st.id,
        mode: 'train',
        distance_km: adjDist,
        duration_min: (adjDist / 40) * 60,
        cost: 5,
        frequency_min: 15,
        co2_factor: 30,
        line: node.line,
        debug: { fromCoord: [lastValidNode.st.lat, lastValidNode.st.lng], toCoord: [node.st.lat, node.st.lng], rawHaversine: baseDist, multiplier: 1.05, finalDist: adjDist, validation: 'Valid' }
      });
    }
    lastValidNode = node;
  }
}

// Parse Bus
const busCsv = fs.readFileSync('bus_route_detail_with_route_names.csv', 'utf-8').split('\n');
const busRoutes = {};

for (let i = 1; i < busCsv.length; i++) {
  if (!busCsv[i].trim()) continue;
  const row = busCsv[i].split(',');
  const routeId = row[1];
  const stopName = row[3];
  
  if (!stopName) continue;
  if (!busRoutes[routeId]) busRoutes[routeId] = [];
  
  const st = getOrCreateStation(stopName, 'bus', `Bus Route ${routeId}`);
  busRoutes[routeId].push(st);
}

// Create Bus Edges
for (const routeId in busRoutes) {
  const routeStops = busRoutes[routeId];
  let lastValidSt = null;

  for (let i = 0; i < routeStops.length; i++) {
    const st = routeStops[i];
    if (st.lat === null || st.lng === null) continue;

    if (lastValidSt && lastValidSt.id !== st.id) {
      let baseDist = haversineDistanceKm(lastValidSt.lat, lastValidSt.lng, st.lat, st.lng);
      if (baseDist <= 0 || baseDist > 60) {
        lastValidSt = st;
        continue;
      }
      const adjDist = baseDist * 1.3; // bus = haversine x 1.3
      connections.push({
        from: lastValidSt.id,
        to: st.id,
        mode: 'bus',
        distance_km: adjDist,
        duration_min: (adjDist / 15) * 60,
        cost: 2,
        frequency_min: 10,
        co2_factor: 80,
        line: `Bus Route ${routeId}`,
        debug: { fromCoord: [lastValidSt.lat, lastValidSt.lng], toCoord: [st.lat, st.lng], rawHaversine: baseDist, multiplier: 1.3, finalDist: adjDist, validation: 'Valid' }
      });
    }
    lastValidSt = st;
  }
}

function addInterchange(name1, name2) {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);
  const s1 = stations[norm1];
  const s2 = stations[norm2];
  if (s1 && s2 && s1.id !== s2.id && s1.lat !== null && s2.lat !== null) {
    let baseDist = haversineDistanceKm(s1.lat, s1.lng, s2.lat, s2.lng);
    if (baseDist <= 0 || baseDist > 5) return; // Disallow weird cross-city interchanges
    const walkDist = baseDist * 1.2; // walk = haversine x 1.2
    
    if (walkDist <= 2) {
      connections.push({
        from: s1.id, to: s2.id, mode: 'walk', distance_km: walkDist, duration_min: (walkDist / 5) * 60,
        cost: 0, frequency_min: 0, co2_factor: 0, line: 'Transfer'
      });
      connections.push({
        from: s2.id, to: s1.id, mode: 'walk', distance_km: walkDist, duration_min: (walkDist / 5) * 60,
        cost: 0, frequency_min: 0, co2_factor: 0, line: 'Transfer'
      });
    }
  }
}

addInterchange('Chennai Central', 'Chennai Park');
addInterchange('Chennai Central', 'Park Town');
addInterchange('Chennai Park', 'Park Town');

// Optional: clean out stations that have no coords so they don't break frontend

// Hardcoded Metro Corridors
function addMetroEdge(name1, name2, line, freq) {
  const s1 = getOrCreateStation(name1, 'metro', line);
  const s2 = getOrCreateStation(name2, 'metro', line);
  if (s1.lat !== null && s2.lat !== null) {
    let baseDist = haversineDistanceKm(s1.lat, s1.lng, s2.lat, s2.lng);
    let adjDist = baseDist * 1.05;
    connections.push({
      from: s1.id, to: s2.id, mode: 'metro', distance_km: adjDist, duration_min: (adjDist / 40) * 60,
      cost: 10, frequency_min: freq, co2_factor: 20, line: line,
      debug: { fromCoord: [s1.lat, s1.lng], toCoord: [s2.lat, s2.lng], rawHaversine: baseDist, multiplier: 1.05, finalDist: adjDist, validation: 'Valid' }
    });
    connections.push({
      from: s2.id, to: s1.id, mode: 'metro', distance_km: adjDist, duration_min: (adjDist / 40) * 60,
      cost: 10, frequency_min: freq, co2_factor: 20, line: line,
      debug: { fromCoord: [s2.lat, s2.lng], toCoord: [s1.lat, s1.lng], rawHaversine: baseDist, multiplier: 1.05, finalDist: adjDist, validation: 'Valid' }
    });
  }
}

addMetroEdge('Thirumangalam Metro', 'Anna Nagar East Metro', 'Metro Green Line', 5);
addMetroEdge('Anna Nagar East Metro', 'Chennai Central', 'Metro Green Line', 5);
addMetroEdge('Chennai Central', 'Government Estate', 'Metro Blue Line', 5);

// Add requested interchanges
addInterchange('Government Estate', 'Chepauk MRTS');
addInterchange('Government Estate', 'Triplicane / Marina');
addInterchange('Chepauk MRTS', 'Triplicane / Marina');

const validStations = Object.values(stations).filter(s => s.lat !== null && s.lng !== null);

fs.writeFileSync('data/stations.json', JSON.stringify(validStations, null, 2));
fs.writeFileSync('data/connections.json', JSON.stringify(connections, null, 2));

console.log("Graph built! Stations: " + validStations.length + ", Connections: " + connections.length);
