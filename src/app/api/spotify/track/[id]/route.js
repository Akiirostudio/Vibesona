import { NextResponse } from 'next/server';
import SpotifyWebApi from "spotify-web-api-node";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
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
      const trackResp = await spotify.getTrack(id);
      return NextResponse.json(trackResp.body);
    } catch (err) {
      return NextResponse.json({ error: "Failed to fetch track information from Spotify" }, { status: 502 });
    }
  } catch (error) {
    console.error('Spotify API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch track information' },
      { status: 500 }
    );
  }
}
