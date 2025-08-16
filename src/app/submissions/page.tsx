"use client";
import { useState, useEffect } from "react";

export default function SubmissionsPage() {
  const [userSubmissions, setUserSubmissions] = useState([]);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Song Input & Playlist Search */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-6">
            <h2 className="text-xl font-semibold mb-4">Add Your Song</h2>
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

          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-6">
            <h2 className="text-xl font-semibold mb-4">Find Playlists</h2>
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

        {/* Right Column - Submission History */}
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-6">
            <h3 className="text-lg font-semibold mb-4">Your Submissions</h3>
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
                {userSubmissions.map((submission: any) => (
                  <div key={submission.id} className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">
                          {submission.trackUrl.split('/').pop() || 'Track'}
                        </h4>
                        <p className="text-sm text-white/60 truncate">
                          {submission.playlist.title}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs border ${
                        submission.status === 'ACCEPTED' ? 'text-green-400 bg-green-400/20 border-green-400/30' :
                        submission.status === 'REJECTED' ? 'text-red-400 bg-red-400/20 border-red-400/30' :
                        submission.status === 'REVIEWING' ? 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30' :
                        'text-blue-400 bg-blue-400/20 border-blue-400/30'
                      }`}>
                        {submission.status}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
                      <span>{submission.tokenCost} tokens</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Card */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-6">
            <h3 className="text-lg font-semibold mb-4">Submission Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {userSubmissions.length}
                </div>
                <div className="text-xs text-white/60">Total Submissions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {userSubmissions.filter((s: any) => s.status === 'ACCEPTED').length}
                </div>
                <div className="text-xs text-white/60">Accepted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {userSubmissions.filter((s: any) => s.status === 'REVIEWING').length}
                </div>
                <div className="text-xs text-white/60">In Review</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {userSubmissions.filter((s: any) => s.status === 'REJECTED').length}
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
