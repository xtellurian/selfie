# Deployment Guide - Selfie Frontend Worker

## Quick Start

### 1. Prerequisites
- Cloudflare account (free tier works)
- Node.js 18+
- npm or yarn

### 2. Setup
```bash
cd cloudflare-worker
npm install
```

### 3. Local Development
```bash
npm run dev
```
Visit: `http://localhost:8787`

### 4. Deploy to Cloudflare
```bash
# First login to Cloudflare (one-time setup)
npx wrangler login

# Deploy
npm run deploy
```

## Configuration

### Environment Variables
Edit `wrangler.jsonc` to add environment variables:

```jsonc
{
  "vars": {
    "ENVIRONMENT": "production",
    "MCP_SERVER_URL": "https://your-mcp-server.com"
  }
}
```

### Custom Domain
After deployment, configure a custom domain in the Cloudflare dashboard:

1. Go to Workers & Pages → your-worker → Settings → Triggers
2. Add custom domain (requires domain managed by Cloudflare)

## Testing

### Local Testing
```bash
npm run dev
```

Test endpoints:
- Frontend: `http://localhost:8787`
- Health: `http://localhost:8787/api/health`
- Agents: `http://localhost:8787/api/agents/status`

### Remote Testing
```bash
npm run preview
```

## Integration with Selfie MCP Server

To connect this frontend with your Selfie MCP server:

1. **Update API endpoints** in `src/index.ts`
2. **Add MCP client code** for real agent status
3. **Configure environment variables** for MCP server URL
4. **Deploy updates** with `npm run deploy`

Example MCP integration:
```typescript
// In src/index.ts
if (url.pathname === "/api/agents/status") {
  // Connect to actual MCP server
  const mcpResponse = await fetch(env.MCP_SERVER_URL + "/agents");
  return mcpResponse;
}
```

## Performance Monitoring

- **Cloudflare Analytics**: Available in dashboard after deployment
- **Worker Logs**: `npx wrangler tail` for real-time logs
- **Performance Metrics**: Built-in observability in `wrangler.jsonc`

## Troubleshooting

### Common Issues

**Build Errors:**
```bash
npm run build  # Should show "No build step required"
```

**Type Errors:**
```bash
npx tsc --noEmit  # Check TypeScript issues
```

**Deployment Issues:**
```bash
npx wrangler whoami  # Check authentication
npx wrangler deploy --dry-run  # Test deployment config
```

### Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Community Discord](https://discord.cloudflare.com)