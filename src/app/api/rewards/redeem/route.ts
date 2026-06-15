import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, rewardId } = body;

    if (!userId || !rewardId) {
      return NextResponse.json({ error: 'Missing required fields: userId, rewardId' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    const existing = await prisma.redemption.findFirst({
      where: { userId, rewardId }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'You have already redeemed this reward' },
        { status: 400 }
      );
    }

    if (user.totalPoints < reward.pointsRequired) {
      return NextResponse.json(
        {
          success: false,
          message: `Not enough points. You need ${reward.pointsRequired} but have ${user.totalPoints}`,
        },
        { status: 400 }
      );
    }

    // Process redemption in a transaction
    await prisma.$transaction([
      prisma.redemption.create({
        data: { userId, rewardId }
      }),
      prisma.user.update({
        where: { id: userId },
        data: { totalPoints: { decrement: reward.pointsRequired } }
      })
    ]);

    const remainingPoints = user.totalPoints - reward.pointsRequired;

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed "${reward.title}"!`,
      remainingPoints,
    });
  } catch (err: unknown) {
    console.error('[POST /api/rewards/redeem]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
