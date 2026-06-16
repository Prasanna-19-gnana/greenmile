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

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: 'Demo User',
        email: `user${userId}@greenmile.app`,
      }
    });

    // Reference base values
    const carDist = distance;
    const carCo2 = (carDist * 120) / 1000;
    const carCost = carDist * 12;

    let totalDistance = 0;
    let totalDuration = 0;
    let totalCo2 = 0;
    let totalCost = 0;

    const legsData = legs.map((leg: any) => {
      totalDistance += leg.distance || 0;
      totalDuration += leg.duration || 0;
      totalCo2 += leg.co2Emitted || 0;
      totalCost += leg.cost || 0;
      return {
        mode: leg.mode,
        distance: leg.distance || 0,
        duration: leg.duration || 0,
        co2Emitted: leg.co2Emitted || 0
      };
    });

    const co2Saved = Math.max(0, Math.round((carCo2 - totalCo2) * 100) / 100);
    const pointsEarned = calculateReward(co2Saved);
    const isGreen = selectedMode !== 'car_direct' && selectedMode !== 'route_time' && co2Saved > 0;
    const costSaved = Math.round(carCost - totalCost);

    const lastTrip = await prisma.trip.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    let newStreak = user.streak;
    let newLongestStreak = user.longestStreak || 0;

    if (lastTrip) {
      const lastDate = new Date(lastTrip.createdAt);
      lastDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1; // missed a day
      }
    } else {
      newStreak = 1; // first trip ever
    }
    
    newLongestStreak = Math.max(newLongestStreak, newStreak);

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
        streak: newStreak,
        longestStreak: newLongestStreak
      }
    });

    if (isGreen) {
      await prisma.communityStat.upsert({
        where: { id: 1 },
        update: {
          totalGreenTrips: { increment: 1 },
          totalCo2Saved: { increment: co2Saved }
        },
        create: {
          id: 1,
          name: 'Global Community',
          totalUsers: 1,
          totalCo2Saved: co2Saved,
          totalGreenTrips: 1
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
