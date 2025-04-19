import express from 'express';
import cors from 'cors';
import { config } from './config';
import stravaRoutes from './routes/strava.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/strava', stravaRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Strava MCP Server is running');
});

// Redirect to activities
app.get('/activities', (req, res) => {
    res.send(`
      <h1>Strava Activities</h1>
      <div id="activities-container">Loading...</div>
      <script>
        fetch('/strava/status')
          .then(response => response.json())
          .then(data => {
            if (!data.authenticated) {
              window.location.href = data.authUrl;
              return;
            }
            
            fetch('/strava/activities')
              .then(response => response.json())
              .then(activities => {
                const container = document.getElementById('activities-container');
                if (activities.length === 0) {
                  container.innerHTML = '<p>No activities found</p>';
                  return;
                }
                
                container.innerHTML = '<ul>' + 
                  activities.map(activity => 
                    '<li>' + 
                      '<strong>' + activity.name + '</strong> - ' + 
                      activity.type + ' on ' + new Date(activity.start_date).toLocaleDateString() + ', ' + 
                      (activity.distance / 1000).toFixed(2) + ' km' +
                    '</li>'
                  ).join('') + 
                  '</ul>';
              })
              .catch(error => {
                console.error('Error fetching activities:', error);
                document.getElementById('activities-container').innerHTML = 
                  '<p>Error loading activities</p>';
              });
          })
          .catch(error => {
            console.error('Error checking auth status:', error);
          });
      </script>
    `);
  });
  
  // Start server
  app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
  });