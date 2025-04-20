import express from 'express';
import { stravaController } from '../controllers/strava.controller.js';

const router = express.Router();

// Auth routes
router.get('/auth', stravaController.authorize);
router.get('/callback', async (req, res) => {
  await stravaController.handleCallback(req, res);
});
router.get('/logout', stravaController.logout);
router.get('/status', stravaController.checkAuth);

// Data routes
router.get('/activities', async (req, res) => {
  await stravaController.getActivities(req, res);
});

export default router;