import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateReward } from '@/lib/calculations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, source, destination, distance_km, selectedMode, legs } = body;

    const distance = Number(distance_km);

    if (!userId || !source || !destination || isNaN(distance) || !selectedMode || !legs) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Reference base values
    const carDist = distance;
    const carCo2 = (carDist * 120) / 1000;
    const carCost = carDist * 12;

    let totalDistance = 0;
    let totalDuration = 0;
    let totalCo2 = 0;
    let totalCost = 0;

    const legsData = legs.map((leg: any) => {
      totalDistance += leg.distance;
      totalDuration += leg.duration;
      totalCo2 += leg.co2Emitted;
      totalCost += leg.cost;
      return {
        mode: leg.mode,
        distance: leg.distance,
        duration: leg.duration,
        co2Emitted: leg.co2Emitted
      };
    });

    const co2Saved = Math.max(0, Math.round((carCo2 - totalCo2) * 100) / 100);
    const pointsEarned = calculateReward(co2Saved);
    const isGreen = selectedMode !== 'car_direct' && selectedMode !== 'route_time' && co2Saved > 0;
    const costSaved = Math.round(carCost - totalCost);

    const trip = await prisma.trip.create({
      data: {
        userId,
        source,
        destination,
        totalDistance,
        totalDuration,
        totalCo2,
        co2Saved,
        pointsEarned,
        isGreen,
        legs: {
          create: legsData
        }
      },
      include: { legs: true }
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: pointsEarned },
        totalCo2Saved: { increment: co2Saved },
        streak: { increment: 1 }
      }
    });

    if (isGreen) {
      await prisma.communityStat.update({
        where: { id: 1 },
        data: {
          totalGreenTrips: { increment: 1 },
          totalCo2Saved: { increment: co2Saved }
        }
      });
    }

    return NextResponse.json({
      success: true,
      trip,
      user: updatedUser,
      co2Saved,
      pointsEarned,
      costSaved
    });

  } catch (err: unknown) {
    console.error('[POST /api/trips/select]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
