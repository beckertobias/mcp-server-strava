export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  start_date: string;
  type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  average_speed: number;
  max_speed: number;
  total_elevation_gain: number;
}

export interface UserSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}