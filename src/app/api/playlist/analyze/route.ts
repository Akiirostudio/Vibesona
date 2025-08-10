import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import SpotifyWebApi from "spotify-web-api-node";
import { prismaClient } from "@/lib/prisma";

const bodySchema = z.object({
  playlistId: z.string().min(1), // Spotify playlist ID
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { playlistId } = parsed.data;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing Spotify credentials. Please provide SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET." },
      { status: 400 }
    );
  }

  const spotify = new SpotifyWebApi({ clientId, clientSecret });
  try {
    const tokenResp = await spotify.clientCredentialsGrant();
    spotify.setAccessToken(tokenResp.body.access_token);
  } catch (err) {
    return NextResponse.json({ error: "Unable to authenticate to Spotify" }, { status: 502 });
  }

  try {
    const playlistResp = await spotify.getPlaylist(playlistId);
    const tracks = playlistResp.body.tracks?.items ?? [];

    const trackCount = tracks.length;
    const popularities = tracks
      .map((t: any) => t.track?.popularity ?? 0)
      .filter((p: number) => typeof p === "number");
    const averagePopularity = popularities.length
      ? Math.round(popularities.reduce((a: number, b: number) => a + b, 0) / popularities.length)
      : 0;

    const now = Date.now();
    const addedWithin30Days = tracks.filter((t: any) => {
      const addedAt = t.added_at ? new Date(t.added_at).getTime() : 0;
      return now - addedAt <= 30 * 24 * 60 * 60 * 1000;
    }).length;

    // Heuristic bot score (low popularity + few recent adds)
    const botScore = Math.max(0, 100 - averagePopularity - Math.min(addedWithin30Days * 5, 50));

    const result = {
      trackCount,
      averagePopularity,
      addedWithin30Days,
      suspectedBotsScore: botScore,
    };

    // persist minimal report without linking to a stored Playlist row
    await prismaClient.playlistAnalysis.create({
      data: {
        playlist: {
          connectOrCreate: {
            where: { spotifyPlaylistId: playlistId },
            create: { title: playlistResp.body.name || "Untitled", spotifyPlaylistId: playlistId },
          },
        },
        trackCount,
        averagePopularity,
        addedWithin30Days,
        suspectedBotsScore: botScore,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch playlist info from Spotify" }, { status: 502 });
  }
}


