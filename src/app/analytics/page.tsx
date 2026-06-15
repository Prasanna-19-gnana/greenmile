'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Leaf, Award, BarChart3, Activity } from 'lucide-react';

const weeklyData = [
  { name: 'Mon', saved: 1.2 },
  { name: 'Tue', saved: 2.1 },
  { name: 'Wed', saved: 0.8 },
  { name: 'Thu', saved: 3.4 },
  { name: 'Fri', saved: 2.0 },
  { name: 'Sat', saved: 0.5 },
  { name: 'Sun', saved: 1.0 },
];

const modeDistribution = [
  { name: 'Metro', value: 45, color: '#22c55e' },
  { name: 'Bus', value: 25, color: '#3b82f6' },
  { name: 'Cycle', value: 15, color: '#10b981' },
  { name: 'Walk', value: 10, color: '#14b8a6' },
  { name: 'Carpool', value: 5, color: '#8b5cf6' },
];

const carbonTrend = [
  { month: 'Jan', co2: 12 },
  { month: 'Feb', co2: 18 },
  { month: 'Mar', co2: 25 },
  { month: 'Apr', co2: 32 },
  { month: 'May', co2: 45 },
  { month: 'Jun', co2: 60 },
];

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Activity className="w-8 h-8 text-green-600" />
              Impact Analytics
            </h1>
            <p className="text-gray-500 mt-1">Detailed breakdown of your sustainability journey.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border shadow-sm flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-700">Live Data Sync</span>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} 
            className="bg-white p-6 rounded-2xl border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                <Leaf className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12% this week</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">Total CO₂ Prevented</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">192.4 kg</h3>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} 
            className="bg-white p-6 rounded-2xl border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Top 5% of users</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">Current Streak</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">14 Days</h3>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} 
            className="bg-white p-6 rounded-2xl border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Total Rewards Earned</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">1,450 pts</h3>
          </motion.div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Weekly Carbon Reduction (Bar Chart) */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} 
            className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col h-[400px]">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Weekly Carbon Reduction</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="saved" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Transport Mode Distribution (Pie Chart) */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} 
            className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col h-[400px]">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Transport Mode Distribution</h3>
            <div className="flex-1 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {modeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {modeDistribution.map((mode) => (
                <div key={mode.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mode.color }} />
                  <span className="text-sm font-medium text-gray-600">{mode.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Carbon Saved Trend (Area Chart) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} 
            className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col h-[400px] lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Carbon Saved Trend (YTD)</h3>
              <select className="bg-gray-50 border-gray-200 text-sm rounded-lg px-3 py-1.5 text-gray-600 font-medium outline-none">
                <option>2024</option>
                <option>2023</option>
              </select>
            </div>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={carbonTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="co2" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorCo2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          
        </div>
      </div>
    </div>
  );
}
