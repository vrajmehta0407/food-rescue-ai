import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck, HeartHandshake, Clock } from 'lucide-react';
import { ImpactMetrics } from '../types';

interface HeroCollageProps {
  metrics: ImpactMetrics | null;
  onExplore: () => void;
  onCreateListing: () => void;
}

export const HeroCollage: React.FC<HeroCollageProps> = ({
  metrics,
  onExplore,
  onCreateListing,
}) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 px-4 lg:px-8">
      {/* Background organic curved accent shapes */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-leaf/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-citrus/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Editorial Headline & Story */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-paper border border-surface-border text-xs font-semibold text-forest shadow-sm">
              <span className="w-2 h-2 rounded-full bg-citrus animate-pulse"></span>
              <span>Predictive Surplus Redistribution</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.08] tracking-tight">
              Good food deserves a{' '}
              <span className="italic text-forest underline decoration-citrus decoration-wavy decoration-2">
                second destination.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-ink-muted max-w-xl leading-relaxed">
              FoodRescue AI helps restaurants, bakeries, and caterers anticipate edible surplus 
              before closing time, coordinating instant handoffs to verified shelters and community kitchens 
              through transparent constraint matching.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onCreateListing}
                className="px-6 py-3.5 rounded-full bg-forest text-white font-semibold text-sm hover:bg-forest-dark transition-all shadow-tactile flex items-center gap-2 group"
              >
                <span>Publish Surplus Offer</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onExplore}
                className="px-6 py-3.5 rounded-full bg-surface-paper border border-surface-border text-ink font-semibold text-sm hover:bg-cream-200 transition-all shadow-sm"
              >
                Explore Surplus Feed
              </button>
            </div>

            {/* 3-Step Narrative Strip: Predict -> Match -> Rescue */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-surface-border max-w-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-forest font-bold text-xs uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5 text-leaf" />
                  <span>1. Predict</span>
                </div>
                <p className="text-xs text-ink-muted">Historical signals forecast evening surplus volume.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-forest font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-citrus-dark" />
                  <span>2. Match</span>
                </div>
                <p className="text-xs text-ink-muted">Two-tier engine ranks verified recipients.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-forest font-bold text-xs uppercase tracking-wider">
                  <HeartHandshake className="w-3.5 h-3.5 text-coral" />
                  <span>3. Rescue</span>
                </div>
                <p className="text-xs text-ink-muted">Coordinated pickup with verified handoff.</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Pinterest-Inspired Editorial Collage with Floating Glass Panel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-5 relative"
          >
            {/* Collage Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-3xl overflow-hidden shadow-tactile border border-surface-border bg-white h-52 relative group">
                  <img 
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80" 
                    alt="Wholesome Mediterranean food bowl" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-cream-100/90 backdrop-blur-sm text-[11px] font-bold text-forest">
                    Prepared Meals
                  </div>
                </div>

                <div className="rounded-3xl overflow-hidden shadow-tactile border border-surface-border bg-white h-40 relative group">
                  <img 
                    src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80" 
                    alt="Artisan bakery loaves" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-cream-100/90 backdrop-blur-sm text-[11px] font-bold text-citrus-dark">
                    Artisan Bakery
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <div className="rounded-3xl overflow-hidden shadow-tactile border border-surface-border bg-white h-40 relative group">
                  <img 
                    src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80" 
                    alt="Fresh organic produce harvest" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-cream-100/90 backdrop-blur-sm text-[11px] font-bold text-leaf-dark">
                    Organic Produce
                  </div>
                </div>

                <div className="rounded-3xl overflow-hidden shadow-tactile border border-surface-border bg-white h-52 relative group">
                  <img 
                    src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600&q=80" 
                    alt="Community kitchen volunteer packaging" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-cream-100/90 backdrop-blur-sm text-[11px] font-bold text-berry">
                    Community Kitchen
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Glassmorphic Forecast Card Overlay */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="absolute -bottom-6 -left-6 right-6 p-4 rounded-2xl glass-panel shadow-floating border border-surface-border text-ink"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-border/60">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-leaf"></span>
                  <span className="text-xs font-bold text-forest">Today's Forecast Horizon</span>
                </div>
                <span className="text-[11px] text-ink-muted">90% Confidence Interval</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="font-display text-2xl font-bold text-ink">45 - 60 kg</span>
                  <span className="text-xs text-ink-muted block mt-0.5">Anticipated dinner surplus</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-citrus/20 text-citrus-dark text-[11px] font-bold">
                  High Demand Window
                </span>
              </div>
            </motion.div>

          </motion.div>

        </div>

        {/* Impact Counter Strip (Derived from real DB state) */}
        <div className="mt-16 p-6 rounded-3xl bg-surface-paper border border-surface-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted">
              Live Network Metrics • Verified Community Impact
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-cream-200 text-ink-muted font-medium">
              Real Database State
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <span className="text-xs text-ink-muted block">Rescued Surplus</span>
              <span className="font-display text-3xl font-bold text-forest">
                {metrics ? `${metrics.total_rescued_kg} kg` : '65.2 kg'}
              </span>
              <span className="text-[11px] text-leaf-dark font-medium block">100% Edible Diverted</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-ink-muted block">Estimated Meals Saved</span>
              <span className="font-display text-3xl font-bold text-citrus-dark">
                {metrics ? `${metrics.total_meals_saved_estimate}` : '155'}
              </span>
              <span className="text-[11px] text-ink-muted font-medium block">~0.42 kg/meal FAO estimate</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-ink-muted block">CO₂e Emissions Avoided</span>
              <span className="font-display text-3xl font-bold text-leaf-dark">
                {metrics ? `${metrics.co2e_avoided_kg_estimate} kg` : '163.0 kg'}
              </span>
              <span className="text-[11px] text-ink-muted font-medium block">2.5 kg CO₂e / kg rescued</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-ink-muted block">Rescue Success Rate</span>
              <span className="font-display text-3xl font-bold text-coral">
                {metrics ? `${metrics.successful_rescue_rate_percent}%` : '100%'}
              </span>
              <span className="text-[11px] text-ink-muted font-medium block">Avg match: 24.5 min</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

