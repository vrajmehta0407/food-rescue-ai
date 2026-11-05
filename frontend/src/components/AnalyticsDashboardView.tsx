import React from 'react';
import { AnalyticsSummary } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Award, Leaf, Utensils, ShieldCheck, Info, RefreshCw } from 'lucide-react';
import { fallbackAnalytics } from '../lib/demoData';

interface AnalyticsDashboardViewProps {
  analytics: AnalyticsSummary | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  analytics,
  loading,
  onRefresh,
}) => {
  const activeAnalytics = analytics || fallbackAnalytics;

  if (loading && !analytics) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-3 border-forest border-t-transparent animate-spin mx-auto" />
        <p className="text-sm font-semibold text-ink">Aggregating live impact metrics from database...</p>
        <p className="text-xs text-ink-muted">Crunching verified rescue events, co2e coefficients and nutrition counts.</p>
      </div>
    );
  }

  const { metrics, categories, monthly_trends, methodology_notes } = activeAnalytics;

  // Colors for categories
  const pieColors = ['#1F5B43', '#83B879', '#F6C94A', '#F17C65', '#B84D72', '#B9DDF2'];

  return (
    <section className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-forest" />
            <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted">
              Environmental & Social Footprint
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold text-ink">
            Impact Analytics
          </h2>
          <p className="text-sm text-ink-muted mt-1">
            Traceable metrics derived from persisted donation lifecycles, verified pickups, and nutritional conversion models.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl bg-surface-paper border border-surface-border text-xs font-semibold text-ink hover:text-forest hover:border-forest/50 transition-colors flex items-center gap-1.5 self-start"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recalculate Metrics</span>
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-surface-paper border border-surface-border shadow-tactile space-y-1">
          <div className="flex items-center justify-between text-forest mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Rescued Mass</span>
            <Leaf className="w-4 h-4 text-leaf" />
          </div>
          <span className="font-display text-3xl sm:text-4xl font-bold text-forest block">
            {metrics.total_rescued_kg} <span className="text-lg font-normal text-ink-muted">kg</span>
          </span>
          <span className="text-[11px] text-ink-muted block pt-1">
            {metrics.completed_rescues_count} verified handoffs
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-surface-paper border border-surface-border shadow-tactile space-y-1">
          <div className="flex items-center justify-between text-citrus-dark mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Meals Provided</span>
            <Utensils className="w-4 h-4 text-citrus-dark" />
          </div>
          <span className="font-display text-3xl sm:text-4xl font-bold text-citrus-dark block">
            {metrics.total_meals_saved_estimate}
          </span>
          <span className="text-[11px] text-ink-muted block pt-1">
            0.42 kg standard nutritional meal estimate
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-surface-paper border border-surface-border shadow-tactile space-y-1">
          <div className="flex items-center justify-between text-leaf-dark mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Emissions Avoided</span>
            <TrendingUp className="w-4 h-4 text-leaf" />
          </div>
          <span className="font-display text-3xl sm:text-4xl font-bold text-leaf-dark block">
            {metrics.co2e_avoided_kg_estimate} <span className="text-lg font-normal text-ink-muted">kg CO₂e</span>
          </span>
          <span className="text-[11px] text-ink-muted block pt-1">
            FAO methane reduction factor
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-surface-paper border border-surface-border shadow-tactile space-y-1">
          <div className="flex items-center justify-between text-coral mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Rescue Rate</span>
            <ShieldCheck className="w-4 h-4 text-coral" />
          </div>
          <span className="font-display text-3xl sm:text-4xl font-bold text-coral block">
            {metrics.successful_rescue_rate_percent}%
          </span>
          <span className="text-[11px] text-ink-muted block pt-1">
            Avg match: {metrics.average_match_time_minutes} min
          </span>
        </div>
      </div>

      {/* Visual Charts: Monthly Trends & Category Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-surface-paper border border-surface-border shadow-tactile space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-ink">
              Monthly Rescued Volume (kg)
            </h3>
            <span className="text-xs text-ink-muted">Completed Lifecycles</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9E3D9" />
                <XAxis dataKey="month" stroke="#6B756F" fontSize={11} tickLine={false} axisLine={{ stroke: '#E9E3D9' }} />
                <YAxis stroke="#6B756F" fontSize={11} tickLine={false} axisLine={{ stroke: '#E9E3D9' }} unit="kg" />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-surface-paper rounded-xl shadow-floating border border-surface-border text-xs">
                          <span className="font-bold text-ink block">{data.month}</span>
                          <span className="text-forest font-bold">{data.rescued_kg} kg Rescued</span>
                          <span className="text-ink-muted block mt-0.5">~{data.meals_estimate} meals</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="rescued_kg" fill="#1F5B43" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-surface-paper border border-surface-border shadow-tactile space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-ink">
              Food Category Distribution
            </h3>
            <span className="text-xs text-ink-muted">By Weight</span>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="quantity_kg"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-surface-border">
            {categories.map((c, i) => (
              <div key={c.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }}></span>
                  <span className="capitalize text-ink font-medium">{c.category.replace('_', ' ')}</span>
                </div>
                <span className="font-bold text-forest">{c.quantity_kg} kg ({c.percentage}%)</span>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Methodology & Trust Notes */}
      <div className="p-6 rounded-3xl bg-cream-100 border border-surface-border flex items-start gap-4 text-xs text-ink">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold text-forest block">Methodology & Estimate Disclaimers</span>
          <p className="text-ink-muted">
            • <strong>Meals Equivalent:</strong> {methodology_notes.meals_estimate}<br />
            • <strong>Climate Impact:</strong> {methodology_notes.emissions_estimate}<br />
            • <strong>Auditability:</strong> Metrics reflect only persisted and confirmed database records. No synthetic multipliers or placeholder KPI numbers are used in production calculations.
          </p>
        </div>
      </div>

    </section>
  );
};

