import React from 'react';
import { SurplusListing } from '../types';
import { Clock, MapPin, ShieldCheck, Thermometer, Sparkles, AlertTriangle } from 'lucide-react';

interface SurplusCardProps {
  listing: SurplusListing;
  onSelect: (listing: SurplusListing) => void;
  userRole?: string;
  onClaim?: (listing: SurplusListing) => void;
  onTrackPickup?: (listingId: string) => void;
}

export const SurplusCard: React.FC<SurplusCardProps> = ({
  listing,
  onSelect,
  userRole,
  onClaim,
  onTrackPickup,
}) => {
  // Category image mapping
  const categoryImages: Record<string, string> = {
    prepared_meals: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    produce: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
    dairy: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=600&q=80',
    packaged: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
  };

  const imageSrc = categoryImages[listing.food_category] || categoryImages.prepared_meals;

  // Deadline calculation
  const deadline = new Date(listing.pickup_deadline_at);
  const now = new Date();
  const diffHours = Math.max(0, Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));

  // Storage badge colors
  const storageBadges: Record<string, { label: string; class: string }> = {
    ambient: { label: 'Ambient / Dry', class: 'bg-cream-200 text-ink-muted' },
    refrigerated: { label: 'Refrigerated 4°C', class: 'bg-sky/30 text-forest-dark' },
    frozen: { label: 'Frozen -18°C', class: 'bg-sky text-forest-dark' },
    hot_holding: { label: 'Hot Holding 60°C+', class: 'bg-citrus/30 text-citrus-dark' },
  };
  const storageInfo = storageBadges[listing.storage_requirement] || storageBadges.ambient;

  // Status badge
  const statusStyles: Record<string, string> = {
    available: 'bg-leaf/20 text-leaf-dark border-leaf/40',
    reserved: 'bg-citrus/20 text-citrus-dark border-citrus/40',
    pickup_scheduled: 'bg-sky/30 text-forest border-sky/50',
    completed: 'bg-forest/10 text-forest border-forest/30',
    expired: 'bg-ink-subtle/20 text-ink-muted border-surface-border',
  };

  return (
    <div className="rounded-3xl bg-surface-paper border border-surface-border overflow-hidden shadow-tactile hover:-translate-y-1 hover:shadow-floating transition-all flex flex-col group">
      
      {/* Editorial Food Image */}
      <div className="relative h-48 overflow-hidden bg-cream-200">
        <img 
          src={imageSrc} 
          alt={listing.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-cream-100/90 backdrop-blur-sm text-xs font-bold text-forest capitalize shadow-sm">
          {listing.food_category.replace('_', ' ')}
        </div>

        {/* Urgency Chip */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm ${
          diffHours <= 2 ? 'bg-coral text-white' : 'bg-cream-100/90 backdrop-blur-sm text-ink-muted'
        }`}>
          <Clock className="w-3 h-3" />
          <span>{diffHours > 0 ? `${diffHours}h left` : 'Expired'}</span>
        </div>

        {/* Status Chip */}
        <div className="absolute bottom-3 left-3">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border backdrop-blur-sm ${statusStyles[listing.status] || statusStyles.available}`}>
            {listing.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <h3 className="font-display text-lg font-bold text-ink leading-snug line-clamp-1 group-hover:text-forest transition-colors">
              {listing.title}
            </h3>
          </div>

          <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed mb-3">
            {listing.description || 'Verified edible surplus packaged safely for timely community redistribution.'}
          </p>

          {/* Key Attributes */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-surface-border/60">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-ink-muted block font-semibold">Quantity</span>
              <span className="font-display font-bold text-sm text-forest">
                {listing.quantity_value} {listing.quantity_unit}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-ink-muted block font-semibold">Storage Requirement</span>
              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold mt-0.5 ${storageInfo.class}`}>
                {storageInfo.label}
              </span>
            </div>
          </div>

          {/* Allergens & Dietary */}
          {(listing.allergens.length > 0 || listing.dietary_tags.length > 0) && (
            <div className="flex flex-wrap gap-1 mt-3">
              {listing.dietary_tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-leaf/15 text-forest text-[10px] font-semibold">
                  🌱 {tag}
                </span>
              ))}
              {listing.allergens.map(al => (
                <span key={al} className="px-2 py-0.5 rounded-full bg-coral/10 text-coral text-[10px] font-semibold">
                  Contains {al}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {['reserved', 'pickup_scheduled', 'picked_up', 'delivered'].includes(listing.status) ? (
            <button
              onClick={() => onTrackPickup ? onTrackPickup(listing.id) : onSelect(listing)}
              className="w-full py-2.5 rounded-xl bg-sky/30 text-forest text-xs font-semibold hover:bg-forest hover:text-white transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>🚚 Track Pickup & Handoff</span>
            </button>
          ) : listing.status === 'completed' ? (
            <button
              disabled
              className="w-full py-2.5 rounded-xl bg-cream-200 text-ink-muted text-xs font-semibold cursor-default flex items-center justify-center gap-1.5"
            >
              <span>✓ Redistribution Completed</span>
            </button>
          ) : userRole === 'recipient' && listing.status === 'available' ? (
            <button
              onClick={() => onClaim ? onClaim(listing) : onSelect(listing)}
              className="w-full py-2.5 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest-dark transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-citrus" />
              <span>Claim for Organization</span>
            </button>
          ) : (
            <button
              onClick={() => onSelect(listing)}
              className="w-full py-2.5 rounded-xl bg-cream-200 text-forest text-xs font-semibold hover:bg-forest hover:text-white transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-citrus-dark" />
              <span>Inspect Match Recommendations</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};

