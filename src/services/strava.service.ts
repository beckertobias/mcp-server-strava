import axios from 'axios';
import { config } from '../config/index.js';
import { StravaActivity, StravaTokenResponse, UserSession } from '../types/strava.types.js';

// In a real app, use a proper session store or database
let userSession: UserSession | null = null;

export class StravaService {
  
  // Generate authorization URL for Strava OAuth
  getAuthUrl(): string {
    return `${config.strava.authUrl}?client_id=${config.strava.clientId}&redirect_uri=${config.strava.redirectUri}&response_type=code&scope=activity:read_all`;
  }

  // Exchange authorization code for tokens
  async getTokens(code: string): Promise<UserSession> {
    try {
      const response = await axios.post<StravaTokenResponse>(config.strava.tokenUrl, {
        client_id: config.strava.clientId,
        client_secret: config.strava.clientSecret,
        code,
        grant_type: 'authorization_code'
      });

      const session = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: response.data.expires_at
      };

      this.setSession(session);
      return session;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to get access tokens');
    }
  }

  // Refresh access token if expired
  async refreshTokenIfNeeded(): Promise<string> {
    if (!userSession) {
      throw new Error('User not authenticated');
    }

    // Check if token is expired (with 5 minutes buffer)
    const now = Math.floor(Date.now() / 1000);
    if (now >= userSession.expiresAt - 300) {
      try {
        const response = await axios.post<StravaTokenResponse>(config.strava.tokenUrl, {
          client_id: config.strava.clientId,
          client_secret: config.strava.clientSecret,
          refresh_token: userSession.refreshToken,
          grant_type: 'refresh_token'
        });

        const session = {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          expiresAt: response.data.expires_at
        };
        
        this.setSession(session);
      } catch (error) {
        console.error('Error refreshing token:', error);
        throw new Error('Failed to refresh token');
      }
    }

    return userSession.accessToken;
  }

  // Get user activities
  async getActivities(page = 1, perPage = 30): Promise<StravaActivity[]> {
    try {
      const accessToken = await this.refreshTokenIfNeeded();
      
      const response = await axios.get<StravaActivity[]>(
        `${config.strava.apiUrl}/athlete/activities`, 
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { page, per_page: perPage }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw new Error('Failed to fetch activities');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return userSession !== null;
  }

  // Clear user session
  logout(): void {
    this.setSession(null);
  }

  // Set user session (used by MCP server for persistence)
  setSession(session: UserSession | null): void {
    userSession = session;
  }

  // Get current session (used by MCP server for persistence)
  getSession(): UserSession | null {
    return userSession;
  }
}

export const stravaService = new StravaService();