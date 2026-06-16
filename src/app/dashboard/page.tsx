'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, Route, Leaf, Trophy, Flame, Navigation, Plus, Wallet, Users, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [nudge, setNudge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, nudgeRes] = await Promise.all([
          fetch('/api/dashboard/1'),
          fetch('/api/nudge/1')
        ]);
        const dashData = await dashRes.json();
        const nudgeData = await nudgeRes.json();
        
        setData(dashData);
        setNudge(nudgeData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Trips", value: data?.recentTrips?.length || 0, icon: <Route className="w-5 h-5 text-blue-500" />, color: "border-blue-500/20 bg-blue-500/5" },
    { label: "CO₂ Saved", value: `${data?.user?.totalCo2Saved?.toFixed(1) || 0} kg`, icon: <Leaf className="w-5 h-5 text-green-500" />, color: "border-green-500/20 bg-green-500/5" },
    { label: "Green Points", value: data?.user?.totalPoints || 0, icon: <Trophy className="w-5 h-5 text-yellow-500" />, color: "border-yellow-500/20 bg-yellow-500/5" },
    { label: "Streak", value: `${data?.user?.streak || 0} days`, icon: <Flame className="w-5 h-5 text-orange-500" />, color: "border-orange-500/20 bg-orange-500/5" },
    { label: "Best Mode", value: data?.bestMode?.label || 'N/A', icon: <Activity className="w-5 h-5 text-purple-500" />, color: "border-purple-500/20 bg-purple-500/5", capitalize: true },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Welcome back, {data?.userInfo?.name || 'Commuter'}! 👋</h1>
        <p className="text-muted-foreground">Here's your impact overview and recent activity.</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat, idx) => (
          <motion.div key={idx} variants={item as any} className={cn("rounded-3xl border p-5 transition-all hover:shadow-lg", stat.color, "backdrop-blur-md")}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-background rounded-full shadow-sm">{stat.icon}</div>
            </div>
            <div className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</div>
            <div className={cn("text-2xl font-bold", stat.capitalize && "capitalize")}>{stat.value}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Trips */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card/50 backdrop-blur-md border rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Navigation className="w-5 h-5 text-primary" /> Recent Trips</h2>
              <Link href="/analytics" className="text-sm text-primary hover:underline font-medium">View Analytics →</Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-muted-foreground text-sm">
                    <th className="pb-3 font-medium">Route</th>
                    <th className="pb-3 font-medium">Mode</th>
                    <th className="pb-3 font-medium text-right">CO₂ Saved</th>
                    <th className="pb-3 font-medium text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {data?.recentTrips?.length > 0 ? (
                    data.recentTrips.map((trip: any) => (
                      <tr key={trip.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-4 font-medium">{trip.source} <span className="text-muted-foreground mx-1">→</span> {trip.destination}</td>
                        <td className="py-4 capitalize">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                            {trip.selectedMode}
                          </span>
                        </td>
                        <td className="py-4 text-green-500 font-medium text-right">+{trip.co2Saved.toFixed(1)} kg</td>
                        <td className="py-4 text-yellow-500 font-medium text-right">+{trip.pointsEarned}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">No recent trips found. Time to start commuting!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          {/* Smart Nudge */}
          {nudge && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border border-green-500/20 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-3">
                <Award className="w-6 h-6" />
                <h2 className="text-lg font-bold">Smart Nudge</h2>
              </div>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">{nudge.nudgeMessage}</p>
              <Link href="/compare" className="w-full flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                <Plus className="w-4 h-4" /> Plan Next Trip
              </Link>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card/50 backdrop-blur-md border rounded-3xl p-6">
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <div className="space-y-3">
              <Link href="/wallet" className="flex items-center gap-3 p-3 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all group">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors"><Wallet className="w-4 h-4 text-primary" /></div>
                <div className="font-medium text-sm">Green Wallet</div>
              </Link>
              <Link href="/community" className="flex items-center gap-3 p-3 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all group">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors"><Users className="w-4 h-4 text-primary" /></div>
                <div className="font-medium text-sm">Community Leaderboard</div>
              </Link>
              <Link href="/analytics" className="flex items-center gap-3 p-3 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all group">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors"><Activity className="w-4 h-4 text-primary" /></div>
                <div className="font-medium text-sm">Detailed Analytics</div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
