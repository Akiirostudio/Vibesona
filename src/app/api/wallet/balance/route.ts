import { NextResponse } from "next/server";
import { prismaClient } from "@/lib/prisma";

export async function GET() {
  let user = await prismaClient.user.findFirst();
  if (!user) user = await prismaClient.user.create({ data: { name: "Demo User" } });
  let wallet = await prismaClient.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) wallet = await prismaClient.wallet.create({ data: { userId: user.id, balance: 100 } });
  return NextResponse.json({ balance: wallet.balance });
}


