import { findRoute } from '../src/lib/routing';

const SRM = { lat: 12.823, lng: 80.044, name: 'SRM' };
const GUINDY = { lat: 13.008, lng: 80.213, name: 'Guindy' };

const timeRoute = findRoute(SRM.lat, SRM.lng, SRM.name, GUINDY.lat, GUINDY.lng, GUINDY.name, 'time');
console.log('TIME ROUTE LEGS:');
timeRoute.legs.forEach(l => {
    console.log(`${l.mode.toUpperCase()}: ${l.from.name} -> ${l.to.name} (${l.distance.toFixed(1)}km, ${l.duration.toFixed(1)}m)`);
});

const balancedRoute = findRoute(SRM.lat, SRM.lng, SRM.name, GUINDY.lat, GUINDY.lng, GUINDY.name, 'balanced');
console.log('\nBALANCED ROUTE LEGS:');
balancedRoute.legs.forEach(l => {
    console.log(`${l.mode.toUpperCase()}: ${l.from.name} -> ${l.to.name} (${l.distance.toFixed(1)}km, ${l.duration.toFixed(1)}m)`);
});
