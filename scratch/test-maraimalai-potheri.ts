import { findRoute, getDistance } from '../src/lib/routing';

const MARAIMALAI = { lat: 12.793, lng: 80.024, name: 'Maraimalai Nagar Railway Station' };
const POTHERI = { lat: 12.823, lng: 80.044, name: 'Potheri Railway Station' };

const dist = getDistance(MARAIMALAI.lat, MARAIMALAI.lng, POTHERI.lat, POTHERI.lng);
console.log(`Direct distance: ${dist.toFixed(2)} km`);

if (dist <= 2) {
  console.log('Distance <= 2km. Showing only Walk/Auto.');
} else {
  console.log('Distance > 2km. Running graph...');
  const timeRoute = findRoute(MARAIMALAI.lat, MARAIMALAI.lng, MARAIMALAI.name, POTHERI.lat, POTHERI.lng, POTHERI.name, 'time');
  
  console.log('\nTRAIN ROUTE:');
  timeRoute.legs.forEach(l => {
      console.log(`${l.mode.toUpperCase()}: ${l.from.name || l.from} -> ${l.to.name || l.to} (${l.distance.toFixed(1)}km, ${l.duration.toFixed(1)}m)`);
  });
}
