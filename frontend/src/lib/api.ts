import { 
  User, 
  SurplusListing, 
  DonationMatch, 
  MatchRecommendation, 
  HandoffEvent, 
  ForecastResponse, 
  AnalyticsSummary, 
  NotificationItem,
  Organization
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('foodrescue_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.message || errorJson.detail?.message || errorJson.detail || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<{ access_token: string; user: User }> => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(res);
    },
    register: async (payload: any): Promise<{ access_token: string; user: User }> => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
    getMe: async (): Promise<User> => {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },

  surplus: {
    list: async (donorId?: string, status?: string): Promise<SurplusListing[]> => {
      const params = new URLSearchParams();
      if (donorId) params.append('donor_organization_id', donorId);
      if (status) params.append('status', status);
      const res = await fetch(`${API_BASE}/surplus-listings?${params.toString()}`);
      return handleResponse(res);
    },
    getById: async (id: string): Promise<SurplusListing> => {
      const res = await fetch(`${API_BASE}/surplus-listings/${id}`);
      return handleResponse(res);
    },
    create: async (data: any): Promise<SurplusListing> => {
      const res = await fetch(`${API_BASE}/surplus-listings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    publish: async (id: string): Promise<SurplusListing> => {
      const res = await fetch(`${API_BASE}/surplus-listings/${id}/publish`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
    cancel: async (id: string): Promise<SurplusListing> => {
      const res = await fetch(`${API_BASE}/surplus-listings/${id}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },

  matches: {
    getRecommendations: async (listingId: string): Promise<MatchRecommendation[]> => {
      const res = await fetch(`${API_BASE}/matches/recommendations/${listingId}`);
      return handleResponse(res);
    },
    listMyMatches: async (): Promise<DonationMatch[]> => {
      const res = await fetch(`${API_BASE}/matches`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
    accept: async (listingId: string, recipientOrgId?: string): Promise<DonationMatch> => {
      const res = await fetch(`${API_BASE}/matches/accept/${listingId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ recipient_organization_id: recipientOrgId }),
      });
      return handleResponse(res);
    },
    schedule: async (matchId: string, payload: { pickup_window_start: string; pickup_window_end: string }): Promise<DonationMatch> => {
      const res = await fetch(`${API_BASE}/matches/${matchId}/schedule`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
    assignVolunteer: async (matchId: string): Promise<DonationMatch> => {
      const res = await fetch(`${API_BASE}/matches/${matchId}/assign-volunteer`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },

  pickups: {
    getEvents: async (matchId: string): Promise<HandoffEvent[]> => {
      const res = await fetch(`${API_BASE}/pickups/${matchId}/events`);
      return handleResponse(res);
    },
    recordEvent: async (matchId: string, event: { event_type: string; quantity_value?: number; notes?: string }): Promise<HandoffEvent> => {
      const res = await fetch(`${API_BASE}/pickups/${matchId}/events`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(event),
      });
      return handleResponse(res);
    },
  },

  predictions: {
    getForecast: async (orgId?: string, days = 7): Promise<ForecastResponse> => {
      const params = new URLSearchParams({ days: days.toString() });
      if (orgId) params.append('organization_id', orgId);
      const res = await fetch(`${API_BASE}/predictions/forecast?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },

  analytics: {
    getImpact: async (donorId?: string): Promise<AnalyticsSummary> => {
      const params = new URLSearchParams();
      if (donorId) params.append('donor_organization_id', donorId);
      const res = await fetch(`${API_BASE}/analytics/impact?${params.toString()}`);
      return handleResponse(res);
    },
  },

  notifications: {
    list: async (): Promise<NotificationItem[]> => {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
    markRead: async (id: string): Promise<NotificationItem> => {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },

  admin: {
    getPendingOrgs: async (): Promise<Organization[]> => {
      const res = await fetch(`${API_BASE}/admin/organizations/pending`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
    verifyOrg: async (id: string, status: string, reason?: string): Promise<Organization> => {
      const res = await fetch(`${API_BASE}/admin/organizations/${id}/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ verification_status: status, reason }),
      });
      return handleResponse(res);
    },
    getAuditLogs: async (): Promise<any[]> => {
      const res = await fetch(`${API_BASE}/admin/audit-logs`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },
};

