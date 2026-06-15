'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const features = [
  {
    icon: '🔄',
    title: 'Compare Modes',
    description: 'See CO₂ emissions, cost, and time for every transport option side by side.',
  },
  {
    icon: '🌱',
    title: 'Track CO₂ Savings',
    description: 'Monitor your environmental impact with detailed carbon tracking over time.',
  },
  {
    icon: '🏆',
    title: 'Earn Rewards',
    description: 'Collect green points for every sustainable commute and redeem real rewards.',
  },
  {
    icon: '👥',
    title: 'Community Impact',
    description: 'Join your community leaderboard and amplify your collective green impact.',
  },
];

export default function HomePage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 via-green-50/50 to-white">
        {/* Decorative background circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-100/30 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 text-center">
          <div
            className={`transition-all duration-1000 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <span className="text-6xl sm:text-7xl inline-block animate-bounce-gentle">🌿</span>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              Green<span className="text-green-600">Mile</span>
            </h1>

            <p className="mt-4 text-lg sm:text-xl text-green-700 font-medium max-w-2xl mx-auto text-balance">
              Turn Every Commute into a Carbon Reward
            </p>

            <p className="mt-4 text-gray-600 max-w-xl mx-auto text-balance leading-relaxed">
              Compare transport modes by CO₂ impact, choose greener options, earn rewards, and track
              your collective environmental footprint — one trip at a time.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/compare"
                className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-green-600/25 hover:shadow-xl hover:shadow-green-600/30 hover:-translate-y-0.5 animate-pulse-green"
              >
                Start Comparing →
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center text-green-700 hover:text-green-800 font-medium py-3 px-6 rounded-xl border border-green-200 hover:bg-green-50 transition-all duration-200"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="mt-2 text-gray-600">Four simple steps to a greener commute</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`bg-white rounded-2xl shadow-md hover:shadow-lg p-6 text-center transition-all duration-300 hover:-translate-y-1 border border-gray-50 ${
                visible ? 'animate-slide-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats preview section */}
      <section className="bg-green-50/50 border-y border-green-100">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Making an Impact Together</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '150+', label: 'Green Commuters' },
              { value: '2.4T', label: 'CO₂ Saved' },
              { value: '500+', label: 'Green Trips' },
              { value: '45', label: 'Trees Equivalent' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl shadow-sm p-6 border border-green-100">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 animate-count-up">
                  {stat.value}
                </div>
                <div className="text-gray-600 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-10 sm:p-14 text-white shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to Go Green?</h2>
          <p className="text-green-100 mb-6 max-w-md mx-auto">
            Start tracking your commute impact and earn rewards for every green choice you make.
          </p>
          <Link
            href="/compare"
            className="inline-flex items-center bg-white text-green-700 font-semibold py-3 px-8 rounded-xl hover:bg-green-50 transition-all duration-200 shadow-lg hover:-translate-y-0.5"
          >
            Get Started Free →
          </Link>
        </div>
      </section>
    </div>
  );
}
