import React, { useState } from 'react';
import { SurplusListing, MatchRecommendation } from '../types';
import { Sparkles, MapPin, CheckCircle, ShieldCheck, Clock, ArrowRight, HeartHandshake, Check } from 'lucide-react';

interface RecipientMatchesViewProps {
  listing: SurplusListing | null;
  recommendations: MatchRecommendation[];
  loading?: boolean;
  onAcceptMatch: (listingId: string, recipientOrgId?: string) => Promise<void>;
  onClose: () => void;
}

export const RecipientMatchesView: React.FC<RecipientMatchesViewProps> = ({
  listing,
  recommendations,
  loading,
  onAcceptMatch,
  onClose,
}) => {
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  if (!listing) return null;

  const handleClaim = async (recipientOrgId: string) => {
    setAcceptingId(recipientOrgId);
    setClaimError(null);
    try {
      await onAcceptMatch(listing.id, recipientOrgId);
      setAcceptedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setClaimError(err.message || 'Failed to claim match offer.');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-paper w-full max-w-3xl rounded-3xl shadow-floating border border-surface-border overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-surface-border bg-cream-50 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-forest/10 text-forest text-[11px] font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-citrus-dark" />
              <span>Two-Tier Explainable Match Recommendations</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-ink">
              Ranked Recipient Organizations
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Target Surplus: <span className="font-semibold text-ink">{listing.title}</span> ({listing.quantity_value} {listing.quantity_unit})
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cream-200 text-ink-muted hover:text-ink flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {acceptedSuccess && (
            <div className="p-4 rounded-2xl bg-leaf/20 border border-leaf/40 text-forest text-sm font-semibold flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-forest" />
              <span>Surplus successfully claimed! Pickup window is now ready to be scheduled.</span>
            </div>
          )}

          {claimError && (
            <div className="p-3.5 rounded-2xl bg-coral/15 border border-coral/30 text-coral text-xs font-semibold flex items-center gap-2">
              <span>⚠️ {claimError}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-forest border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-ink-muted">Evaluating hard constraints and soft ranking factors...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <HeartHandshake className="w-10 h-10 text-ink-muted mx-auto" />
              <h3 className="font-display text-base font-bold text-ink">No Verified Recipients Found</h3>
              <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
                No verified recipient organization currently matches the storage or capacity constraints for this surplus item.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted block">
                {recommendations.length} Qualified Recipient Organizations Evaluated
              </span>

              {recommendations.map((rec, idx) => (
                <div 
                  key={rec.id}
                  className="p-5 rounded-2xl border border-surface-border bg-cream-50/50 hover:bg-cream-100 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-forest text-white text-xs font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <h4 className="font-display text-base font-bold text-ink">
                        {rec.recipient_organization_name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-leaf/20 text-forest-dark text-[10px] font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-leaf" />
                        Verified
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <MapPin className="w-3.5 h-3.5 text-coral shrink-0" />
                      <span>{rec.recipient_organization_address}</span>
                    </div>

                    {/* Rationale Tag Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rec.reason_codes.map(reason => (
                        <span 
                          key={reason.code}
                          className="px-2.5 py-0.5 rounded-md bg-surface-paper border border-surface-border text-[11px] font-medium text-ink"
                        >
                          ✓ {reason.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Score & Claim Action */}
                  <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-surface-border">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-ink-muted block font-semibold">
                        Match Score
                      </span>
                      <span className="font-display text-2xl font-bold text-forest">
                        {rec.score} <span className="text-xs font-normal text-ink-muted">/ 100</span>
                      </span>
                    </div>

                    <button
                      disabled={acceptingId === rec.recipient_organization_id || listing.status !== 'available'}
                      onClick={() => handleClaim(rec.recipient_organization_id)}
                      className="px-4 py-2 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest-dark transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{acceptingId === rec.recipient_organization_id ? 'Confirming...' : 'Claim Surplus'}</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border bg-cream-50 flex items-center justify-between text-xs text-ink-muted">
          <span>Ranking engine: Hybrid Multi-Factor Constraint Ranker v1.2</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-surface-border bg-surface-paper text-ink font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

