import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    console.log('Test API: Client ID length:', clientId ? clientId.length : 0);
    console.log('Test API: Client Secret length:', clientSecret ? clientSecret.length : 0);
    console.log('Test API: Client ID starts with:', clientId ? clientId.substring(0, 8) + '...' : 'null');
    console.log('Test API: Client Secret starts with:', clientSecret ? clientSecret.substring(0, 8) + '...' : 'null');
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: "Missing credentials",
        clientIdExists: !!clientId,
        clientSecretExists: !!clientSecret
      }, { status: 400 });
    }

    // Test the credentials directly
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: "Spotify authentication failed",
        spotifyError: data,
        status: response.status
      }, { status: 502 });
    }

    return NextResponse.json({ 
      success: true,
      accessToken: data.access_token ? 'Present' : 'Missing',
      expiresIn: data.expires_in
    });
    
  } catch (error) {
    console.error('Test API: Error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error.message 
    }, { status: 500 });
  }
}
