import React, { useState, useEffect } from 'react';
import { DonationMatch, HandoffEvent } from '../types';
import { Truck, CheckCircle2, AlertTriangle, Clock, MapPin, Calendar, PackageCheck, Send, UserCheck, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';

interface PickupTimelineViewProps {
  matches: DonationMatch[];
  onRecordHandoffEvent: (matchId: string, eventType: string, notes?: string) => Promise<void>;
  onScheduleMatch?: (matchId: string) => Promise<void>;
  onAssignVolunteer?: (matchId: string) => Promise<void>;
  userRole?: string;
}

export const PickupTimelineView: React.FC<PickupTimelineViewProps> = ({
  matches,
  onRecordHandoffEvent,
  onScheduleMatch,
  onAssignVolunteer,
  userRole,
}) => {
  const [selectedMatch, setSelectedMatch] = useState<DonationMatch | null>(matches[0] || null);
  const [actionNotes, setActionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<HandoffEvent[]>([]);

  // Update selected match if matches change
  useEffect(() => {
    if (!selectedMatch && matches.length > 0) {
      setSelectedMatch(matches[0]);
    } else if (selectedMatch) {
      const updated = matches.find(m => m.id === selectedMatch.id);
      if (updated) setSelectedMatch(updated);
    }
  }, [matches]);

  // Load audit events for selected match
  useEffect(() => {
    if (selectedMatch) {
      api.pickups.getEvents(selectedMatch.id)
        .then(evs => setEvents(evs))
        .catch(() => setEvents([]));
    }
  }, [selectedMatch]);

  const steps = [
    { key: 'accepted', label: 'Offer Accepted & Reserved' },
    { key: 'scheduled', label: 'Pickup Window Agreed' },
    { key: 'arrival', label: 'Volunteer Arrived at Donor' },
    { key: 'collected', label: 'Food Inspected & Collected' },
    { key: 'delivered', label: 'Safe Delivery Confirmed' },
  ];

  const handleStepAction = async (eventType: string) => {
    if (!selectedMatch) return;
    setLoading(true);
    try {
      await onRecordHandoffEvent(selectedMatch.id, eventType, actionNotes);
      setActionNotes('');
      const updatedEvents = await api.pickups.getEvents(selectedMatch.id);
      setEvents(updatedEvents);
    } finally {
      setLoading(false);
    }
  };

  const isStepDone = (key: string) => {
    if (!selectedMatch) return false;
    if (selectedMatch.status === 'completed') return true;
    if (key === 'accepted') return true;
    if (key === 'scheduled') return ['scheduled', 'picked_up', 'delivered', 'completed'].includes(selectedMatch.status);
    return events.some(e => e.event_type === key);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      
      {/* View Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Truck className="w-4 h-4 text-forest" />
          <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted">
            Logistics & Redistribution Tracking
          </span>
        </div>
        <h2 className="font-display text-3xl font-bold text-ink">
          Pickup & Handoff Coordination
        </h2>
        <p className="text-sm text-ink-muted mt-1">
          Track end-to-end collection, transit, and delivery milestones with real-time audit timestamps.
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="p-12 rounded-3xl bg-surface-paper border border-surface-border text-center space-y-3">
          <Truck className="w-10 h-10 text-ink-muted mx-auto" />
          <h3 className="font-display text-lg font-bold text-ink">No Pickups Currently Scheduled</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            Once a surplus listing offer is claimed by a verified recipient organization, the pickup workflow will activate here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Matches List Column */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted block mb-2">
              Active Coordination Requests ({matches.length})
            </span>

            {matches.map(m => (
              <div
                key={m.id}
                onClick={() => setSelectedMatch(m)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedMatch?.id === m.id
                    ? 'border-forest bg-forest/5 shadow-sm'
                    : 'border-surface-border bg-surface-paper hover:bg-cream-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="font-display text-sm font-bold text-ink line-clamp-1">
                    {m.listing?.title || 'Surplus Food Offer'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-sky/30 text-forest shrink-0">
                    {m.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs text-ink-muted space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-ink">Recipient:</span>
                    <span>{m.recipient_organization_name || 'Community Organization'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-ink">Donor:</span>
                    <span>{m.donor_organization_name || 'Food Donor'}</span>
                  </div>
                  {m.assigned_volunteer_name ? (
                    <div className="flex items-center gap-1.5 text-forest font-medium">
                      <span>✓ Volunteer: {m.assigned_volunteer_name}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-coral font-medium block">
                      ⚠ Awaiting volunteer assignment
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline & Actions Column */}
          {selectedMatch && (
            <div className="lg:col-span-7 p-6 rounded-3xl bg-surface-paper border border-surface-border shadow-tactile space-y-6">
              
              <div className="flex items-start justify-between pb-4 border-b border-surface-border">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-ink-muted block">
                    Active Match Milestone
                  </span>
                  <h3 className="font-display text-xl font-bold text-ink mt-0.5">
                    {selectedMatch.listing?.title}
                  </h3>
                  <span className="text-xs text-forest font-semibold block mt-0.5">
                    Volume: {selectedMatch.listing?.quantity_value} {selectedMatch.listing?.quantity_unit} • {selectedMatch.listing?.storage_requirement}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-ink-muted block">Status</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-leaf/20 text-forest inline-block mt-1 uppercase">
                    {selectedMatch.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Action Banner for Accepted State: Schedule Pickup */}
              {selectedMatch.status === 'accepted' && (
                <div className="p-4 rounded-2xl bg-citrus/20 border border-citrus/40 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-ink block">Offer Accepted — Schedule Pickup Window</span>
                    <span className="text-[11px] text-ink-muted block">Agree on collection time to authorize volunteer transit.</span>
                  </div>
                  <button
                    disabled={loading}
                    onClick={() => onScheduleMatch && onScheduleMatch(selectedMatch.id)}
                    className="px-4 py-2 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest-dark transition-all shadow-sm shrink-0"
                  >
                    📅 Schedule for Today
                  </button>
                </div>
              )}

              {/* Action Banner for Unassigned Volunteer */}
              {!selectedMatch.assigned_volunteer_name && (
                <div className="p-4 rounded-2xl bg-sky/20 border border-sky/40 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-ink block">Logistics Volunteer Needed</span>
                    <span className="text-[11px] text-ink-muted block">Coordinate transit from donor kitchen to recipient organization.</span>
                  </div>
                  <button
                    disabled={loading}
                    onClick={() => onAssignVolunteer && onAssignVolunteer(selectedMatch.id)}
                    className="px-4 py-2 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest-dark transition-all shadow-sm shrink-0 flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Assign Myself</span>
                  </button>
                </div>
              )}

              {/* Progress Milestones Bar */}
              <div className="space-y-4">
                <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted block">
                  Redistribution Checkpoints
                </span>

                <div className="space-y-3">
                  {steps.map((st, idx) => {
                    const done = isStepDone(st.key);
                    return (
                      <div key={st.key} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          done ? 'bg-forest text-white shadow-sm' : 'bg-cream-200 text-ink-muted'
                        }`}>
                          {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-semibold block ${done ? 'text-ink' : 'text-ink-muted'}`}>
                            {st.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Operational Handoff Controls */}
              <div className="p-5 rounded-2xl bg-cream-100 border border-surface-border space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink block uppercase tracking-wider">
                    Record Real-Time Handoff Event
                  </span>
                  <span className="text-[11px] text-ink-muted">Step-by-step audit record</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    disabled={loading}
                    onClick={() => handleStepAction('arrival')}
                    className="px-3.5 py-2.5 rounded-xl bg-surface-paper border border-surface-border text-xs font-semibold hover:border-forest text-ink transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-citrus-dark" />
                    <span>1. Arrived at Donor</span>
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => handleStepAction('collected')}
                    className="px-3.5 py-2.5 rounded-xl bg-surface-paper border border-surface-border text-xs font-semibold hover:border-forest text-ink transition-colors flex items-center justify-center gap-1.5"
                  >
                    <PackageCheck className="w-3.5 h-3.5 text-leaf-dark" />
                    <span>2. Food Collected</span>
                  </button>

                  <button
                    disabled={loading}
                    onClick={() => handleStepAction('completed')}
                    className="px-3.5 py-2.5 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest-dark transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-citrus" />
                    <span>3. Delivery Complete</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Log verification notes (e.g. 45 portions confirmed at 3°C, clean cambro boxes)..."
                    value={actionNotes}
                    onChange={e => setActionNotes(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-surface-border bg-white text-xs focus:outline-none focus:ring-2 focus:ring-forest"
                  />
                  
                  <button
                    disabled={loading}
                    onClick={() => handleStepAction('exception')}
                    className="px-3 py-2 rounded-xl border border-coral text-coral hover:bg-coral/10 text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
                    title="Log an exception if food is damaged, missing, or mismatched"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Report Exception</span>
                  </button>
                </div>
              </div>

              {/* Audit Event Timeline Stream */}
              {events.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted block">
                    Verified Event Stream ({events.length})
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {events.map(ev => (
                      <div key={ev.id} className="p-3 rounded-xl bg-cream-50 border border-surface-border text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold uppercase text-forest block tracking-wider text-[10px]">
                            {ev.event_type}
                          </span>
                          <span className="text-ink-muted">{ev.notes || 'Recorded on platform'}</span>
                        </div>
                        <span className="text-[11px] text-ink-subtle">
                          {new Date(ev.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </section>
  );
};
