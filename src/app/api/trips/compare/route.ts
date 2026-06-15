import { NextRequest, NextResponse } from 'next/server';
import { findRoute, RouteOption, getDistance, getStationByName } from '@/lib/routing';
import { explainRoute } from '@/lib/gemini';

const NORMALIZATION_MAP: Record<string, string> = {
  'maraimalai nagar': 'Maraimalai Nagar Railway Station',
  'maraimali nagar': 'Maraimalai Nagar Railway Station',
  'kattankulathur': 'SRM Kattankulathur',
  'katankulathur': 'SRM Kattankulathur',
  'srm kattankulathur': 'SRM Kattankulathur',
  'srm': 'SRM Kattankulathur',
  'potheri': 'Potheri Railway Station',
  'potheri station': 'Potheri Railway Station',
  'guindy': 'Guindy Railway Station',
  'guindy station': 'Guindy Railway Station',
  'tambaram': 'Tambaram Railway Station',
  'tambaram station': 'Tambaram Railway Station',
  'chennai central': 'Chennai Central',
  'central': 'Chennai Central'
};

const GEOCODING: Record<string, [number, number]> = {
  'Maraimalai Nagar Railway Station': [12.793, 80.024],
  'Kattankulathur Railway Station': [12.812, 80.038],
  'SRM Kattankulathur': [12.828, 80.035],
  'Potheri Railway Station': [12.823, 80.044],
  'Guindy Railway Station': [13.008, 80.213],
  'Tambaram Railway Station': [12.924, 80.114],
  'Chennai Central': [13.0827, 80.2707],
  'Velachery': [12.9754, 80.2206],
  'T Nagar': [13.0418, 80.2341],
  'Anna Nagar': [13.0827, 80.2116],
  'Marina Beach': [13.0500, 80.2824],
};

function normalizePlace(place: string): string {
  if (!place) return place;
  const p = place.toLowerCase().trim();
  for (const [alias, realName] of Object.entries(NORMALIZATION_MAP)) {
    if (p.includes(alias)) return realName;
  }
  return place;
}

function getCoords(place: string, defaultFallback: [number, number]): [number, number] {
  if (!place) return defaultFallback;
  const norm = normalizePlace(place);
  const match = Object.keys(GEOCODING).find(k => norm.toLowerCase() === k.toLowerCase() || norm.toLowerCase().includes(k.toLowerCase()));
  if (match) return GEOCODING[match];
  
  const station = getStationByName(norm);
  if (station) {
    return [station.lat, station.lng];
  }
  
  return defaultFallback;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, destination } = body;

    if (!source || !destination) {
      return NextResponse.json({ error: 'Missing source or destination' }, { status: 400 });
    }

    const normSource = normalizePlace(source);
    const normDest = normalizePlace(destination);

    const startCoords = getCoords(source, GEOCODING['SRM Kattankulathur']);
    const endCoords = getCoords(destination, GEOCODING['Guindy']);

    const directDistance = getDistance(startCoords[0], startCoords[1], endCoords[0], endCoords[1]);

    let allRoutes: RouteOption[] = [];
    const carRoute = findRoute(startCoords[0], startCoords[1], normSource, endCoords[0], endCoords[1], normDest, 'time', 'car');
    carRoute.label = "Direct Car";

    if (directDistance <= 2) {
      const walkRoute = findRoute(startCoords[0], startCoords[1], normSource, endCoords[0], endCoords[1], normDest, 'time', 'walk');
      const autoRoute = findRoute(startCoords[0], startCoords[1], normSource, endCoords[0], endCoords[1], normDest, 'time', 'bike');
      walkRoute.label = "Walk";
      autoRoute.label = "Auto";
      allRoutes = [walkRoute, autoRoute];
    } else {
      const timeRoute = findRoute(startCoords[0], startCoords[1], normSource, endCoords[0], endCoords[1], normDest, 'time');
      const costRoute = findRoute(startCoords[0], startCoords[1], normSource, endCoords[0], endCoords[1], normDest, 'cost');
      const co2Route = findRoute(startCoords[0], startCoords[1], normSource, endCoords[0], endCoords[1], normDest, 'co2');
      const balancedRoute = findRoute(startCoords[0], startCoords[1], normSource, endCoords[0], endCoords[1], normDest, 'balanced');
      
      balancedRoute.label = "Best Balanced Route";
      timeRoute.label = "Fastest Route";
      co2Route.label = "Lowest Carbon Route";
      costRoute.label = "Cheapest Route";
      
      allRoutes = [balancedRoute, timeRoute, co2Route, costRoute, carRoute];
    }
    const carCo2 = carRoute.totalCo2;
    const carCost = carRoute.totalCost;

    const uniqueRoutesMap = new Map<string, RouteOption>();
    
    for (const r of allRoutes) {
      // Create a signature based on modes used
      const sig = r.legs.map(l => l.mode).join('-');
      if (!uniqueRoutesMap.has(sig) || r.label === 'Best Balanced Route') {
        uniqueRoutesMap.set(sig, r);
      }
    }
    
    const uniqueRoutes = Array.from(uniqueRoutesMap.values());

    // Generate explanations concurrently
    const routePromises = uniqueRoutes.map(async (r) => {
      // Explain the route using Gemini
      const explanation = await explainRoute(r);
      
      const co2Saved = Math.max(0, carCo2 - r.totalCo2);
      const costSaved = Math.max(0, carCost - r.totalCost);
      const greenScore = Math.max(0, 100 - (r.totalCo2 / carCo2) * 100);
      
      return {
        // UI fields
        mode: r.id,
        label: r.label,
        distance: Math.round(r.totalDistance * 10) / 10,
        co2_emitted: Math.round(r.totalCo2 * 100) / 100,
        estimated_cost: Math.round(r.totalCost),
        travel_time_min: Math.round(r.totalDuration),
        green_score: Math.round(greenScore),
        co2_saved: Math.round(co2Saved * 100) / 100,
        cost_saved: Math.round(costSaved),
        isRecommended: false as boolean | undefined,
        
        // Advanced fields
        totalDistance: r.totalDistance,
        totalDuration: r.totalDuration,
        totalCo2: r.totalCo2,
        cost: r.totalCost,
        geminiExplanation: explanation,
        
        legs: r.legs.map(l => ({
          fromName: typeof l.from === 'string' ? l.from : l.from.name,
          toName: typeof l.to === 'string' ? l.to : l.to.name,
          fromLat: typeof l.from === 'string' ? 0 : l.from.lat,
          fromLng: typeof l.from === 'string' ? 0 : l.from.lng,
          toLat: typeof l.to === 'string' ? 0 : l.to.lat,
          toLng: typeof l.to === 'string' ? 0 : l.to.lng,
          mode: l.mode,
          distance: Math.round(l.distance * 10) / 10,
          duration: Math.round(l.duration),
          co2Emitted: Math.round(l.co2 * 100) / 100,
          cost: Math.round(l.cost),
          intermediateStops: l.intermediateStops || [],
          intermediateCoords: l.intermediateCoords || []
        }))
      };
    });

    const modes = await Promise.all(routePromises);

    // Identify recommended (balanced usually best)
    modes.forEach(m => {
      if (m.label === 'Best Balanced Route') m.isRecommended = true;
    });

    return NextResponse.json({
      source,
      destination,
      distance: Math.round(carRoute.totalDistance * 10) / 10,
      modes,
    });
  } catch (err) {
    console.error('[POST /api/trips/compare]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
