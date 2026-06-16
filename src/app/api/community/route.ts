import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const community = await prisma.communityStat.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Global Community',
        totalUsers: 1,
        totalCo2Saved: 0,
        totalGreenTrips: 0
      }
    });

    const treeEquivalent = Math.round((community.totalCo2Saved / 20) * 100) / 100;

    const topUsers = await prisma.user.findMany({
      orderBy: { totalCo2Saved: 'desc' },
      take: 5,
      select: { name: true, totalCo2Saved: true }
    });

    // Mock other users if we don't have enough
    const allUsers = [...topUsers.map(u => ({ name: u.name, co2Saved: u.totalCo2Saved }))];
    const mocks = [
      { name: 'Vishal', co2Saved: 52 },
      { name: 'Rahul', co2Saved: 38 },
      { name: 'Aditi', co2Saved: 25 },
      { name: 'Karan', co2Saved: 15 }
    ];

    for (const mock of mocks) {
      if (!allUsers.some(u => u.name === mock.name)) {
        allUsers.push(mock);
      }
    }

    allUsers.sort((a, b) => b.co2Saved - a.co2Saved);
    const rankedLeaderboard = allUsers.slice(0, 5).map((entry, idx) => ({
      rank: idx + 1,
      ...entry
    }));

    return NextResponse.json({
      community: {
        name: community.name,
        totalUsers: community.totalUsers,
        totalCo2Saved: community.totalCo2Saved,
        totalGreenTrips: community.totalGreenTrips,
      },
      treeEquivalent,
      leaderboard: rankedLeaderboard,
    });
  } catch (err: unknown) {
    console.error('[GET /api/community]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
