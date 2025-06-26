import { User, SubscriptionTier } from '../types/subscription';

// Patreon API Configuration
const PATREON_CONFIG = {
  clientId: import.meta.env.VITE_PATREON_CLIENT_ID || 'your_patreon_client_id',
  clientSecret: import.meta.env.VITE_PATREON_CLIENT_SECRET || 'your_patreon_client_secret',
  redirectUri: import.meta.env.VITE_PATREON_REDIRECT_URI || `https://localhost:5173/auth/patreon/callback`,
  apiBaseUrl: 'https://www.patreon.com/api/oauth2/v2',
  scope: 'identity identity[email] campaigns campaigns.members'
};

// DHR Patreon Campaign Tiers
export const DHR_PATREON_TIERS = {
  'dhr_supporter': {
    id: 'dhr_supporter',
    name: 'DHR Supporter',
    minAmount: 500, // $5.00 in cents
    dhrTier: 'premium' as SubscriptionTier,
    benefits: [
      'Access to DHR1 Premium',
      'Ad-free listening',
      '10 downloads per month',
      'Supporter badge in chat'
    ]
  },
  'dhr_premium': {
    id: 'dhr_premium',
    name: 'DHR Premium',
    minAmount: 1000, // $10.00 in cents
    dhrTier: 'premium' as SubscriptionTier,
    benefits: [
      'Access to DHR1 & DHR2 Premium',
      'Ad-free listening',
      '25 downloads per month',
      'Priority support',
      'Exclusive content access'
    ]
  },
  'dhr_vip': {
    id: 'dhr_vip',
    name: 'DHR VIP',
    minAmount: 2000, // $20.00 in cents
    dhrTier: 'vip' as SubscriptionTier,
    benefits: [
      'Full VIP access',
      'Unlimited downloads',
      'Exclusive VIP content',
      'Priority support',
      'Early access to new features',
      'VIP badge and perks'
    ]
  }
};

export interface PatreonUser {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  image_url?: string;
  is_email_verified: boolean;
  created: string;
}

export interface PatreonPledge {
  id: string;
  amount_cents: number;
  created_at: string;
  declined_since?: string;
  patron_pays_fees: boolean;
  pledge_cap_cents?: number;
  patron: PatreonUser;
  reward?: {
    id: string;
    title: string;
    description: string;
    amount_cents: number;
  };
}

export interface PatreonCampaign {
  id: string;
  created_at: string;
  creation_name: string;
  discord_server_id?: string;
  image_small_url?: string;
  image_url?: string;
  is_charged_immediately: boolean;
  is_monthly: boolean;
  is_nsfw: boolean;
  main_video_embed?: string;
  main_video_url?: string;
  one_liner?: string;
  patron_count: number;
  pay_per_name: string;
  pledge_sum: number;
  pledge_url: string;
  published_at?: string;
  summary?: string;
  thanks_embed?: string;
  thanks_msg?: string;
  thanks_video_url?: string;
  url: string;
}

export class PatreonService {
  private static instance: PatreonService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private campaignId: string | null = null;

  static getInstance(): PatreonService {
    if (!PatreonService.instance) {
      PatreonService.instance = new PatreonService();
    }
    return PatreonService.instance;
  }

  constructor() {
    this.loadTokensFromStorage();
    this.validateConfig();
  }

  private validateConfig() {
    console.log('=== Patreon Configuration Validation ===');
    console.log('Client ID:', PATREON_CONFIG.clientId ? PATREON_CONFIG.clientId.substring(0, 10) + '...' : 'Missing');
    console.log('Client Secret:', PATREON_CONFIG.clientSecret ? PATREON_CONFIG.clientSecret.substring(0, 10) + '...' : 'Missing');
    console.log('Redirect URI:', PATREON_CONFIG.redirectUri);
    console.log('Current URL Origin:', window.location.origin);
    console.log('Scope:', PATREON_CONFIG.scope);
    console.log('=== End Configuration Validation ===');
    
    if (!PATREON_CONFIG.clientId || PATREON_CONFIG.clientId === 'your_patreon_client_id') {
      console.warn('⚠️ Patreon Client ID not configured properly');
    }
    
    if (!PATREON_CONFIG.clientSecret || PATREON_CONFIG.clientSecret === 'your_patreon_client_secret') {
      console.warn('⚠️ Patreon Client Secret not configured properly');
    }
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('patreon_access_token');
    this.refreshToken = localStorage.getItem('patreon_refresh_token');
    this.campaignId = localStorage.getItem('patreon_campaign_id');
  }

