import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  spotifyPlaylistId: z.string().min(1),
});

export async function GET() {
  const playlists = await prismaClient.playlist.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ playlists });
}

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const playlist = await prismaClient.playlist.create({ data: parsed.data });
  return NextResponse.json({ playlist });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prismaClient.playlist.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


