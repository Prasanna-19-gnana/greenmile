import { findRoute, getDistance } from '../src/lib/routing';

const SRM = { lat: 12.828, lng: 80.035, name: 'SRM Kattankulathur' };
const POTHERI = { lat: 12.823, lng: 80.044, name: 'Potheri Station' };

const dist = getDistance(SRM.lat, SRM.lng, POTHERI.lat, POTHERI.lng);
console.log(`Direct distance: ${dist} km`);

if (dist < 5) {
  const walkRoute = findRoute(SRM.lat, SRM.lng, SRM.name, POTHERI.lat, POTHERI.lng, POTHERI.name, 'time', 'walk');
  const autoRoute = findRoute(SRM.lat, SRM.lng, SRM.name, POTHERI.lat, POTHERI.lng, POTHERI.name, 'time', 'bike');

  console.log('WALK ROUTE:');
  walkRoute.legs.forEach(l => {
      console.log(`${l.mode.toUpperCase()}: ${l.from.name || l.from} -> ${l.to.name || l.to} (${l.distance.toFixed(1)}km, ${l.duration.toFixed(1)}m)`);
  });

  console.log('\nAUTO ROUTE:');
  autoRoute.legs.forEach(l => {
      console.log(`${l.mode.toUpperCase()}: ${l.from.name || l.from} -> ${l.to.name || l.to} (${l.distance.toFixed(1)}km, ${l.duration.toFixed(1)}m)`);
  });
} else {
  console.log('Distance >= 5, running full graph...');
}
