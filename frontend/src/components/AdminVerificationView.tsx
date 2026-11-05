import React, { useState } from 'react';
import { Organization } from '../types';
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, FileText, Clock, Building } from 'lucide-react';

interface AdminVerificationViewProps {
  pendingOrgs: Organization[];
  onVerifyOrg: (orgId: string, status: string, reason?: string) => Promise<void>;
  auditLogs?: any[];
}

export const AdminVerificationView: React.FC<AdminVerificationViewProps> = ({
  pendingOrgs,
  onVerifyOrg,
  auditLogs = [],
}) => {
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(pendingOrgs[0] || null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAction = async (status: string) => {
    if (!selectedOrg) return;
    setLoading(true);
    setSuccessMsg(null);
    try {
      await onVerifyOrg(selectedOrg.id, status, reason);
      setSuccessMsg(`Organization '${selectedOrg.name}' has been ${status}.`);
      setReason('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-berry" />
          <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted">
            Platform Administration & Integrity
          </span>
        </div>
        <h2 className="font-display text-3xl font-bold text-ink">
          Organization Verification Queue
        </h2>
        <p className="text-sm text-ink-muted mt-1">
          Review credentials, capacity metrics, and compliance documents before authorizing recipient distribution rights.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-leaf/20 border border-leaf/40 text-forest text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Queue List */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted block mb-2">
            Pending Applications ({pendingOrgs.length})
          </span>

          {pendingOrgs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface-paper border border-surface-border text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-leaf mx-auto" />
              <p className="text-xs font-semibold text-ink">All Organizations Verified</p>
              <p className="text-[11px] text-ink-muted">The review queue is currently empty.</p>
            </div>
          ) : (
            pendingOrgs.map(org => (
              <div
                key={org.id}
                onClick={() => setSelectedOrg(org)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedOrg?.id === org.id
                    ? 'border-berry bg-berry/5 shadow-sm'
                    : 'border-surface-border bg-surface-paper hover:bg-cream-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-display text-sm font-bold text-ink">{org.name}</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-citrus/20 text-citrus-dark">
                    {org.verification_status}
                  </span>
                </div>
                <div className="text-xs text-ink-muted space-y-0.5">
                  <p>Type: <span className="capitalize text-ink">{org.type.replace('_', ' ')}</span></p>
                  <p>Capacity: <span className="font-semibold text-forest">{org.capacity_value} {org.capacity_unit}</span></p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        {selectedOrg && (
          <div className="lg:col-span-7 p-6 rounded-3xl bg-surface-paper border border-surface-border shadow-tactile space-y-6">
            
            <div className="flex items-start justify-between pb-4 border-b border-surface-border">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-ink-muted block">
                  Application Review
                </span>
                <h3 className="font-display text-xl font-bold text-ink mt-0.5">
                  {selectedOrg.name}
                </h3>
                <span className="text-xs text-ink-muted block mt-0.5">
                  {selectedOrg.address}
                </span>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-citrus/20 text-citrus-dark">
                Pending Verification
              </span>
            </div>

            {/* Verification Checklist */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                Verification Criteria Checklist
              </span>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-cream-50 border border-surface-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-leaf" />
                    <span>Non-Profit Entity or Community Registration</span>
                  </div>
                  <span className="font-semibold text-leaf-dark">Document Attached</span>
                </div>

                <div className="p-3 rounded-xl bg-cream-50 border border-surface-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-leaf" />
                    <span>Certified Safe Cold & Dry Storage Capacity</span>
                  </div>
                  <span className="font-semibold text-leaf-dark">{selectedOrg.capacity_value} {selectedOrg.capacity_unit}</span>
                </div>

                <div className="p-3 rounded-xl bg-cream-50 border border-surface-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-leaf" />
                    <span>Designated Service Radius Area</span>
                  </div>
                  <span className="font-semibold text-leaf-dark">{selectedOrg.service_radius_km || 15} km zone</span>
                </div>
              </div>
            </div>

            {/* Decision Controls */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                Administrator Audit Rationale
              </label>
              <input
                type="text"
                placeholder="Document verification check details and audit notes..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-surface-border text-xs focus:outline-none focus:ring-2 focus:ring-berry"
              />

              <div className="flex items-center gap-3 pt-2">
                <button
                  disabled={loading}
                  onClick={() => handleAction('verified')}
                  className="px-5 py-2.5 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest-dark transition-all shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-leaf-light" />
                  <span>Verify & Grant Access</span>
                </button>

                <button
                  disabled={loading}
                  onClick={() => handleAction('rejected')}
                  className="px-4 py-2.5 rounded-xl border border-coral text-coral hover:bg-coral/10 text-xs font-semibold transition-all"
                >
                  Reject Application
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

    </section>
  );
};

