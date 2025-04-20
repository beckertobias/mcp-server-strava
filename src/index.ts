#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from 'axios';
import { config } from './config/index.js';
import { stravaService } from './services/strava.service.js';
import fs from 'fs';
import path from 'path';
import { UserSession } from './types/strava.types.js';

// Constants for session storage
const DATA_DIR = path.join(process.cwd(), 'data');
const SESSION_FILE_PATH = path.join(DATA_DIR, 'session.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load session from disk if exists
try {
  if (fs.existsSync(SESSION_FILE_PATH)) {
    const sessionData = fs.readFileSync(SESSION_FILE_PATH, 'utf-8');
    const session = JSON.parse(sessionData) as UserSession;
    stravaService.setSession(session);
  }
} catch (error) {
  console.error('Error loading saved session:', error);
}

// Create server instance
const server = new McpServer({
  name: "strava-integration",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register Strava tools/commands
server.tool(
  "get_latest_activities",
  "Get the latest Strava activities",
  {
    count: z.number().optional().describe("Number of activities to retrieve (default: 10)"),
  },
  async ({ count = 10 }) => {
    try {
      if (!stravaService.isAuthenticated()) {
        return {
          content: [
            {
              type: "text",
              text: `Not authenticated with Strava. Please authenticate using this URL: ${stravaService.getAuthUrl()}`,
            },
          ],
        };
      }

      const activities = await stravaService.getActivities(1, count);
      
      const formattedActivities = activities.map(activity => ({
        id: activity.id,
        name: activity.name,
        type: activity.type,
        date: activity.start_date,
        distance_km: (activity.distance / 1000).toFixed(2),
        duration_minutes: Math.floor(activity.moving_time / 60),
        elevation_gain_m: activity.total_elevation_gain
      }));
      
      const activitiesText = `Latest ${formattedActivities.length} Strava activities:\n\n` + 
        formattedActivities.map(act => 
          `Name: ${act.name}\n` +
          `Type: ${act.type}\n` +
          `Date: ${new Date(act.date).toLocaleDateString()}\n` +
          `Distance: ${act.distance_km} km\n` +
          `Duration: ${act.duration_minutes} minutes\n` +
          `Elevation Gain: ${act.elevation_gain_m} m\n` +
          `---`
        ).join('\n\n');

      return {
        content: [
          {
            type: "text",
            text: activitiesText,
          },
        ],
      };
    } catch (error) {
      console.error('Error fetching activities:', error);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching activities: ${error}`,
          },
        ],
      };
    }
  },
);

server.tool(
  "get_authentication_url",
  "Get the Strava authentication URL",
  {},
  async () => {
    const authUrl = stravaService.getAuthUrl();
    return {
      content: [
        {
          type: "text",
          text: `To authenticate with Strava, please visit: ${authUrl}`,
        },
      ],
    };
  },
);

server.tool(
  "is_authenticated",
  "Check if user is authenticated with Strava",
  {},
  async () => {
    const isAuthenticated = stravaService.isAuthenticated();
    return {
      content: [
        {
          type: "text",
          text: isAuthenticated 
            ? "You are authenticated with Strava." 
            : `You are not authenticated with Strava. To authenticate, please visit: ${stravaService.getAuthUrl()}`,
        },
      ],
    };
  },
);

// Hook into session changes to persist authentication
const originalSetSession = stravaService.setSession;
stravaService.setSession = function(session: UserSession | null) {
  originalSetSession.call(this, session);
  if (session) {
    fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(session));
  } else {
    // Remove session file on logout
    if (fs.existsSync(SESSION_FILE_PATH)) {
      fs.unlinkSync(SESSION_FILE_PATH);
    }
  }
};

// Start the server
async function main() {
  // Also start the regular HTTP server for OAuth callback handling
  import('./server.js').then(({ startHttpServer }) => {
    startHttpServer();
  });

  // Start the MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Strava MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});