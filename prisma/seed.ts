import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@vibesona.local" },
    update: {},
    create: { email: "demo@vibesona.local", name: "Demo User" },
  });

  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: { balance: 100 },
    create: { userId: user.id, balance: 100 },
  });

  await prisma.playlist.upsert({
    where: { spotifyPlaylistId: "37i9dQZF1DXcBWIGoYBM5M" },
    update: { title: "Today’s Top Hits" },
    create: {
      title: "Today’s Top Hits",
      description: "Sample playlist for testing",
      spotifyPlaylistId: "37i9dQZF1DXcBWIGoYBM5M",
    },
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});


