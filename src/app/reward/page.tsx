'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

const modeIcons: Record<string, string> = {
  car: '🚗',
  bus: '🚌',
  metro: '🚇',
  cycle: '🚲',
  walk: '🚶',
  train: '🚆',
  cab: '🚕',
};

const modeLabels: Record<string, string> = {
  car: 'Car',
  bus: 'Bus',
  metro: 'Metro',
  cycle: 'Cycle',
  walk: 'Walk',
  train: 'Train',
  cab: 'Cab',
};

function RewardContent() {
  const searchParams = useSearchParams();
  const selectedMode = searchParams.get('selectedMode') || 'bus';
  const co2Saved = parseFloat(searchParams.get('co2Saved') || '0');
  const pointsEarned = parseInt(searchParams.get('pointsEarned') || '0', 10);
  const costSaved = parseFloat(searchParams.get('costSaved') || '0');
  const source = searchParams.get('source') || '';
  const destination = searchParams.get('destination') || '';
  
  const savedRef = useRef(false);

  useEffect(() => {
    // Only run this logic on the client
    if (typeof window === 'undefined' || savedRef.current) return;
    
    // Prevent multiple executions in dev mode (React strict mode)
    savedRef.current = true;

    if (!source || !destination || pointsEarned <= 0) return;

    // Deterministic Trip ID to prevent refresh duplicates
    const tripId = `${source}_${destination}_${selectedMode}_${co2Saved}_${pointsEarned}`;
    
    try {
      const historyJson = localStorage.getItem('greenmile_trip_history');
      const tripHistory = historyJson ? JSON.parse(historyJson) : [];
      
      // Check if trip already exists
      const tripExists = tripHistory.some((trip: any) => trip.id === tripId);
      
      if (!tripExists) {
        // Add trip to history
        const newTrip = {
          id: tripId,
          source,
          destination,
          selectedMode,
          co2Saved,
          pointsEarned,
          timestamp: new Date().toISOString()
        };
        tripHistory.unshift(newTrip); // Add to top
        localStorage.setItem('greenmile_trip_history', JSON.stringify(tripHistory));
        
        // Update wallet points
        const currentPoints = parseInt(localStorage.getItem('greenmile_wallet_points') || '0', 10);
        localStorage.setItem('greenmile_wallet_points', (currentPoints + pointsEarned).toString());
        
        // Update lifetime points
        const lifetimePoints = parseInt(localStorage.getItem('greenmile_lifetime_points') || '0', 10);
        localStorage.setItem('greenmile_lifetime_points', (lifetimePoints + pointsEarned).toString());
        
        // Update total CO2 saved
        const currentCo2 = parseFloat(localStorage.getItem('greenmile_total_co2_saved') || '0');
        localStorage.setItem('greenmile_total_co2_saved', (currentCo2 + co2Saved).toString());
        
        console.log(`Successfully logged trip ${tripId}. Earned ${pointsEarned} points.`);
      }
    } catch (e) {
      console.error('Failed to save trip data to localStorage', e);
    }
  }, [source, destination, selectedMode, co2Saved, pointsEarned]);

  const formatLabel = (mode: string) => {
    if (mode.startsWith('route_')) {
      return mode.replace('route_', '').charAt(0).toUpperCase() + mode.replace('route_', '').slice(1) + ' Route';
    }
    return modeLabels[mode] || mode;
  };

  const stats = [
    {
      icon: modeIcons[selectedMode] || '🚀',
      label: 'Mode Chosen',
      value: formatLabel(selectedMode),
      color: 'bg-blue-50 text-blue-700',
    },
    {
      icon: '🌍',
      label: 'CO₂ Saved',
      value: `${co2Saved.toFixed(2)} kg`,
      color: 'bg-green-50 text-green-700',
    },
    {
      icon: '⭐',
      label: 'Points Earned',
      value: `+${pointsEarned}`,
      color: 'bg-yellow-50 text-yellow-700',
    },
  ];

  return (
    <div className="page-transition">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-bounce-gentle"
            style={{
              width: `${8 + Math.random() * 16}px`,
              height: `${8 + Math.random() * 16}px`,
              backgroundColor: ['#22c55e', '#86efac', '#4ade80', '#16a34a', '#dcfce7'][i % 5],
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-12 sm:py-16 text-center">
        <div className="animate-count-up">
          <span className="text-7xl sm:text-8xl inline-block">🎉</span>
        </div>

        <h1 className="mt-6 text-3xl sm:text-4xl font-bold text-gray-900 animate-fade-in">
          Congratulations!
        </h1>
        <p className="mt-2 text-lg text-green-600 font-medium animate-fade-in">
          You made a greener choice 🌿
        </p>

        {source && destination && (
          <p className="mt-2 text-gray-500 text-sm animate-fade-in">
            {source} → {destination}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`bg-white rounded-2xl shadow-md p-6 border border-gray-50 animate-slide-up`}
              style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 animate-count-up">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-green-50 rounded-2xl p-6 border border-green-100 animate-fade-in">
          <p className="text-green-800 font-medium">
            🌳 Your CO₂ savings are equivalent to{' '}
            <span className="font-bold">{(co2Saved / 21).toFixed(1)}</span> tree-days of carbon
            absorption!
          </p>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-green-600/25 hover:shadow-xl hover:-translate-y-0.5"
          >
            View Dashboard →
          </Link>
          <Link
            href="/compare"
            className="inline-flex items-center text-green-700 hover:text-green-800 font-medium py-3 px-6 rounded-xl border border-green-200 hover:bg-green-50 transition-all duration-200"
          >
            Take Another Trip →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RewardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      }
    >
      <RewardContent />
    </Suspense>
  );
}
