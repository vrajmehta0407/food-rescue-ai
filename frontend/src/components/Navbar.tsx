import React, { useState } from 'react';
import { User, NotificationItem } from '../types';
import { Bell, Sparkles, ChevronDown, CheckCircle2, ShieldCheck, Truck, Store, HeartHandshake, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onSelectRole: (role: 'donor' | 'recipient' | 'volunteer' | 'admin' | 'public') => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectRole,
  notifications,
  onMarkNotificationRead,
  activeTab,
  setActiveTab,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const roleLabels = {
    donor: { label: 'Bistro Donor', icon: Store, bg: 'bg-forest text-white' },
    recipient: { label: 'Hope Kitchen', icon: HeartHandshake, bg: 'bg-leaf-dark text-white' },
    volunteer: { label: 'Logistics Volunteer', icon: Truck, bg: 'bg-citrus-dark text-white' },
    admin: { label: 'Platform Admin', icon: ShieldCheck, bg: 'bg-berry text-white' },
  };

  return (
    <header className="sticky top-0 z-40 bg-cream-100/90 backdrop-blur-md border-b border-surface-border px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Editorial Typography */}
        <div 
          onClick={() => setActiveTab('explore')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center text-white shadow-tactile group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-citrus" />
          </div>
          <div>
            <span className="font-display text-2xl font-bold text-forest tracking-tight block leading-none">
              FoodRescue<span className="text-leaf-dark italic ml-0.5">AI</span>
            </span>
            <span className="text-[11px] uppercase tracking-widest text-ink-muted font-medium block mt-0.5">
              Intelligent Redistribution
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-surface-paper/90 p-1 rounded-full border border-surface-border shadow-sm">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'explore'
                ? 'bg-forest text-white shadow-sm'
                : 'text-ink-muted hover:text-forest hover:bg-cream-200'
            }`}
          >
            Surplus Network
          </button>
          
          <button
            onClick={() => setActiveTab('donor-dashboard')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'donor-dashboard'
                ? 'bg-forest text-white shadow-sm'
                : 'text-ink-muted hover:text-forest hover:bg-cream-200'
            }`}
          >
            Donor Hub & Forecast
          </button>

          <button
            onClick={() => setActiveTab('recipient-matches')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'recipient-matches'
                ? 'bg-forest text-white shadow-sm'
                : 'text-ink-muted hover:text-forest hover:bg-cream-200'
            }`}
          >
            Recipient Discovery
          </button>

          <button
            onClick={() => setActiveTab('pickups')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'pickups'
                ? 'bg-forest text-white shadow-sm'
                : 'text-ink-muted hover:text-forest hover:bg-cream-200'
            }`}
          >
            Pickup Timeline
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'analytics'
                ? 'bg-forest text-white shadow-sm'
                : 'text-ink-muted hover:text-forest hover:bg-cream-200'
            }`}
          >
            Impact Analytics
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'admin'
                ? 'bg-berry text-white shadow-sm'
                : 'text-ink-muted hover:text-berry hover:bg-cream-200'
            }`}
          >
            Admin Queue
          </button>
        </nav>

        {/* User Controls & Demo Persona Switcher */}
        <div className="flex items-center gap-3">
          
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="w-10 h-10 rounded-full bg-surface-paper border border-surface-border flex items-center justify-center text-ink-muted hover:text-forest hover:border-forest/40 transition-colors relative shadow-sm"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-cream-100">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-paper rounded-2xl shadow-floating border border-surface-border p-4 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-2">
                  <h4 className="font-display text-base font-semibold text-ink">Notifications</h4>
                  <span className="text-xs text-ink-muted">{unreadCount} unread</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-ink-muted py-6 text-center">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => onMarkNotificationRead(n.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                          n.read_at ? 'bg-cream-50/50 border-surface-border text-ink-muted' : 'bg-cream-100 border-leaf/40 text-ink shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold mb-1">
                          <span>{n.title}</span>
                          {!n.read_at && <span className="w-2 h-2 rounded-full bg-coral"></span>}
                        </div>
                        <p className="line-clamp-2 leading-relaxed">{n.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-full bg-surface-paper border border-surface-border hover:border-forest/50 transition-all shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-leaf"></span>
              <span className="text-xs font-semibold text-ink">
                {currentUser ? (
                  roleLabels[currentUser.role]?.label || currentUser.full_name
                ) : (
                  'Demo Accounts'
                )}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-surface-paper rounded-2xl shadow-floating border border-surface-border p-2 z-50">
                <div className="px-3 py-2 border-b border-surface-border mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted">
                    Switch Demo Persona
                  </span>
                </div>
                
                <button
                  onClick={() => { onSelectRole('donor'); setShowRoleMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-100 text-left transition-colors text-xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-forest/10 text-forest flex items-center justify-center font-bold">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-ink block">Green Garden Bistro</span>
                    <span className="text-[11px] text-ink-muted">Donor • Restaurant</span>
                  </div>
                </button>

                <button
                  onClick={() => { onSelectRole('recipient'); setShowRoleMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-100 text-left transition-colors text-xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-leaf/20 text-leaf-dark flex items-center justify-center font-bold">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-ink block">Hope Community Kitchen</span>
                    <span className="text-[11px] text-ink-muted">Recipient • Verified NGO</span>
                  </div>
                </button>

                <button
                  onClick={() => { onSelectRole('volunteer'); setShowRoleMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-100 text-left transition-colors text-xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-citrus/20 text-citrus-dark flex items-center justify-center font-bold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-ink block">Alex Taylor</span>
                    <span className="text-[11px] text-ink-muted">Logistics Coordinator</span>
                  </div>
                </button>

                <button
                  onClick={() => { onSelectRole('admin'); setShowRoleMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-100 text-left transition-colors text-xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-berry/15 text-berry flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-ink block">Platform Admin</span>
                    <span className="text-[11px] text-ink-muted">Verification Queue</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileNav(!showMobileNav)}
            className="lg:hidden w-10 h-10 rounded-full bg-surface-paper border border-surface-border flex items-center justify-center text-ink-muted hover:text-forest transition-colors shadow-sm"
          >
            {showMobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile Navigation Drawer */}
      {showMobileNav && (
        <div className="lg:hidden border-t border-surface-border mt-3 pt-3 pb-2 space-y-1">
          {[
            { id: 'explore', label: 'Surplus Network' },
            { id: 'donor-dashboard', label: 'Donor Hub & Forecast' },
            { id: 'recipient-matches', label: 'Recipient Discovery' },
            { id: 'pickups', label: 'Pickup Timeline' },
            { id: 'analytics', label: 'Impact Analytics' },
            { id: 'admin', label: 'Admin Queue' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setShowMobileNav(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-forest text-white'
                  : 'text-ink-muted hover:text-ink hover:bg-cream-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};

