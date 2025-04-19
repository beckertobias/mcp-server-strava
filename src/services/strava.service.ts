import axios from 'axios';
import { config } from '../config';
import { StravaActivity, StravaTokenResponse, UserSession } from '../types/strava.types';

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

      userSession = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: response.data.expires_at
      };

      return userSession;
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

        userSession = {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          expiresAt: response.data.expires_at
        };
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
    userSession = null;
  }
}

export const stravaService = new StravaService();