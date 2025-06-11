# Selfie Frontend - Cloudflare Worker

A Cloudflare Worker implementation of the Selfie Frontend interface, serving the agentic build system dashboard as a fast, globally distributed web application.

## Features

- ✅ **Single Page Application** with client-side routing
- ✅ **Static Asset Optimization** via Cloudflare's edge network
- ✅ **API-Ready Backend** for future MCP server integration
- ✅ **Real-time Agent Monitoring** with status dashboards
- ✅ **Responsive Design** with modern animations and styling
- ✅ **Health Check Endpoints** for system monitoring

## Project Structure

```
cloudflare-worker/
├── src/
│   └── index.ts          # Main Worker logic and API endpoints
├── public/
│   └── index.html        # Frontend application with web components
├── wrangler.jsonc        # Cloudflare Worker configuration
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Cloudflare account (for deployment)

### Installation

1. **Install dependencies:**
   ```bash
   cd cloudflare-worker
   npm install
   ```

2. **Start local development:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:8787`

3. **Deploy to Cloudflare:**
   ```bash
   npm run deploy
   ```

### Available Scripts

- `npm run dev` - Start local development server
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run preview` - Test deployment in remote Cloudflare environment
- `npm run build` - No-op (static assets don't require build)

## API Endpoints

The Worker provides several API endpoints for system integration:

### `/api/health`
- **Method:** GET
- **Response:** System health and version information
- **Example:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2025-01-06T12:00:00.000Z",
    "service": "Selfie Frontend Worker",
    "version": "1.0.0"
  }
  ```

### `/api/agents/status`
- **Method:** GET  
- **Response:** Status of all Selfie agents
- **Example:**
  ```json
  {
    "agents": [
      {
        "name": "initializer",
        "status": "monitoring", 
        "lastSeen": "2025-01-06T12:00:00.000Z"
      }
    ],
    "totalAgents": 4,
    "activeConnections": 2
  }
  ```

## Frontend Components

### Alice's Dashboard (`<alice-page>`)
- System health monitoring
- Agent status overview
- MCP connection tracking
- Development task management interface

### Bob's Coordination Center (`<bob-page>`)
- Multi-agent coordination dashboard
- Real-time agent status grid
- System performance metrics
- Task queue management

## Architecture

### Worker (Backend)
- **Static Asset Serving:** Efficiently serves the frontend via Cloudflare's edge
- **API Layer:** Provides endpoints for system status and agent coordination
- **SPA Routing:** Handles client-side navigation with proper fallbacks
- **Future Integration:** Ready for MCP server and Selfie agent connections

### Frontend (Browser)
- **Web Components:** Modern, encapsulated components using native browser APIs
- **Client-side Routing:** Seamless navigation between Alice and Bob interfaces
- **Real-time Updates:** Periodic health checks and status updates
- **Responsive Design:** Mobile-friendly interface with smooth animations

## Integration with Selfie System

This Worker is designed to integrate with the broader Selfie ecosystem:

- **MCP Server:** API endpoints ready for Model Context Protocol integration
- **Agent Coordination:** Dashboard for monitoring distributed Selfie instances  
- **GitHub Integration:** Future support for issue tracking and PR management
- **Real-time Updates:** WebSocket support can be added for live agent communication

## Customization

### Adding New API Endpoints

Edit `src/index.ts` and add new routes in the `handleApiRequest` function:

```typescript
if (url.pathname === "/api/your-endpoint") {
  return Response.json({ data: "your response" });
}
```

### Modifying the Frontend

The main frontend code is in `public/index.html`. The application uses:
- Native Web Components for modularity
- CSS Grid and Flexbox for layouts  
- Fetch API for backend communication
- History API for client-side routing

### Environment Configuration

Configure environment variables in `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "ENVIRONMENT": "production",
    "MCP_SERVER_URL": "your-mcp-server"
  }
}
```

## Performance

- **Global Edge Distribution:** Static assets served from 300+ Cloudflare locations
- **Zero Cold Start:** Workers start instantly with no container overhead
- **Optimized Caching:** Automatic asset optimization and intelligent caching
- **Minimal Bundle Size:** No framework overhead, just native web APIs

## Security

- **CORS Handling:** Proper cross-origin request management
- **Input Validation:** All API inputs validated and sanitized
- **Rate Limiting:** Can be configured via Cloudflare dashboard
- **HTTPS Only:** All traffic encrypted by default

## Deployment

The Worker can be deployed to Cloudflare with zero configuration:

```bash
npm run deploy
```

This will:
1. Upload the Worker code to Cloudflare's edge network
2. Deploy static assets to Cloudflare's CDN
3. Configure routing and domain mapping
4. Enable observability and monitoring

Your Selfie Frontend will be live at `https://selfie-frontend.your-subdomain.workers.dev`

## Future Enhancements

- [ ] WebSocket support for real-time agent communication
- [ ] Authentication integration with GitHub/OAuth
- [ ] Advanced agent coordination features
- [ ] Performance metrics dashboard
- [ ] A/B testing for UI improvements
- [ ] Integration with Selfie MCP server
- [ ] Mobile app companion via PWA features