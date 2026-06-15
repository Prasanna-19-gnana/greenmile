import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function seed() {
  // Check if DB is empty (specifically user)
  const count = await prisma.user.count();
  if (count === 0) {
    const user = await prisma.user.create({
      data: {
        id: 1,
        name: 'Prasanna',
        email: 'demo@greenmile.app',
        totalPoints: 62,
        totalCo2Saved: 6.24,
        streak: 3,
        longestStreak: 5,
        trips: {
          create: [
            {
              source: 'SRM Kattankulathur',
              destination: 'Guindy',
              totalDistance: 40,
              totalDuration: 50,
              totalCo2: 1.2,
              co2Saved: 3.6,
              pointsEarned: 36,
              isGreen: true,
              legs: {
                create: [
                  { mode: 'Metro', distance: 40, duration: 50, co2Emitted: 1.2 }
                ]
              }
            },
            {
              source: 'Tambaram',
              destination: 'Chennai Central',
              totalDistance: 30,
              totalDuration: 60,
              totalCo2: 2.4,
              co2Saved: 1.2,
              pointsEarned: 12,
              isGreen: true,
              legs: {
                create: [
                  { mode: 'Bus', distance: 30, duration: 60, co2Emitted: 2.4 }
                ]
              }
            },
            {
              source: 'Velachery',
              destination: 'T Nagar',
              totalDistance: 12,
              totalDuration: 45,
              totalCo2: 0,
              co2Saved: 1.44,
              pointsEarned: 14,
              isGreen: true,
              legs: {
                create: [
                  { mode: 'Cycle', distance: 12, duration: 45, co2Emitted: 0 }
                ]
              }
            }
          ]
        }
      }
    });

    await prisma.reward.createMany({
      data: [
        { id: 1, title: '₹20 Metro Recharge', pointsRequired: 100, description: 'Get ₹20 off on your next metro recharge' },
        { id: 2, title: 'Eco Cafe Discount', pointsRequired: 200, description: '15% off at partnered eco-friendly cafes' },
        { id: 3, title: 'Plant-a-Tree Contribution', pointsRequired: 300, description: 'We plant a tree on your behalf' },
        { id: 4, title: 'Green Champion Badge', pointsRequired: 500, description: 'Exclusive badge for sustainability champions' }
      ]
    });

    await prisma.communityStat.create({
      data: {
        id: 1,
        name: 'SRM Green Community',
        totalUsers: 156,
        totalCo2Saved: 800,
        totalGreenTrips: 1240
      }
    });
  }
}
