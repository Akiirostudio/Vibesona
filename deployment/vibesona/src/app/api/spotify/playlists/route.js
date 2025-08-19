import { NextResponse } from 'next/server';
import SpotifyWebApi from "spotify-web-api-node";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre') || 'pop';
    const limit = parseInt(searchParams.get('limit')) || 20;

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Missing Spotify credentials" },
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
      // Search for playlists by genre
      const searchResp = await spotify.searchPlaylists(`${genre} music`, {
        limit: limit,
        market: 'US'
      });

      const playlists = searchResp.body.playlists.items.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        followers: playlist.followers?.total || 0,
        genre: genre,
        coverImage: playlist.images?.[0]?.url,
        owner: playlist.owner.display_name,
        public: playlist.public,
        trackCount: playlist.tracks?.total || 0,
        tokenCost: Math.max(5, Math.floor((playlist.followers?.total || 1000) / 10000)) // Dynamic pricing based on followers
      }));

      return NextResponse.json({ playlists });
    } catch (err) {
      return NextResponse.json({ error: "Failed to fetch playlists from Spotify" }, { status: 502 });
    }
  } catch (error) {
    console.error('Spotify playlists API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}
