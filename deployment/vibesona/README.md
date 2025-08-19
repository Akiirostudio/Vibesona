# Vibesona - AI-Powered Music Studio

A modern web application for analyzing playlists, crafting tracks, and submitting music to curated playlists. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Playlist Analyzer**: Analyze playlists for authenticity, bot detection, and popularity trends
- **Studio**: Waveform editing, trimming, and export with a modern UI
- **Submissions Dashboard**: Track your music submissions and discover new playlists
- **Token System**: Spend tokens to submit to quality-curated playlists
- **Spotify Integration**: Full integration with Spotify API for track information
- **Authentication**: Firebase-based authentication system

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite with Prisma ORM
- **Authentication**: Firebase Auth
- **API Integration**: Spotify Web API
- **Audio Processing**: Wavesurfer.js, FFmpeg

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Spotify Developer Account (for API access)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/akiirostudio/vibesona.git
   cd vibesona
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"
   
   # Spotify API (get these from Spotify Developer Dashboard)
   SPOTIFY_CLIENT_ID="your_spotify_client_id_here"
   SPOTIFY_CLIENT_SECRET="your_spotify_client_secret_here"
   
   # NextAuth (for authentication)
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your_nextauth_secret_here"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Spotify API Setup

To use the Spotify integration features:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Get your `CLIENT_ID` and `CLIENT_SECRET`
4. Add them to your `.env.local` file

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── spotify/       # Spotify API integration
│   │   ├── submissions/   # Submission management
│   │   └── ...
│   ├── login/             # Authentication pages
│   ├── submissions/       # Submissions dashboard
│   ├── studio/            # Audio studio
│   └── ...
├── components/            # Reusable components
├── lib/                   # Utility libraries
├── contexts/              # React contexts
└── types/                 # TypeScript type definitions
```

## Key Features

### Landing Page
- Hero section with large Vibesona logo
- "Submit Your Track" section with Spotify URL input
- Feature cards for Playlist Analyzer, Studio, and Submissions

### Submissions Dashboard
- Add songs via Spotify URLs
- Find playlists by genre
- Track submission status and statistics
- Token-based submission system

### Login System
- Firebase authentication
- Email/password login
- User session management

## Database Schema

The application uses Prisma with SQLite and includes models for:
- Users and authentication
- Playlists and submissions
- Wallets and token transactions
- Studio projects and audio assets

## Deployment

This application is designed to be deployed on Hostinger without requiring a VPS. The SQLite database and static assets can be served directly.

### Build for Production
```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.
