'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const demoRoutes = [
  { source: 'SRM Kattankulathur', destination: 'Guindy', distance: 40 },
  { source: 'Tambaram', destination: 'Chennai Central', distance: 30 },
  { source: 'Velachery', destination: 'T Nagar', distance: 12 },
  { source: 'Anna Nagar', destination: 'Marina Beach', distance: 14 },
];

export default function ComparePage() {
  const router = useRouter();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleRouteSelect = (index: number) => {
    const route = demoRoutes[index];
    setSource(route.source);
    setDestination(route.destination);
    setSelectedRoute(index);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim() || !destination.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    const params = new URLSearchParams({ source, destination });
    router.push(`/compare/results?${params.toString()}`);
  };

  return (
    <div className="page-transition">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Plan Your Green Commute 🚀
          </h1>
          <p className="mt-2 text-gray-600">
            Select a popular route or enter your own trip details
          </p>
        </div>

        {/* Quick-select Demo Routes */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📍 Popular Routes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {demoRoutes.map((route, index) => (
              <button
                key={index}
                onClick={() => handleRouteSelect(index)}
                className={`text-left bg-white rounded-2xl shadow-md hover:shadow-lg p-5 transition-all duration-300 hover:-translate-y-1 border-2 ${
                  selectedRoute === index
                    ? 'border-green-500 bg-green-50/50'
                    : 'border-transparent hover:border-green-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium text-gray-900">{route.source}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  <span className="text-sm font-medium text-gray-900">{route.destination}</span>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1 inline-block">
                  📏 {route.distance} km
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input Form */}
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 border border-gray-50">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">✏️ Trip Details</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                  Source
                </label>
                <input
                  id="source"
                  type="text"
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value);
                    setSelectedRoute(null);
                  }}
                  placeholder="e.g., SRM Kattankulathur"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all duration-200 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="destination"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Destination
                </label>
                <input
                  id="destination"
                  type="text"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setSelectedRoute(null);
                  }}
                  placeholder="e.g., Guindy"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all duration-200 text-sm"
                />
              </div>



              {error && (
                <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-green-600/25 hover:shadow-xl hover:-translate-y-0.5"
              >
                Compare Modes →
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
