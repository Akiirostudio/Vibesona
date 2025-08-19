"use client";
import { useState, useEffect } from "react";

interface Submission {
  id: string;
  trackUrl: string;
  status: string;
  tokenCost: number;
  createdAt: string;
  playlist: {
    title: string;
  };
}

export default function SubmissionsPage() {
  const [userSubmissions, setUserSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserSubmissions();
  }, []);

  const loadUserSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions/user');
      if (response.ok) {
        const data = await response.json();
        setUserSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from actual data
  const totalSubmissions = userSubmissions.length;
  const acceptedSubmissions = userSubmissions.filter(s => s.status === 'ACCEPTED').length;
  const reviewingSubmissions = userSubmissions.filter(s => s.status === 'REVIEWING').length;
  const rejectedSubmissions = userSubmissions.filter(s => s.status === 'REJECTED').length;
  const pendingSubmissions = userSubmissions.filter(s => s.status === 'PENDING').length;

  return (
    <div className="relative max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Submissions Dashboard
        </h1>
        <p className="text-white/80 text-lg">
          Track your music submissions and discover new playlists
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Add Your Song Card */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Add Your Song</h2>
            <div className="flex gap-3">
              <input
                type="url"
                placeholder="Paste your Spotify song URL here..."
                className="flex-1 bg-white/5 border border-white/20 text-white placeholder:text-white/40 rounded-md px-3 py-2"
              />
              <button className="inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#06B6D4] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:opacity-95 focus-visible:ring-[#7C3AED] px-6 py-2">
                Load Track
              </button>
            </div>
          </div>

          {/* Find Playlists Card */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Find Playlists</h2>
            <div className="flex items-center gap-3 mb-4">
              <select className="bg-white/5 border border-white/20 text-white rounded-md px-3 py-2 text-sm">
                <option value="pop">Pop</option>
                <option value="hip-hop">Hip Hop</option>
                <option value="rock">Rock</option>
                <option value="electronic">Electronic</option>
                <option value="indie">Indie</option>
              </select>
              <button className="inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none backdrop-blur bg-white/10 dark:bg-white/5 text-white border border-white/15 hover:bg-white/15 px-4 py-2">
                Search
              </button>
            </div>
            <p className="text-white/60 text-sm">Search for playlists by genre to submit your music</p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Your Submissions Card */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Your Submissions</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                <p className="text-white/60 mt-2">Loading submissions...</p>
              </div>
            ) : userSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎵</span>
                </div>
                <p className="text-white/60">No submissions yet</p>
                <p className="text-white/40 text-sm mt-1">Submit your first track to get started</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {userSubmissions.map((submission) => (
                  <div key={submission.id} className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">
                          {submission.trackUrl}
                        </h4>
                        <p className="text-sm text-white/60 truncate">
                          {submission.playlist.title}
                        </p>
                        <p className="text-xs text-white/40">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-2 py-1 rounded-full text-xs border ${
                          submission.status === 'ACCEPTED' ? 'text-green-400 bg-green-400/20 border-green-400/30' :
                          submission.status === 'REJECTED' ? 'text-red-400 bg-red-400/20 border-red-400/30' :
                          submission.status === 'REVIEWING' ? 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30' :
                          'text-blue-400 bg-blue-400/20 border-blue-400/30'
                        }`}>
                          {submission.status}
                        </div>
                        <span className="text-xs text-white/40">{submission.tokenCost} tokens</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submission Stats Card */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Submission Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {totalSubmissions}
                </div>
                <div className="text-xs text-white/60">Total Submissions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {acceptedSubmissions}
                </div>
                <div className="text-xs text-white/60">Accepted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {reviewingSubmissions}
                </div>
                <div className="text-xs text-white/60">In Review</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {rejectedSubmissions}
                </div>
                <div className="text-xs text-white/60">Rejected</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
