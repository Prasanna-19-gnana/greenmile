import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { EMISSION_FACTORS, COST_PER_KM, MODE_LABELS } from '@/lib/calculations';

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const userId = Number(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const trips = await prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { legs: true }
    });

    if (trips.length === 0) {
      return NextResponse.json({
        nudge: 'Start your green journey! Log your first trip and earn reward points. 🌱',
        suggestedMode: 'metro',
        savings: { co2: 0, cost: 0 },
      });
    }

    const modeCounts: Record<string, number> = {};
    const modesUsed = new Set<string>();
    for (const trip of trips) {
      let mainMode = trip.legs[0]?.mode || 'unknown';
      let maxDist = 0;
      for (const leg of trip.legs) {
        if (leg.mode !== 'walk' && leg.distance > maxDist) {
          mainMode = leg.mode;
          maxDist = leg.distance;
        }
      }
      if (maxDist === 0 && trip.legs.length > 0) {
        mainMode = trip.legs[0].mode;
      }
      
      modeCounts[mainMode] = (modeCounts[mainMode] || 0) + 1;
      modesUsed.add(mainMode);
    }

    const mostUsedMode = Object.entries(modeCounts).sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    const lastTrip = trips[0];

    if (mostUsedMode === 'car') {
      const avgDistance = trips.reduce((sum, t) => sum + t.totalDistance, 0) / trips.length;
      const co2Saving = Math.round(((avgDistance * (EMISSION_FACTORS.car - EMISSION_FACTORS.metro)) / 1000) * 100) / 100;
      const costSaving = Math.round(avgDistance * (COST_PER_KM.car - COST_PER_KM.metro));

      return NextResponse.json({
        nudge: `You've been taking the car a lot. Switching to ${MODE_LABELS.metro || 'Metro'} could save ~${co2Saving} kg CO₂ and ₹${costSaving} per trip! 🚇`,
        suggestedMode: 'metro',
        savings: { co2: co2Saving, cost: costSaving },
      });
    }

    if (lastTrip.totalDistance < 5) {
      const suggestedMode = lastTrip.totalDistance < 2 ? 'walk' : 'cycle';
      const co2Saving = Math.round(((lastTrip.totalDistance * EMISSION_FACTORS.car) / 1000) * 100) / 100;
      const costSaving = Math.round(lastTrip.totalDistance * COST_PER_KM.car);

      return NextResponse.json({
        nudge: `Your last trip was only ${lastTrip.totalDistance} km — perfect for ${MODE_LABELS[suggestedMode]?.toLowerCase() || suggestedMode}ing! Save ${co2Saving} kg CO₂ and ₹${costSaving}. 🚶‍♂️🚲`,
        suggestedMode,
        savings: { co2: co2Saving, cost: costSaving },
      });
    }

    if (!modesUsed.has('bus')) {
      const avgDistance = trips.reduce((sum, t) => sum + t.totalDistance, 0) / trips.length;
      const co2Saving = Math.round(((avgDistance * (EMISSION_FACTORS.car - EMISSION_FACTORS.bus)) / 1000) * 100) / 100;
      const costSaving = Math.round(avgDistance * (COST_PER_KM.car - COST_PER_KM.bus));

      return NextResponse.json({
        nudge: `Have you tried the bus? It's the most budget-friendly green option — save ~₹${costSaving} and ${co2Saving} kg CO₂ per trip! 🚌`,
        suggestedMode: 'bus',
        savings: { co2: co2Saving, cost: costSaving },
      });
    }

    // Since costSaved was calculated using carCost - totalCost in trip selection, we don't have it saved directly in Trip.
    // Calculate costSaved dynamically for the default rule.
    let totalCostSaved = 0;
    for (const t of trips) {
        const carCost = t.totalDistance * COST_PER_KM.car;
        const totalCost = t.legs.reduce((acc, leg) => acc + (leg.distance * COST_PER_KM[leg.mode] || 0), 0);
        totalCostSaved += (carCost - totalCost);
    }

    return NextResponse.json({
      nudge: `Amazing streak of ${user.streak} green trips, ${user.name}! Keep it going to unlock bigger rewards. 🌍🏆`,
      suggestedMode: mostUsedMode,
      savings: {
        co2: Math.round(trips.reduce((s, t) => s + t.co2Saved, 0) * 100) / 100,
        cost: Math.round(totalCostSaved),
      },
    });
  } catch (err: unknown) {
    console.error('[GET /api/nudge/:userId]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
