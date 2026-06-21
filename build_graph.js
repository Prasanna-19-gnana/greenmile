const fs = require('fs');

function normalizeName(name) {
  if (!name) return "";
  let n = name.toLowerCase().trim();
  // Handle specific spellings
  if (n.includes('potheri')) return 'Potheri';
  if (n.includes('guindy')) return 'Guindy';
  if (n.includes('srm kattankulathur') || n.includes('kattangulattur')) return 'Kattankulathur';
  if (n.includes('maraimalai nagar') || n.includes('maraimali nagar')) return 'Maraimalai Nagar';
  if (n.includes('tambaram railway station')) return 'Tambaram';
  if (n === 'tambaram sanatorium') return 'Tambaram Sanatorium';
  
  // Remove words like "railway station", "bus stop" etc
  n = n.replace(/railway station/g, '').replace(/bus stop/g, '').replace(/bus stand/g, '').replace(/bus terminal/g, '');
  // capitalize first letters
  return n.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Existing coords for trains
const coords = {
    "Chennai Beach": [13.0925, 80.2933],
    "Chennai Fort": [13.0820, 80.2810],
    "Chennai Park": [13.0818, 80.2736],
    "Park Town": [13.0811, 80.2747],
    "Chennai Park Town": [13.0811, 80.2747],
    "Chennai Central": [13.0827, 80.2707],
    "Chennai Egmore": [13.0785, 80.2608],
    "Chetpet": [13.0715, 80.2435],
    "Nungambakkam": [13.0594, 80.2355],
    "Kodambakkam": [13.0506, 80.2268],
    "Mambalam": [13.0390, 80.2280],
    "Saidapet": [13.0210, 80.2210],
    "Guindy": [13.0080, 80.2130],
    "St Thomas Mount": [12.9950, 80.1980],
    "St. Thomas Mount": [12.9950, 80.1980],
    "Pazhavanthangal": [12.9860, 80.1870],
    "Meenambakkam": [12.9810, 80.1790],
    "Tirusulam": [12.9770, 80.1650],
    "Pallavaram": [12.9690, 80.1480],
    "Chromepet": [12.9540, 80.1380],
    "Tambaram Sanatorium": [12.9370, 80.1220],
    "Tambaram": [12.9250, 80.1110],
    "Perungalathur": [12.9050, 80.0950],
    "Vandalur": [12.8880, 80.0840],
    "Urapakkam": [12.8680, 80.0650],
    "Guduvancheri": [12.8440, 80.0550],
    "Potheri": [12.8220, 80.0380],
    "Kattankulathur": [12.8120, 80.0260],
    "Maraimalai Nagar": [12.7930, 80.0130],
    "Singaperumal Koil": [12.7600, 79.9980],
    "Paranur": [12.7210, 79.9860],
    "Chengalpattu": [12.6950, 79.9760],
    "Chintadripet": [13.0720, 80.2740],
    "Chepauk": [13.0640, 80.2810],
    "Thiruvallikeni": [13.0580, 80.2800],
    "Light House": [13.0450, 80.2790],
    "Mundakanniamman Koil": [13.0370, 80.2740],
    "Thirumayilai": [13.0330, 80.2670],
    "Mandaveli": [13.0230, 80.2600],
    "Greenways Road": [13.0180, 80.2520],
    "Kotturpuram": [13.0110, 80.2430],
    "Kasturba Nagar": [13.0010, 80.2480],
    "Indira Nagar": [12.9930, 80.2500],
    "Thiruvanmiyur": [12.9840, 80.2520],
    "Taramani": [12.9770, 80.2450],
    "Perungudi": [12.9660, 80.2440],
    "Velachery": [12.9754, 80.2206],
    "Puzhuthivakkam": [12.9810, 80.2080],
    "Adambakkam": [12.9870, 80.2030]
};

const stations = {}; // name -> station object
const connections = [];

function getOrCreateStation(name, type, line) {
  const norm = normalizeName(name);
  if (!stations[norm]) {
    stations[norm] = {
      id: `st_${Object.keys(stations).length + 1}`,
      name: norm,
      lat: coords[norm] ? coords[norm][0] : 0,
      lng: coords[norm] ? coords[norm][1] : 0,
      type: type,
      lines: []
    };
  }
  if (line && !stations[norm].lines.includes(line)) {
    stations[norm].lines.push(line);
  }
  // Upgrade type if train 
  if (type === 'train' && stations[norm].type === 'bus') {
    stations[norm].type = 'train';
  }
  // Infer coordinates for bus if missing but shares name with train
  if (stations[norm].lat === 0 && coords[norm]) {
    stations[norm].lat = coords[norm][0];
    stations[norm].lng = coords[norm][1];
  }
  return stations[norm];
}

// Parse Train
const trainCsv = fs.readFileSync('chennai_suburban_50_routes_directions.csv', 'utf-8').split('\n');
const trainHeaders = trainCsv[0].split(',');
let prevTrain = null;
let currentTrainRoute = null;

for (let i = 1; i < trainCsv.length; i++) {
  if (!trainCsv[i].trim()) continue;
  // simple split by comma since there are no commas in the values
  const row = trainCsv[i].split(',');
  const routeId = row[0].trim();
  const line = row[2].trim();
  const stationName = row[4].trim();
  const minsFromPrev = parseInt(row[5]) || 3;

  if (routeId !== currentTrainRoute) {
    prevTrain = null;
    currentTrainRoute = routeId;
  }

  const st = getOrCreateStation(stationName, 'train', line);

  if (prevTrain) {
    connections.push({
      from: prevTrain.id,
      to: st.id,
      mode: 'train',
      distance_km: minsFromPrev * (40/60), // assume 40km/h
      duration_min: minsFromPrev,
      cost: 5,
      frequency_min: 15,
      co2_factor: 30,
      line: line
    });
  }
  prevTrain = st;
}

// Parse Bus
const busCsv = fs.readFileSync('bus_route_detail_with_route_names.csv', 'utf-8').split('\n');
let prevBus = null;
let currentBusRoute = null;

for (let i = 1; i < busCsv.length; i++) {
  if (!busCsv[i].trim()) continue;
  const row = busCsv[i].split(',');
  const routeId = row[1];
  const stopName = row[3];
  
  if (!stopName) continue;

  if (routeId !== currentBusRoute) {
    prevBus = null;
    currentBusRoute = routeId;
  }

  const st = getOrCreateStation(stopName, 'bus', `Bus Route ${routeId}`);

  if (prevBus) {
    connections.push({
      from: prevBus.id,
      to: st.id,
      mode: 'bus',
      distance_km: 0.5, // est distance
      duration_min: 4, // est time
      cost: 2,
      frequency_min: 10,
      co2_factor: 80,
      line: `Bus Route ${routeId}`
    });
  }
  prevBus = st;
}

// Transfers (Manual + Automatic)
// Automatically connect exact name matches
// Since we normalized and grouped by name, they already share the exact same node!
// Example: Guindy train and Guindy bus map to the same `stations["Guindy"]` object.
// So we don't need transfer edges for exact name matches. They are the same node.

// Manual Interchanges
function addInterchange(name1, name2, distKm) {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);
  const s1 = stations[norm1];
  const s2 = stations[norm2];
  if (s1 && s2 && s1.id !== s2.id) {
    const walkTime = (distKm / 5) * 60;
    if (distKm <= 2) {
      connections.push({
        from: s1.id, to: s2.id, mode: 'walk', distance_km: distKm, duration_min: walkTime,
        cost: 0, frequency_min: 0, co2_factor: 0, line: 'Transfer'
      });
      connections.push({
        from: s2.id, to: s1.id, mode: 'walk', distance_km: distKm, duration_min: walkTime,
        cost: 0, frequency_min: 0, co2_factor: 0, line: 'Transfer'
      });
    }
    if (distKm > 1) {
      const autoTime = (distKm / 20) * 60;
      connections.push({
        from: s1.id, to: s2.id, mode: 'bike', distance_km: distKm, duration_min: autoTime,
        cost: distKm * 15, frequency_min: 0, co2_factor: 70, line: 'Transfer'
      });
      connections.push({
        from: s2.id, to: s1.id, mode: 'bike', distance_km: distKm, duration_min: autoTime,
        cost: distKm * 15, frequency_min: 0, co2_factor: 70, line: 'Transfer'
      });
    }
  }
}

addInterchange('Chennai Central', 'Chennai Park', 0.5);
addInterchange('Chennai Central', 'Park Town', 0.5);
addInterchange('Chennai Park', 'Park Town', 0.2);

fs.writeFileSync('data/stations.json', JSON.stringify(Object.values(stations), null, 2));
fs.writeFileSync('data/connections.json', JSON.stringify(connections, null, 2));

console.log("Graph built!");
