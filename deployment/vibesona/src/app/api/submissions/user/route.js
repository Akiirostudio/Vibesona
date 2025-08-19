import { NextResponse } from 'next/server';
import { prismaClient } from "@/lib/prisma";

export async function GET() {
  try {
    // In a real app, get user from session
    // For now, get the first user or create a demo user
    let user = await prismaClient.user.findFirst();
    if (!user) {
      user = await prismaClient.user.create({ data: { name: "Demo User" } });
    }

    const submissions = await prismaClient.submission.findMany({
      where: { userId: user.id },
      include: {
        playlist: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
