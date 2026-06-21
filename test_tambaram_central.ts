import { findRoute } from './src/lib/routing.ts';
const startLat = 12.924, startLng = 80.114; // Tambaram
const endLat = 13.0827, endLng = 80.2707; // Chennai Central

const route = findRoute(startLat, startLng, 'Tambaram Railway Station', endLat, endLng, 'Chennai Central', 'time');
console.log(JSON.stringify(route, null, 2));
