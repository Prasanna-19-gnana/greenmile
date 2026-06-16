'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Navigation, Car, Bus, Train, Bike, Footprints, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

const GreenMap = dynamic(() => import('@/components/GreenMap'), { ssr: false });

export interface RouteLeg {
  fromName: string;
  toName: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  mode: string;
  distance: number;
  duration: number;
  co2Emitted: number;
  cost: number;
  intermediateStops?: string[];
  intermediateCoords?: [number, number][];
}

export interface MultiStageRoute {
  id: string;
  label: string;
  legs: RouteLeg[];
  totalDistance: number;
  totalDuration: number;
  totalCo2: number;
  co2Saved: number;
  isRecommended?: boolean;
  geminiExplanation?: string;
}

const modeIcons: Record<string, React.ReactNode> = {
  car: <Car className="w-5 h-5" />,
  bus: <Bus className="w-5 h-5" />,
  metro: <Train className="w-5 h-5" />,
  train: <Train className="w-5 h-5" />,
  cycle: <Bike className="w-5 h-5" />,
  walk: <Footprints className="w-5 h-5" />,
};

function formatTime(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const source = searchParams.get('source') || '';
  const destination = searchParams.get('destination') || '';
  const distance = parseFloat(searchParams.get('distance') || '0');

  const [routes, setRoutes] = useState<MultiStageRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  useEffect(() => {
    if (!source || !destination) {
      setLoading(false);
      return;
    }
    
    const fetchRoutes = async () => {
      try {
        const res = await fetch('/api/trips/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source, destination, distance_km: distance }),
        });
        const data = await res.json();
        
        if (data.modes && Array.isArray(data.modes)) {
            const mappedRoutes: MultiStageRoute[] = data.modes.map((m: any) => ({
                id: m.mode, 
                label: m.label,
                legs: m.legs || [],
                totalDistance: m.distance,
                totalDuration: m.travel_time_min,
                totalCo2: m.co2_emitted,
                co2Saved: m.co2_saved,
                isRecommended: m.isRecommended,
                geminiExplanation: m.geminiExplanation,
            }));
            setRoutes(mappedRoutes);
            const recommended = mappedRoutes.find(r => r.isRecommended) || mappedRoutes[0];
            if (recommended) setExpandedRoute(recommended.id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoutes();
  }, [source, destination, distance]);

  const handleSelectRoute = async (route: MultiStageRoute) => {
    setSelecting(route.id);
    try {
      const primaryMode = route.legs.reduce((prev, current) => (prev.distance > current.distance) ? prev : current).mode;
      const res = await fetch('/api/trips/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1,
          source,
          destination,
          distance_km: route.totalDistance,
          selectedMode: route.id,
          legs: route.legs
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Server error saving trip:', errorData);
        throw new Error('Failed to save trip to database');
      }

      const data = await res.json();

      const params = new URLSearchParams({
        selectedMode: route.id,
        co2Saved: route.co2Saved.toString(),
        pointsEarned: (data.pointsEarned ?? Math.round(route.co2Saved * 10)).toString(),
        source,
        destination,
      });
      router.push(`/reward?${params.toString()}`);
    } catch {
      alert('Failed to select route. Please try again.');
    } finally {
      setSelecting(null);
    }
  };

  const recommendedRoute = routes.find(r => r.isRecommended) || routes[0];
  const activeRouteMap = routes.find(r => r.id === expandedRoute) || recommendedRoute;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        <p className="mt-4 text-muted-foreground font-medium animate-pulse">Running Dijkstra routing engine...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Route Options</h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Navigation className="w-4 h-4" />
          {source} <span className="mx-2 text-primary/50">→</span> {destination}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <motion.div initial="hidden" animate="show" className="space-y-4">
            {routes.map((route) => {
              const isExpanded = expandedRoute === route.id;
              
              return (
                <motion.div
                  key={route.id}
                  className={cn(
                    "relative rounded-3xl border bg-card/50 backdrop-blur-md transition-all overflow-hidden group",
                    route.isRecommended ? "border-green-500/50 shadow-green-500/10" : "border-border hover:border-primary/30"
                  )}
                >
                  {selecting === route.id && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 backdrop-blur-sm">
                      <div className="flex items-center gap-3 text-primary font-medium">
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        Confirming choice...
                      </div>
                    </div>
                  )}

                  {/* Header Area */}
                  <div 
                    className="p-5 cursor-pointer"
                    onClick={() => setExpandedRoute(isExpanded ? null : route.id)}
                  >
                    {route.isRecommended && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                        Recommended
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center mb-4">
                      <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          {route.label}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{formatTime(route.totalDuration)}</span>
                          <span>•</span>
                          <span>{route.totalDistance.toFixed(1)} km</span>
                          {route.co2Saved > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-medium flex items-center gap-1">
                                <Leaf className="w-3 h-3" /> Save {route.co2Saved.toFixed(1)}kg CO₂
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelectRoute(route); }}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
                        >
                          Select
                        </button>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>

                    {/* Progress Bar visual */}
                    <div className="relative flex w-full h-4 bg-secondary rounded-full overflow-hidden mt-2">
                      {route.legs.map((leg, idx) => {
                        const widthPct = (leg.distance / route.totalDistance) * 100;
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "h-full transition-all group-hover:brightness-110 border-r border-white/20 last:border-0",
                              leg.mode === 'car' ? 'bg-gray-400' : 
                              leg.mode === 'metro' ? 'bg-blue-500' :
                              leg.mode === 'train' ? 'bg-purple-500' :
                              leg.mode === 'bus' ? 'bg-orange-400' :
                              leg.mode === 'cycle' ? 'bg-green-500' :
                              'bg-teal-400'
                            )}
                            style={{ width: `${Math.max(widthPct, 5)}%` }}
                            title={`${leg.mode}: ${leg.distance.toFixed(1)}km`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded Content: Legs & Gemini */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/50 bg-secondary/10"
                      >
                        <div className="p-5 space-y-4">
                          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Itinerary</h4>
                          <div className="space-y-3">
                            {route.legs.map((leg, idx) => (
                              <div key={idx} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className="w-8 h-8 rounded-full bg-white border shadow-sm flex items-center justify-center text-gray-600 z-10">
                                    {modeIcons[leg.mode]}
                                  </div>
                                  {idx !== route.legs.length - 1 && (
                                    <div className="w-0.5 h-full bg-border my-1" />
                                  )}
                                </div>
                                <div className="pb-4 pt-1 flex-1">
                                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {leg.mode.charAt(0).toUpperCase() + leg.mode.slice(1)} <span className="font-normal text-gray-500">for {leg.distance.toFixed(1)} km</span>
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    From: {leg.fromName}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    To: {leg.toName}
                                  </p>
                                  <p className="text-sm text-gray-400 mt-1">
                                    {formatTime(leg.duration)} • CO₂: {leg.co2Emitted.toFixed(2)} kg
                                  </p>
                                  
                                  {leg.intermediateStops && leg.intermediateStops.length > 0 && (
                                    <details className="mt-3 text-sm text-gray-500 group">
                                      <summary className="cursor-pointer font-medium hover:text-gray-700 dark:hover:text-gray-300 list-none flex items-center gap-1">
                                        <ChevronDown className="w-4 h-4 transition-transform group-open:-rotate-180" />
                                        View stops ({leg.intermediateStops.length})
                                      </summary>
                                      <div className="mt-2 pl-5 border-l-2 border-gray-200 dark:border-gray-700/50 py-1 space-y-1">
                                        {leg.intermediateStops.map((stop, i) => (
                                          <p key={i} className="text-xs">{stop}</p>
                                        ))}
                                      </div>
                                    </details>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* AI Summary */}
                          {route.geminiExplanation && (
                            <div className="mt-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 flex gap-4 items-start">
                              <Bot className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                              <div>
                                <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-1">AI Route Summary</h4>
                                <p className="text-sm text-blue-900/80 dark:text-blue-200/70 leading-relaxed">
                                  {route.geminiExplanation}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="rounded-3xl border bg-card overflow-hidden h-[500px] sticky top-24"
          >
            {activeRouteMap && <GreenMap route={activeRouteMap} sourceName={source} destName={destination} />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
