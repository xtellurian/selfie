// Cloudflare Worker for Selfie Frontend

interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle API routes for future backend integration
    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, url);
    }

    // Serve static assets and handle SPA routing
    return env.ASSETS.fetch(request);
  },
};

async function handleApiRequest(_request: Request, url: URL): Promise<Response> {
  // Future API endpoints for Selfie MCP server integration
  
  if (url.pathname === "/api/health") {
    return Response.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "Selfie Frontend Worker",
      version: "1.0.0"
    });
  }

  if (url.pathname === "/api/agents/status") {
    // Mock agent status - can be connected to real MCP server later
    return Response.json({
      agents: [
        { name: "initializer", status: "monitoring", lastSeen: new Date().toISOString() },
        { name: "developer", status: "available", lastSeen: new Date().toISOString() },
        { name: "reviewer", status: "idle", lastSeen: new Date().toISOString() },
        { name: "tester", status: "idle", lastSeen: new Date().toISOString() }
      ],
      totalAgents: 4,
      activeConnections: 2
    });
  }

  return Response.json(
    { error: "API endpoint not found" },
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}