import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userIdRaw = request.nextUrl.searchParams.get('userId');
    const userId = userIdRaw ? Number(userIdRaw) : null;

    const rewards = await prisma.reward.findMany({
      orderBy: { pointsRequired: 'asc' }
    });

    let redeemedIds = new Set<number>();
    if (userId) {
      const redemptions = await prisma.redemption.findMany({
        where: { userId },
        select: { rewardId: true }
      });
      redeemedIds = new Set(redemptions.map(r => r.rewardId));
    }

    const result = rewards.map((r) => ({
      id: r.id,
      title: r.title,
      pointsRequired: r.pointsRequired,
      description: r.description,
      redeemed: redeemedIds.has(r.id),
    }));

    return NextResponse.json({ rewards: result });
  } catch (err: unknown) {
    console.error('[GET /api/rewards]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
