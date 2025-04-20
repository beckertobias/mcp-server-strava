import { Request, Response } from 'express';
import { stravaService } from '../services/strava.service.js';

export const stravaController = {
  // Redirect user to Strava authorization
  authorize: (_req: Request, res: Response) => {
    const authUrl = stravaService.getAuthUrl();
    res.redirect(authUrl);
  },

  // Handle callback from Strava with authorization code
  handleCallback: async (req: Request, res: Response) => {
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    try {
      await stravaService.getTokens(code);
      res.redirect('/activities'); // Redirect to the activities page
    } catch (error) {
      console.error('Callback error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  },

  // Get user activities
  getActivities: async (req: Request, res: Response) => {
    if (!stravaService.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated', authUrl: stravaService.getAuthUrl() });
    }

    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 30;

    try {
      const activities = await stravaService.getActivities(page, perPage);
      res.json(activities);
    } catch (error) {
      console.error('Activities error:', error);
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  },
  // Logout user
  logout: (req: Request, res: Response) => {
    stravaService.logout();
    res.json({ message: 'Logged out successfully' });
  },

  // Check authentication status
  checkAuth: (req: Request, res: Response) => {
    res.json({ 
      authenticated: stravaService.isAuthenticated(),
      authUrl: !stravaService.isAuthenticated() ? stravaService.getAuthUrl() : null
    });
  }
};