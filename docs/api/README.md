# API Documentation

The VRM Platform provides a comprehensive RESTful API for managing agents, calls, knowledge bases, and analytics. This documentation covers all available endpoints, authentication, and usage examples.

## Base URL

```
Development: http://localhost:3001/api/v1
Production: https://api.vrm-platform.com/api/v1
```

## Authentication

All API requests require authentication using JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Getting an Access Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user"
  }
}
```

## API Endpoints Overview

| Resource | Endpoint | Description |
|----------|----------|-------------|
| [Authentication](./authentication.md) | `/auth/*` | User authentication and management |
| [Agents](./agents.md) | `/agents/*` | AI agent creation and management |
| [Calls](./calls.md) | `/calls/*` | Call handling and analytics |
| [Knowledge Base](./knowledge-base.md) | `/knowledge-bases/*` | Knowledge management |
| [MCPs](./mcps.md) | `/mcps/*` | Model-Context-Protocol integration |
| [Metrics](./metrics.md) | `/metrics/*` | Custom metrics and analytics |

## Common Response Formats

### Success Response
```json
{
  "data": { ... },
  "status": 200,
  "message": "Success"
}
```

### Error Response
```json
{
  "message": "Error description",
  "status": 400,
  "details": {
    "field": "validation error"
  }
}
```

## Rate Limiting

API requests are rate limited to ensure fair usage:

- **General endpoints:** 100 requests per 15 minutes per IP
- **Authentication endpoints:** 5 requests per 15 minutes per IP
- **Upload endpoints:** 5 requests per minute per IP

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid request format |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Pagination

List endpoints support pagination using query parameters:

```http
GET /agents?limit=20&offset=0
```

**Parameters:**
- `limit`: Number of items per page (default: 50, max: 100)
- `offset`: Number of items to skip (default: 0)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150,
    "hasMore": true
  }
}
```

## Filtering and Sorting

Many endpoints support filtering and sorting:

```http
GET /calls?status=completed&sort=created_at&order=desc
```

**Common Parameters:**
- `sort`: Field to sort by
- `order`: Sort order (`asc` or `desc`)
- Various filter parameters specific to each endpoint

## Webhooks

The platform supports webhooks for real-time notifications:

```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["call.completed", "agent.created"],
  "secret": "your_webhook_secret"
}
```

**Supported Events:**
- `call.started`
- `call.completed`
- `call.failed`
- `agent.created`
- `agent.updated`
- `agent.deployed`

## SDK and Libraries

Official SDKs are available for popular programming languages:

- **JavaScript/TypeScript:** `@vrm-platform/js-sdk`
- **Python:** `vrm-platform-python`
- **Go:** `github.com/vrm-platform/go-sdk`

### JavaScript SDK Example

```javascript
import { VRMClient } from '@vrm-platform/js-sdk';

const client = new VRMClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.vrm-platform.com/api/v1'
});

// Create an agent
const agent = await client.agents.create({
  name: 'Customer Support Agent',
  identity: 'Helpful customer service representative',
  voice: 'sarah'
});

// Start a call
const call = await client.calls.start({
  agentId: agent.id,
  customerInfo: {
    email: 'customer@example.com'
  }
});
```

## Testing

### Postman Collection

Import our Postman collection for easy API testing:
[Download VRM Platform API Collection](./postman/VRM-Platform-API.postman_collection.json)

### cURL Examples

Basic authentication:
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

Create an agent:
```bash
curl -X POST http://localhost:3001/api/v1/agents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales Assistant",
    "identity": "Friendly sales representative",
    "voice": "alex"
  }'
```

## Support

For API support:
- Check the [FAQ](./faq.md)
- Join our [Discord community](https://discord.gg/vrm-platform)
- Email: api-support@vrm-platform.com

---

*API Documentation last updated: January 2025*