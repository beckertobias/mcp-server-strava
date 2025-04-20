# Strava MCP Server

A Mission Control Protocol (MCP) server for integrating Strava with Claude Desktop.

## Features

- Connect to Strava via OAuth
- Fetch activities data from Strava API
- Persist authentication between sessions
- Standard MCP protocol integration

## Prerequisites

- Node.js (16+)
- npm or yarn
- Strava API credentials

## Setup

1. Clone the repository:

```bash
git clone https://github.com/beckertobias/mcp-server-strava.git
cd mcp-server-strava
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with your Strava API credentials:

```
PORT=3000
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
REDIRECT_URI=http://localhost:3000/strava/callback
```

4. Build the server:

```bash
npm run build
```

## Running the Server

There are two components to this server:

1. The MCP server that communicates with Claude via stdio
2. The HTTP server that handles OAuth callbacks

Both components are started automatically when you run:

```bash
npm start
```

## Integrating with Claude Desktop

1. Open Claude Desktop
2. Edit the Claude configuration file:

   - On macOS/Linux: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - On Windows: `%APPDATA%\Claude\claude_desktop_config.json`

3. Add the MCP server configuration:

```json
{
  "mcpServers": {
    "strava": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-server-strava/dist/index.js"
      ]
    }
  }
}
```

Replace `/absolute/path/to/mcp-server-strava` with the actual absolute path to your project directory.

4. Save the file and restart Claude Desktop.

## Authentication

1. Visit `http://localhost:3000/status` in your browser to check the server status.
2. Click "Login with Strava" to authenticate.
3. Once authenticated, you can use Claude Desktop to interact with your Strava data.

## Available Commands

When talking to Claude, you can use these capabilities:

- `get_latest_activities`: Fetches your most recent Strava activities.
- `get_authentication_url`: Gets the URL to authenticate with Strava.
- `is_authenticated`: Checks if you're authenticated with Strava.

## Example Prompts for Claude

- "Show me my latest Strava activities"
- "Am I connected to Strava? If not, how do I connect?"
- "What was my most recent run?"

## Troubleshooting

If you have issues connecting Claude Desktop to the MCP server:

1. Check that the MCP server is running (`npm start`)
2. Verify the path in your Claude Desktop configuration is correct
3. Make sure the `chmod +x` permissions were set correctly
4. Check the HTTP server is running by visiting `http://localhost:3000/status`
5. Look for any errors in the terminal where you started the server

## Development

### Project Structure

```
src/
  ├── config/               # Configuration settings
  ├── mcp/                  # MCP server implementation
  ├── services/             # Business logic
  ├── types/                # TypeScript type definitions
  ├── index.ts              # MCP server entry point
  └── server.ts             # HTTP server for OAuth
```

### Running in Development Mode

```bash
npm run dev
```