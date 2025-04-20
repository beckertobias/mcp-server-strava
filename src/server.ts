import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import stravaRoutes from './routes/strava.routes.js';
import { stravaService } from './services/strava.service.js';

export function startHttpServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes - Use the general strava routes
  app.use('/strava', stravaRoutes);

  // Basic route for testing
  app.get('/', (req, res) => {
    res.send('Strava MCP Server - HTTP interface for OAuth');
  });

  // Add status page
  app.get('/status', (req, res) => {
    res.send(`
      <h1>Strava MCP Server Status</h1>
      <p>The HTTP server for OAuth is running at <a href="http://localhost:${config.port}">http://localhost:${config.port}</a></p>
      <p>The MCP server should be configured in Claude Desktop's configuration.</p>
      <p>Authentication status: <span id="auth-status">Checking...</span></p>
      <div id="auth-buttons"></div>
      <script>
        fetch('/strava/status')
          .then(response => response.json())
          .then(data => {
            const statusEl = document.getElementById('auth-status');
            const buttonsEl = document.getElementById('auth-buttons');
            
            if (data.authenticated) {
              statusEl.textContent = 'Authenticated';
              statusEl.style.color = 'green';
              buttonsEl.innerHTML = '<button onclick="logout()">Logout</button>';
            } else {
              statusEl.textContent = 'Not authenticated';
              statusEl.style.color = 'red';
              buttonsEl.innerHTML = '<a href="/strava/auth"><button>Login with Strava</button></a>';
            }
          })
          .catch(error => {
            console.error('Error checking auth status:', error);
            document.getElementById('auth-status').textContent = 'Error checking status';
            document.getElementById('auth-status').style.color = 'red';
          });
          
        function logout() {
          fetch('/strava/logout')
            .then(response => response.json())
            .then(() => {
              window.location.reload();
            })
            .catch(error => {
              console.error('Error logging out:', error);
            });
        }
      </script>
    `);
  });

  // Start server
  app.listen(config.port, () => {
    console.log(`HTTP server running at http://localhost:${config.port}`);
    console.log(`Visit http://localhost:${config.port}/status to check authentication status`);
  });
}