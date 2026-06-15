'use client';

import { useEffect, useState } from 'react';

export default function Community() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommunity() {
      try {
        const res = await fetch('/api/community');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCommunity();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const { communityStats, treeEquivalent, leaderboard } = data || {};

  return (
    <div className="page-transition max-w-6xl mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{communityStats?.name || 'Community'} 🌍</h1>
        <p className="text-gray-600">Together, we are making a difference!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-2xl shadow-md p-6 text-center">
          <div className="text-gray-600 mb-2">👥 Total Users</div>
          <div className="text-3xl font-bold text-gray-900">{communityStats?.total_users || 0}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 text-center border-b-4 border-green-500">
          <div className="text-gray-600 mb-2">🌿 CO₂ Saved (kg)</div>
          <div className="text-3xl font-bold text-green-600">{communityStats?.total_co2_saved?.toFixed(2) || 0}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 text-center">
          <div className="text-gray-600 mb-2">🚀 Green Trips</div>
          <div className="text-3xl font-bold text-gray-900">{communityStats?.total_green_trips || 0}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 text-center border-b-4 border-green-500">
          <div className="text-gray-600 mb-2">🌳 Trees Equivalent</div>
          <div className="text-3xl font-bold text-green-600">{Math.floor(treeEquivalent || 0)}</div>
        </div>
      </div>

      {/* Visual Tree Counter */}
      <div className="bg-green-50 rounded-2xl p-8 mb-12 text-center">
        <h2 className="text-2xl font-bold text-green-900 mb-4">Our Forest</h2>
        <p className="text-green-700 mb-4">We've saved enough CO₂ to plant {Math.floor(treeEquivalent || 0)} trees!</p>
        <div className="text-4xl flex flex-wrap justify-center gap-2">
          {Array.from({ length: Math.min(Math.floor(treeEquivalent || 0), 50) }).map((_, i) => (
            <span key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>🌳</span>
          ))}
          {(treeEquivalent || 0) > 50 && <span>... and many more!</span>}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Green Champions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-600 bg-gray-50">
                <th className="py-3 px-4 rounded-tl-xl font-medium">Rank</th>
                <th className="py-3 px-4 font-medium">Name</th>
                <th className="py-3 px-4 rounded-tr-xl font-medium">CO₂ Saved (kg)</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard?.map((user: any, index: number) => (
                <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-4 px-4 font-bold text-lg">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-900">{user.name}</td>
                  <td className="py-4 px-4 font-bold text-green-600">{user.co2_saved?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
