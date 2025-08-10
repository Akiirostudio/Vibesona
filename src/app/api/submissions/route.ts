import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaClient } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const bodySchema = z.object({
  playlistId: z.string().min(1),
  trackUrl: z.string().url(),
});

export async function GET() {
  const playlists = await prismaClient.playlist.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ playlists });
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // In real app use auth session; here use or create a demo user and wallet
  let user = await prismaClient.user.findFirst();
  if (!user) {
    user = await prismaClient.user.create({ data: { name: "Demo User" } });
  }
  let wallet = await prismaClient.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) {
    wallet = await prismaClient.wallet.create({ data: { userId: user.id, balance: 100 } });
  }

  const cost = 10;
  if (wallet.balance < cost) {
    return NextResponse.json({ error: "Insufficient tokens" }, { status: 402 });
  }

  const submission = await prismaClient.$transaction(async (tx: Prisma.TransactionClient) => {
    const updated = await tx.wallet.update({
      where: { id: wallet!.id },
      data: { balance: { decrement: cost }, transactions: { create: { amount: -cost, reason: "Submission" } } },
    });
    const s = await tx.submission.create({
      data: {
        userId: user!.id,
        playlistId: parsed.data.playlistId,
        trackUrl: parsed.data.trackUrl,
        tokenCost: cost,
      },
    });
    return s;
  });

  return NextResponse.json({ submission });
}


