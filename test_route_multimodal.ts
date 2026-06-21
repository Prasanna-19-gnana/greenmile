import { findRoute, getDistance } from './src/lib/routing';
import util from 'util';

// SRM Kattankulathur is ~12.8120, 80.0260 (from my script)
// Guindy is ~13.0080, 80.2130
const route = findRoute(12.8120, 80.0260, "SRM Kattankulathur", 13.0080, 80.2130, "Guindy", "balanced");

console.log(util.inspect(route, { depth: null }));
