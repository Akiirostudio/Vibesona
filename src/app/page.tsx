import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function Home() {
  return (
    <div className="relative max-w-6xl mx-auto px-6 py-16">
      <section className="text-center space-y-6">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-white">
          The Futuristic Hub for Music Intelligence & Creation
        </h1>
        <p className="text-white/80 max-w-2xl mx-auto">
          Analyze playlists for authenticity, craft tracks in a sleek studio, and submit to curated lists — all in one seamless, next-gen experience.
        </p>
        <div className="flex gap-3 justify-center">
          <a href="/playlist"><Button>Analyze a Playlist</Button></a>
          <a href="/studio"><Button variant="glass">Open Studio</Button></a>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-medium">Playlist Analyzer</h3>
          </CardHeader>
          <CardContent>
            <p className="text-white/80 text-sm">Bot heuristics, popularity trends, and activity freshness.</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-medium">Studio</h3>
          </CardHeader>
          <CardContent>
            <p className="text-white/80 text-sm">Waveform editing, trimming, and export with a modern UI.</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader>
            <h3 className="text-lg font-medium">Submissions</h3>
          </CardHeader>
          <CardContent>
            <p className="text-white/80 text-sm">Spend tokens to submit to quality-curated playlists.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
