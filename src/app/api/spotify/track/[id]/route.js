import { NextResponse } from 'next/server';
import SpotifyWebApi from "spotify-web-api-node";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    console.log('Spotify API: Fetching track with ID:', id);
    
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    console.log('Spotify API: Client ID exists:', !!clientId);
    console.log('Spotify API: Client Secret exists:', !!clientSecret);
    
    if (!clientId || !clientSecret) {
      console.error('Spotify API: Missing credentials');
      return NextResponse.json(
        { error: "Missing Spotify credentials. Please provide SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET." },
        { status: 400 }
      );
    }

    const spotify = new SpotifyWebApi({ clientId, clientSecret });
    
    try {
      console.log('Spotify API: Requesting access token...');
      const tokenResp = await spotify.clientCredentialsGrant();
      spotify.setAccessToken(tokenResp.body.access_token);
      console.log('Spotify API: Access token obtained successfully');
    } catch (err) {
      console.error('Spotify API: Authentication error:', err);
      return NextResponse.json({ 
        error: "Unable to authenticate to Spotify",
        details: err.message 
      }, { status: 502 });
    }

    try {
      console.log('Spotify API: Fetching track data...');
      const trackResp = await spotify.getTrack(id);
      console.log('Spotify API: Track data fetched successfully');
      return NextResponse.json(trackResp.body);
    } catch (err) {
      console.error('Spotify API: Track fetch error:', err);
      return NextResponse.json({ 
        error: "Failed to fetch track information from Spotify",
        details: err.message 
      }, { status: 502 });
    }
  } catch (error) {
    console.error('Spotify API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch track information', details: error.message },
      { status: 500 }
    );
  }
}