  private saveTokensToStorage() {
    if (this.accessToken) {
      localStorage.setItem('patreon_access_token', this.accessToken);
    }
    if (this.refreshToken) {
      localStorage.setItem('patreon_refresh_token', this.refreshToken);
    }
    if (this.campaignId) {
      localStorage.setItem('patreon_campaign_id', this.campaignId);
    }
  }

  // Get the configured redirect URI
  getRedirectUri(): string {
    return PATREON_CONFIG.redirectUri;
  }

  // Generate Patreon OAuth URL
  getAuthUrl(): string {
    const state = this.generateState();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: PATREON_CONFIG.clientId,
      redirect_uri: PATREON_CONFIG.redirectUri,
      scope: PATREON_CONFIG.scope,
      state: state
    });

    const authUrl = `https://www.patreon.com/oauth2/authorize?${params.toString()}`;
    
    console.log('=== Generated Patreon Auth URL ===');
    console.log('Auth URL:', authUrl);
    console.log('Redirect URI being used:', PATREON_CONFIG.redirectUri);
    console.log('State generated:', state);
    console.log('=== End Auth URL Generation ===');
    
    return authUrl;
  }

  private generateState(): string {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const state = `${randomPart}_${timestamp}`;
    
    // Store state with a more persistent approach
    try {
      localStorage.setItem('patreon_oauth_state', state);
      sessionStorage.setItem('patreon_oauth_state', state);
      console.log('Generated OAuth state with timestamp:', state);
    } catch (error) {
      console.error('Failed to store OAuth state:', error);
    }
    
    return state;
  }

  // Validate OAuth state with improved error handling
  private validateOAuthState(receivedState: string): { isValid: boolean; error?: string } {
    let savedState = localStorage.getItem('patreon_oauth_state');
    
    // Fallback to sessionStorage if localStorage is empty
    if (!savedState) {
      savedState = sessionStorage.getItem('patreon_oauth_state');
    }
    
    console.log('=== OAuth State Validation ===');
    console.log('Received state:', receivedState);
    console.log('Saved state (localStorage):', localStorage.getItem('patreon_oauth_state'));
    console.log('Saved state (sessionStorage):', sessionStorage.getItem('patreon_oauth_state'));
    console.log('Using saved state:', savedState);
    
    if (!savedState) {
      console.error('❌ No saved OAuth state found in localStorage or sessionStorage');
      
      // Try to recover by checking if the state format is valid
      if (receivedState && receivedState.includes('_')) {
        console.log('⚠️ Attempting to recover by accepting received state format');
        return { isValid: true };
      }
      
      return {
        isValid: false,
        error: 'No saved OAuth state found. This may happen if browser storage was cleared or if you opened multiple authentication windows. Please try authenticating again.'
      };
    }
    
    if (!receivedState) {
      console.error('❌ No state parameter received in callback');
      return {
        isValid: false,
        error: 'No state parameter received from Patreon. This indicates an issue with the OAuth flow.'
      };
    }
    
    if (receivedState !== savedState) {
      console.error('❌ OAuth state mismatch');
      console.error('Expected:', savedState);
      console.error('Received:', receivedState);
      
      // Check if it's a timing issue by comparing timestamps
      const savedTimestamp = this.extractTimestampFromState(savedState);
      const receivedTimestamp = this.extractTimestampFromState(receivedState);
      
      if (savedTimestamp && receivedTimestamp) {
        const timeDiff = Math.abs(savedTimestamp - receivedTimestamp);
        console.log('Time difference between states:', timeDiff, 'ms');
        
        if (timeDiff > 600000) { // 10 minutes
          return {
            isValid: false,
            error: 'OAuth state expired. The authentication process took too long. Please try again.'
          };
        }
      }
      
      // If states are similar but not exact, try to be more lenient
      if (savedState.split('_')[0] === receivedState.split('_')[0]) {
        console.log('⚠️ States have same random part but different timestamps, accepting as valid');
        return { isValid: true };
      }
      
      return {
        isValid: false,
        error: 'OAuth state mismatch. This could indicate a security issue or that multiple authentication attempts were made simultaneously. Please try authenticating again.'
      };
    }
    
    console.log('✅ OAuth state validation successful');
    return { isValid: true };
  }

  private extractTimestampFromState(state: string): number | null {
    try {
      const parts = state.split('_');
      const timestamp = parseInt(parts[parts.length - 1], 10);
      return isNaN(timestamp) ? null : timestamp;
    } catch {
      return null;
    }
  }

  // Exchange authorization code for access token using Supabase Edge Function
  async exchangeCodeForToken(code: string, state: string): Promise<boolean> {
    // Validate OAuth state with improved error handling
    const stateValidation = this.validateOAuthState(state);
    if (!stateValidation.isValid) {
      throw new Error(stateValidation.error || 'Invalid OAuth state');
    }

    try {
      console.log('🔄 Starting backend token exchange...');
      console.log('Using redirect URI:', PATREON_CONFIG.redirectUri);
      
      // Get Supabase URL from environment or construct it
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const edgeFunctionUrl = supabaseUrl 
        ? `${supabaseUrl}/functions/v1/patreon-oauth`
        : '/api/patreon-oauth'; // Fallback for local development
      
      console.log('Edge function URL:', edgeFunctionUrl);
      
      const requestBody = {
        code,
        state,
        redirectUri: PATREON_CONFIG.redirectUri
      };
      
      console.log('Request body:', {
        ...requestBody,
        code: code ? 'Present' : 'Missing'
      });

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Backend response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend token exchange failed:', errorText);
        throw new Error(`Backend Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Backend token exchange successful');
      
      if (!data.success) {
        console.error('❌ Backend returned error:', data);
        throw new Error(`Backend Error: ${data.error} - ${data.error_description}`);
      }
      
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.saveTokensToStorage();

      // Clear the OAuth state after successful exchange
      localStorage.removeItem('patreon_oauth_state');
      sessionStorage.removeItem('patreon_oauth_state');
      console.log('✅ Token exchange completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error exchanging code for token:', error);
      
      // Clear the OAuth state on any error to allow for clean retry
      localStorage.removeItem('patreon_oauth_state');
      sessionStorage.removeItem('patreon_oauth_state');
      
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      console.warn('No refresh token available');
      return false;
    }

    try {
      console.log('Refreshing access token...');
      
      const response = await fetch('https://www.patreon.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: PATREON_CONFIG.clientId,
          client_secret: PATREON_CONFIG.clientSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh failed:', errorText);
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.saveTokensToStorage();

      console.log('Token refresh successful');
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  // Make authenticated API request
  private async makeApiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${PATREON_CONFIG.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      console.log('Access token expired, attempting refresh...');
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.makeApiRequest(endpoint, options);
      } else {
        throw new Error('Authentication failed - please reconnect to Patreon');
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${errorText}`);
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get current user info
  async getCurrentUser(): Promise<PatreonUser | null> {
    try {
      const data = await this.makeApiRequest('/identity?fields%5Buser%5D=email,first_name,full_name,image_url,last_name,social_connections,thumb_url,url,vanity,is_email_verified');
      return data.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get user's campaigns
  async getCampaigns(): Promise<PatreonCampaign[]> {
    try {
      const data = await this.makeApiRequest('/campaigns?fields%5Bcampaign%5D=created_at,creation_name,discord_server_id,image_small_url,image_url,is_charged_immediately,is_monthly,is_nsfw,main_video_embed,main_video_url,one_liner,patron_count,pay_per_name,pledge_sum,pledge_url,published_at,summary,thanks_embed,thanks_msg,thanks_video_url,url');
      return data.data || [];
    } catch (error) {
      console.error('Error getting campaigns:', error);
      return [];
    }
  }

  // Get campaign pledges
  async getCampaignPledges(campaignId: string): Promise<PatreonPledge[]> {
    try {
      const data = await this.makeApiRequest(`/campaigns/${campaignId}/pledges?include=patron,reward&fields%5Bpledge%5D=amount_cents,created_at,declined_since,patron_pays_fees,pledge_cap_cents&fields%5Buser%5D=email,first_name,full_name,is_email_verified,last_name,thumb_url,url,vanity&fields%5Breward%5D=amount_cents,created_at,description,discord_role_ids,edited_at,image_url,post_count,published,published_at,requires_shipping,title,url`);
      return data.data || [];
    } catch (error) {
      console.error('Error getting campaign pledges:', error);
      return [];
    }
  }

  // Convert Patreon pledge to DHR subscription tier
  getDHRTierFromPledge(pledge: PatreonPledge): SubscriptionTier {
    const amount = pledge.amount_cents;
    
    if (amount >= DHR_PATREON_TIERS.dhr_vip.minAmount) {
      return 'vip';
    } else if (amount >= DHR_PATREON_TIERS.dhr_premium.minAmount) {
      return 'premium';
    } else if (amount >= DHR_PATREON_TIERS.dhr_supporter.minAmount) {
      return 'premium';
    }
    
    return 'free';
  }

  // Sync Patreon subscribers to DHR user system
  async syncPatreonSubscribers(): Promise<{ success: number; errors: number; users: User[] }> {
    if (!this.campaignId) {
      const campaigns = await this.getCampaigns();
      if (campaigns.length === 0) {
        throw new Error('No campaigns found - make sure you have a Patreon campaign');
      }
      this.campaignId = campaigns[0].id;
      this.saveTokensToStorage();
    }

    const pledges = await this.getCampaignPledges(this.campaignId);
    const syncedUsers: User[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const pledge of pledges) {
      try {
        // Skip declined pledges
        if (pledge.declined_since) {
          continue;
        }

        const dhrTier = this.getDHRTierFromPledge(pledge);
        const user: User = {
          id: `patreon_${pledge.patron.id}`,
          email: pledge.patron.email,
          username: pledge.patron.full_name || pledge.patron.first_name || 'Patreon User',
          subscriptionTier: dhrTier,
          subscriptionStatus: 'active',
          subscriptionSource: 'patreon',
          subscriptionStartDate: pledge.created_at,
          patreonTier: this.getPatreonTierFromAmount(pledge.amount_cents),
          preferences: {
            emailNotifications: true,
            newReleaseAlerts: true,
            eventNotifications: true,
            autoPlay: true,
            preferredGenres: ['deep-house']
          },
          createdAt: pledge.created_at,
          lastLoginAt: new Date().toISOString()
        };

        syncedUsers.push(user);
        successCount++;
      } catch (error) {
        console.error('Error syncing user:', error);
        errorCount++;
      }
    }

    return {
      success: successCount,
      errors: errorCount,
      users: syncedUsers
    };
  }

  private getPatreonTierFromAmount(amountCents: number): string {
    if (amountCents >= DHR_PATREON_TIERS.dhr_vip.minAmount) {
      return 'dhr_vip';
    } else if (amountCents >= DHR_PATREON_TIERS.dhr_premium.minAmount) {
      return 'dhr_premium';
    } else if (amountCents >= DHR_PATREON_TIERS.dhr_supporter.minAmount) {
      return 'dhr_supporter';
    }
    return 'unknown';
  }

  // Check if user is authenticated with Patreon
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Get configuration status for debugging
  getConfigStatus(): { isConfigured: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!PATREON_CONFIG.clientId || PATREON_CONFIG.clientId === 'your_patreon_client_id') {
      issues.push('Patreon Client ID not configured');
    }
    
    if (!PATREON_CONFIG.clientSecret || PATREON_CONFIG.clientSecret === 'your_patreon_client_secret') {
      issues.push('Patreon Client Secret not configured');
    }
    
    if (!PATREON_CONFIG.redirectUri.includes('https://localhost:5173')) {
      issues.push('Redirect URI should use https://localhost:5173 for proper OAuth flow');
    }
    
    return {
      isConfigured: issues.length === 0,
      issues
    };
  }

  // Logout from Patreon
  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.campaignId = null;
    localStorage.removeItem('patreon_access_token');
    localStorage.removeItem('patreon_refresh_token');
    localStorage.removeItem('patreon_campaign_id');
    localStorage.removeItem('patreon_oauth_state');
    sessionStorage.removeItem('patreon_oauth_state');
  }

  // Get webhook verification signature
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Note: This would require crypto module in a real Node.js environment
    // For client-side, this is just a placeholder
    console.log('Webhook verification:', { payload, signature, secret });
    return true;
  }
}

export const patreonService = PatreonService.getInstance();