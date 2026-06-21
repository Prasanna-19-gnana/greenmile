const fs = require('fs');
const stations = JSON.parse(fs.readFileSync('data/stations.json', 'utf-8'));

function getDistance(lat1, lon1, lat2, lon2) {
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

const startLat = 12.8120;
const startLng = 80.0260;
let startStations = stations.map(st => ({
    st,
    dist: getDistance(startLat, startLng, st.lat, st.lng)
})).sort((a, b) => a.dist - b.dist);

console.log(startStations.slice(0, 5).map(s => `${s.st.name} - ${s.dist}`));
