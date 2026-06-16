import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MODE_LABELS } from '@/lib/calculations';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const userId = Number(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: 'Demo User',
        email: `user${userId}@greenmile.app`,
      }
    });
    const recentTrips = await prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { legs: true }
    });

    // Best mode: we look at legs and find the most frequent main mode,
    // or just assume the first leg's mode / or just aggregate. Wait, the old code used 'selected_mode'.
    // Since we don't have 'selected_mode' string on Trip anymore, let's use the mode of the longest leg or just aggregate all leg modes.
    // Let's aggregate all leg modes to find the most used mode for this user.
    const allLegs = await prisma.tripLeg.findMany({
      where: { trip: { userId } }
    });

    const modeCounts: Record<string, number> = {};
    for (const leg of allLegs) {
      modeCounts[leg.mode] = (modeCounts[leg.mode] || 0) + 1;
    }

    let bestModeRaw = null;
    let maxCount = 0;
    for (const [mode, count] of Object.entries(modeCounts)) {
      if (count > maxCount && mode !== 'walk' && mode !== 'car') { // Ignore walk/car for best "green" mode if possible, but let's just take the max green mode
        bestModeRaw = mode;
        maxCount = count;
      }
    }
    // Fallback if only walk/car
    if (!bestModeRaw) {
      for (const [mode, count] of Object.entries(modeCounts)) {
        if (count > maxCount) {
          bestModeRaw = mode;
          maxCount = count;
        }
      }
    }

    const bestMode = bestModeRaw ? {
      mode: bestModeRaw,
      label: MODE_LABELS[bestModeRaw] ?? bestModeRaw,
      tripCount: maxCount
    } : null;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        totalPoints: user.totalPoints,
        totalCo2Saved: user.totalCo2Saved,
        streak: user.streak,
        createdAt: user.createdAt,
      },
      recentTrips: recentTrips.map((t) => {
        // Find main mode for display (longest non-walk leg, or longest leg)
        let mainMode = t.legs[0]?.mode || 'unknown';
        let maxDist = 0;
        for (const leg of t.legs) {
          if (leg.mode !== 'walk' && leg.distance > maxDist) {
            mainMode = leg.mode;
            maxDist = leg.distance;
          }
        }
        if (maxDist === 0 && t.legs.length > 0) {
          mainMode = t.legs[0].mode;
        }

        return {
          id: t.id,
          source: t.source,
          destination: t.destination,
          distance: t.totalDistance,
          selectedMode: mainMode, // For backward compatibility with UI
          co2Saved: t.co2Saved,
          pointsEarned: t.pointsEarned,
          createdAt: t.createdAt,
          legs: t.legs
        };
      }),
      bestMode,
    });
  } catch (err: unknown) {
    console.error('[GET /api/dashboard/:userId]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
