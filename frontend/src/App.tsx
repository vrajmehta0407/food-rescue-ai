import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroCollage } from './components/HeroCollage';
import { SurplusCard } from './components/SurplusCard';
import { ForecastChart } from './components/ForecastChart';
import { ListingWizardModal } from './components/ListingWizardModal';
import { RecipientMatchesView } from './components/RecipientMatchesView';
import { PickupTimelineView } from './components/PickupTimelineView';
import { AnalyticsDashboardView } from './components/AnalyticsDashboardView';
import { AdminVerificationView } from './components/AdminVerificationView';
import { api } from './lib/api';
import { 
  User, 
  SurplusListing, 
  DonationMatch, 
  MatchRecommendation, 
  ForecastResponse, 
  AnalyticsSummary, 
  NotificationItem,
  Organization
} from './types';
import { 
  fallbackListings, 
  fallbackAnalytics, 
  fallbackForecast, 
  fallbackPendingOrgs 
} from './lib/demoData';
import { Plus, Filter, Sparkles, AlertCircle, HeartHandshake, CheckCircle } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<'explore' | 'donor-dashboard' | 'recipient-matches' | 'pickups' | 'analytics' | 'admin'>('explore');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Domain State with rich initial fallbacks so UI is never stuck on empty or loading
  const [listings, setListings] = useState<SurplusListing[]>(fallbackListings);
  const [matches, setMatches] = useState<DonationMatch[]>([]);
  const [forecast, setForecast] = useState<ForecastResponse | null>(fallbackForecast);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(fallbackAnalytics);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pendingOrgs, setPendingOrgs] = useState<Organization[]>(fallbackPendingOrgs);

  // Modals & Active Selections
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedListingForMatch, setSelectedListingForMatch] = useState<SurplusListing | null>(null);
  const [matchRecommendations, setMatchRecommendations] = useState<MatchRecommendation[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Category Filter in Explore view
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Demo accounts mapping for seamless login
  const demoAccounts = {
    donor: { 
      email: 'donor@bistro.demo', 
      password: 'password123',
      fallbackUser: {
        id: 'u-donor-demo',
        email: 'donor@bistro.demo',
        full_name: 'Elena Rostova',
        role: 'donor',
        organization_id: 'org-bistro',
        is_active: true,
        created_at: new Date().toISOString(),
        organization: {
          id: 'org-bistro',
          name: 'Green Garden Bistro',
          type: 'restaurant',
          address: '450 Hayes Street, Hayes Valley',
          verification_status: 'verified',
          capacity_value: 80,
          capacity_unit: 'kg',
          handling_capabilities: { refrigerated: true, ambient: true },
        }
      } as User
    },
    recipient: { 
      email: 'director@hopekitchen.demo', 
      password: 'password123',
      fallbackUser: {
        id: 'u-recipient-demo',
        email: 'director@hopekitchen.demo',
        full_name: 'Marcus Vance',
        role: 'recipient',
        organization_id: 'org-hope',
        is_active: true,
        organization: {
          id: 'org-hope',
          name: 'Hope Community Kitchen',
          type: 'soup_kitchen',
          address: '784 Mission Street, SoMa',
          verification_status: 'verified',
          capacity_value: 250,
          capacity_unit: 'portions',
          handling_capabilities: { refrigerated: true, hot_holding: true, ambient: true },
        }
      } as User
    },
    volunteer: { 
      email: 'volunteer@rescue.demo', 
      password: 'password123',
      fallbackUser: {
        id: 'u-volunteer-demo',
        email: 'volunteer@rescue.demo',
        full_name: 'Alex Taylor',
        role: 'volunteer',
        organization_id: undefined,
        is_active: true,
        created_at: new Date().toISOString(),
      } as User
    },
    admin: { 
      email: 'admin@foodrescue.ai', 
      password: 'password123',
      fallbackUser: {
        id: 'u-admin-demo',
        email: 'admin@foodrescue.ai',
        full_name: 'Platform Administrator',
        role: 'admin',
        organization_id: undefined,
        is_active: true,
        created_at: new Date().toISOString(),
      } as User
    },
  };

  const switchRole = async (role: 'donor' | 'recipient' | 'volunteer' | 'admin' | 'public') => {
    if (role === 'public') {
      setCurrentUser(null);
      localStorage.removeItem('foodrescue_token');
      setActiveTab('explore');
      return;
    }

    const account = demoAccounts[role];
    try {
      const res = await api.auth.login(account.email, account.password);
      localStorage.setItem('foodrescue_token', res.access_token);
      setCurrentUser(res.user);

      // Route to relevant default dashboard
      if (role === 'donor') setActiveTab('donor-dashboard');
      else if (role === 'recipient') setActiveTab('recipient-matches');
      else if (role === 'volunteer') setActiveTab('pickups');
      else if (role === 'admin') setActiveTab('admin');

      showToast(`Switched persona to ${res.user.full_name} (${res.user.role.toUpperCase()})`);
      refreshData();
    } catch (err: any) {
      console.warn('API login not reachable yet, applying demo persona:', err);
      setCurrentUser(account.fallbackUser);
      if (role === 'donor') setActiveTab('donor-dashboard');
      else if (role === 'recipient') setActiveTab('recipient-matches');
      else if (role === 'volunteer') setActiveTab('pickups');
      else if (role === 'admin') setActiveTab('admin');
      showToast(`Switched persona to ${account.fallbackUser.full_name} (${account.fallbackUser.role.toUpperCase()})`);
    }
  };

  // Refresh domain data
  const refreshData = async () => {
    try {
      const [fetchedListings, fetchedAnalytics] = await Promise.allSettled([
        api.surplus.list(),
        api.analytics.getImpact(),
      ]);

      if (fetchedListings.status === 'fulfilled') {
        setListings(fetchedListings.value);
      } else {
        console.error('Failed to fetch surplus listings:', fetchedListings.reason);
      }

      if (fetchedAnalytics.status === 'fulfilled') {
        setAnalytics(fetchedAnalytics.value);
      } else {
        console.error('Failed to fetch impact analytics:', fetchedAnalytics.reason);
      }

      if (localStorage.getItem('foodrescue_token')) {
        const [fetchedMatches, fetchedNotifs] = await Promise.allSettled([
          api.matches.listMyMatches(),
          api.notifications.list(),
        ]);
        if (fetchedMatches.status === 'fulfilled') setMatches(fetchedMatches.value);
        if (fetchedNotifs.status === 'fulfilled') setNotifications(fetchedNotifs.value);
      }

      // If user is donor, load forecast
      if (currentUser?.role === 'donor' && currentUser?.organization_id) {
        const fc = await api.predictions.getForecast(currentUser.organization_id).catch(() => null);
        if (fc) setForecast(fc);
      }

      // If admin, load pending orgs
      if (currentUser?.role === 'admin') {
        const orgs = await api.admin.getPendingOrgs().catch(() => []);
        setPendingOrgs(orgs);
      }
    } catch (err) {
      console.warn('Could not refresh full API data:', err);
    }
  };

  useEffect(() => {
    // Default initial login as Donor for rich demonstration
    switchRole('donor');
  }, []);

  useEffect(() => {
    refreshData();
  }, [currentUser, activeTab]);

  // Handle Create Listing
  const handleCreateListing = async (data: any) => {
    await api.surplus.create(data);
    showToast('Surplus offer published successfully! Matching engine is evaluating candidates.');
    refreshData();
  };

  // Handle Inspect Match Recommendations
  const handleInspectMatches = async (listing: SurplusListing) => {
    setSelectedListingForMatch(listing);
    setLoadingMatches(true);
    try {
      const recs = await api.matches.getRecommendations(listing.id);
      setMatchRecommendations(recs);
    } catch (err: any) {
      showToast(`Error evaluating matches: ${err.message}`);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Handle Claim / Accept Match
  const handleAcceptMatch = async (listingId: string, recipientOrgId?: string) => {
    await api.matches.accept(listingId, recipientOrgId);
    showToast('Match offer accepted! Pickup window ready to schedule.');
    refreshData();
  };

  // Handle Schedule Pickup Window
  const handleScheduleMatch = async (matchId: string) => {
    const now = new Date();
    const start = new Date(now.getTime() + 1 * 3600 * 1000).toISOString();
    const end = new Date(now.getTime() + 4 * 3600 * 1000).toISOString();
    await api.matches.schedule(matchId, { pickup_window_start: start, pickup_window_end: end });
    showToast('Pickup window scheduled for today (1h to 4h from now).');
    refreshData();
  };

  // Handle Assign Volunteer
  const handleAssignVolunteer = async (matchId: string) => {
    await api.matches.assignVolunteer(matchId);
    showToast('Logistics volunteer assigned to coordinate pickup.');
    refreshData();
  };

  // Handle Pickup Milestone Event
  const handleRecordHandoffEvent = async (matchId: string, eventType: string, notes?: string) => {
    await api.pickups.recordEvent(matchId, { event_type: eventType, notes });
    showToast(`Handoff milestone '${eventType}' recorded with audit timestamp.`);
    refreshData();
  };

  // Handle Admin Verification
  const handleVerifyOrg = async (orgId: string, status: string, reason?: string) => {
    await api.admin.verifyOrg(orgId, status, reason);
    showToast(`Organization verification status updated: ${status.toUpperCase()}`);
    refreshData();
  };

  // Filtered listings
  const filteredListings = selectedCategory === 'all'
    ? listings
    : listings.filter(l => l.food_category === selectedCategory);

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col selection:bg-leaf/30 text-ink">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-forest text-white shadow-floating text-xs font-semibold flex items-center gap-2 border border-leaf/40 animate-bounce">
          <CheckCircle className="w-4 h-4 text-citrus" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar 
        currentUser={currentUser}
        onSelectRole={switchRole}
        notifications={notifications}
        onMarkNotificationRead={async (id) => {
          await api.notifications.markRead(id);
          refreshData();
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab as any}
      />

      {/* Main Content Surfaces */}
      <main className="flex-1">
        
        {/* VIEW 1: EXPLORE / LANDING PAGE */}
        {activeTab === 'explore' && (
          <div>
            <HeroCollage 
              metrics={analytics?.metrics || null}
              onExplore={() => {
                const el = document.getElementById('surplus-feed');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onCreateListing={() => setIsWizardOpen(true)}
            />

            {/* Surplus Masonry Feed Section */}
            <section id="surplus-feed" className="max-w-7xl mx-auto px-4 lg:px-8 py-12 space-y-8">
              
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted block mb-1">
                    Verified Surplus Availability Feed
                  </span>
                  <h2 className="font-display text-3xl font-bold text-ink">
                    Active Surplus Offers
                  </h2>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1.5 p-1 rounded-full bg-surface-paper border border-surface-border">
                  {[
                    { id: 'all', label: 'All Offers' },
                    { id: 'prepared_meals', label: 'Prepared Meals' },
                    { id: 'bakery', label: 'Bakery' },
                    { id: 'produce', label: 'Produce' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-forest text-white shadow-sm'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Masonry Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map(listing => (
                  <SurplusCard
                    key={listing.id}
                    listing={listing}
                    userRole={currentUser?.role}
                    onSelect={handleInspectMatches}
                    onTrackPickup={() => setActiveTab('pickups')}
                    onClaim={async (l) => {
                      await handleAcceptMatch(l.id);
                    }}
                  />
                ))}
              </div>

            </section>
          </div>
        )}

        {/* VIEW 2: DONOR DASHBOARD (Forecast & Listings) */}
        {activeTab === 'donor-dashboard' && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
            
            {currentUser?.role !== 'donor' && (
              <div className="p-4 rounded-2xl bg-citrus/20 border border-citrus/40 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-ink">
                  You are currently previewing as <strong>{currentUser?.full_name || 'Visitor'}</strong> ({currentUser?.role?.toUpperCase() || 'PUBLIC'}).
                </span>
                <button
                  onClick={() => switchRole('donor')}
                  className="px-3.5 py-1.5 rounded-xl bg-forest text-white text-xs font-bold hover:bg-forest-dark transition-colors"
                >
                  Switch to Bistro Donor
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted block mb-1">
                  Donor Operations Hub
                </span>
                <h2 className="font-display text-3xl font-bold text-ink">
                  {currentUser?.organization?.name || 'Green Garden Bistro'}
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Anticipate edible surplus quantities, schedule daily listings, and monitor recipient redistribution.
                </p>
              </div>

              <button
                onClick={() => setIsWizardOpen(true)}
                className="px-5 py-3 rounded-full bg-forest text-white text-xs font-bold hover:bg-forest-dark transition-all shadow-tactile flex items-center gap-2 self-start"
              >
                <Plus className="w-4 h-4" />
                <span>Create Surplus Listing</span>
              </button>
            </div>

            {/* 7-Day ML Forecast Chart */}
            <ForecastChart forecastData={forecast} />

            {/* Donor's Current Surplus Listings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-ink">
                  Your Kitchen's Surplus Listings
                </h3>
                <span className="text-xs text-ink-muted font-medium">
                  {listings.length} registered items
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map(listing => (
                  <SurplusCard
                    key={listing.id}
                    listing={listing}
                    userRole={currentUser?.role}
                    onSelect={handleInspectMatches}
                    onTrackPickup={() => setActiveTab('pickups')}
                  />
                ))}
              </div>
            </div>

          </div>
        )}

        {/* VIEW 3: RECIPIENT MATCHES (Claim Offers) */}
        {activeTab === 'recipient-matches' && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
            
            {currentUser?.role !== 'recipient' && (
              <div className="p-4 rounded-2xl bg-leaf/20 border border-leaf/40 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-ink">
                  You are currently previewing as <strong>{currentUser?.full_name || 'Visitor'}</strong> ({currentUser?.role?.toUpperCase() || 'PUBLIC'}).
                </span>
                <button
                  onClick={() => switchRole('recipient')}
                  className="px-3.5 py-1.5 rounded-xl bg-forest text-white text-xs font-bold hover:bg-forest-dark transition-colors"
                >
                  Switch to Hope Kitchen (Recipient)
                </button>
              </div>
            )}

            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted block mb-1">
                Recipient Match Discovery
              </span>
              <h2 className="font-display text-3xl font-bold text-ink">
                Available Surplus Offers
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Offers filtered according to your verified cold storage capacity and local service area radius.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.filter(l => l.status === 'available').map(listing => (
                <SurplusCard
                  key={listing.id}
                  listing={listing}
                  userRole="recipient"
                  onSelect={handleInspectMatches}
                  onTrackPickup={() => setActiveTab('pickups')}
                  onClaim={async (l) => {
                    await handleAcceptMatch(l.id);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: PICKUP & COORDINATION */}
        {activeTab === 'pickups' && (
          <PickupTimelineView 
            matches={matches}
            onRecordHandoffEvent={handleRecordHandoffEvent}
            onScheduleMatch={handleScheduleMatch}
            onAssignVolunteer={handleAssignVolunteer}
            userRole={currentUser?.role}
          />
        )}

        {/* VIEW 5: IMPACT ANALYTICS */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboardView analytics={analytics} onRefresh={refreshData} />
        )}

        {/* VIEW 6: ADMIN VERIFICATION QUEUE */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            {currentUser?.role !== 'admin' && (
              <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-8">
                <div className="p-4 rounded-2xl bg-berry/15 border border-berry/30 flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-ink">
                    You are currently previewing as <strong>{currentUser?.full_name || 'Visitor'}</strong> ({currentUser?.role?.toUpperCase() || 'PUBLIC'}).
                  </span>
                  <button
                    onClick={() => switchRole('admin')}
                    className="px-3.5 py-1.5 rounded-xl bg-berry text-white text-xs font-bold hover:bg-berry-dark transition-colors"
                  >
                    Switch to Platform Admin
                  </button>
                </div>
              </div>
            )}
            <AdminVerificationView 
              pendingOrgs={pendingOrgs}
              onVerifyOrg={handleVerifyOrg}
            />
          </div>
        )}

      </main>

      {/* Surplus Creation Wizard Modal */}
      <ListingWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSubmit={handleCreateListing}
        donorOrgId={currentUser?.organization_id || undefined}
      />

      {/* Recipient Matches Inspection Modal */}
      {selectedListingForMatch && (
        <RecipientMatchesView
          listing={selectedListingForMatch}
          recommendations={matchRecommendations}
          loading={loadingMatches}
          onAcceptMatch={handleAcceptMatch}
          onClose={() => setSelectedListingForMatch(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-surface-border bg-cream-50/80 px-4 lg:px-8 py-8 mt-20 text-xs text-ink-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-forest text-sm">FoodRescue AI</span>
            <span>• Verified Edible Surplus Redistribution Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Climate-Tech MVP</span>
            <span>Human-In-The-Loop Safety</span>
            <span>Zero Unverified Claims</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

