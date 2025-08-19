import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@vibesona.local" },
    update: {},
    create: { email: "demo@vibesona.local", name: "Demo User" },
  });

  // Create wallet with tokens
  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: { balance: 100 },
    create: { userId: user.id, balance: 100 },
  });

  // Create sample playlists
  const playlist1 = await prisma.playlist.upsert({
    where: { spotifyPlaylistId: "37i9dQZF1DXcBWIGoYBM5M" },
    update: { title: "Today's Top Hits" },
    create: {
      title: "Today's Top Hits",
      description: "Sample playlist for testing",
      spotifyPlaylistId: "37i9dQZF1DXcBWIGoYBM5M",
    },
  });

  const playlist2 = await prisma.playlist.upsert({
    where: { spotifyPlaylistId: "37i9dQZF1DX5Vy6DFOcx00" },
    update: { title: "Indie Vibes" },
    create: {
      title: "Indie Vibes",
      description: "Fresh indie tracks with unique soundscapes",
      spotifyPlaylistId: "37i9dQZF1DX5Vy6DFOcx00",
    },
  });

  const playlist3 = await prisma.playlist.upsert({
    where: { spotifyPlaylistId: "37i9dQZF1DX8NTLI2TtZa6" },
    update: { title: "Electronic Dreams" },
    create: {
      title: "Electronic Dreams",
      description: "Atmospheric electronic and ambient music",
      spotifyPlaylistId: "37i9dQZF1DX8NTLI2TtZa6",
    },
  });

  // Create the submission that matches the image
  await prisma.submission.upsert({
    where: { 
      id: "demo-submission-1" 
    },
    update: {},
    create: {
      id: "demo-submission-1",
      userId: user.id,
      playlistId: playlist1.id,
      trackUrl: "37UVYeSiOgazUpVTfAtUUf?si=...",
      status: "PENDING",
      tokenCost: 10,
      createdAt: new Date("2025-08-10"),
    },
  });

  console.log("Database seeded successfully!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});


