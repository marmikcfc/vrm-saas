# Getting Started with VRM Platform

This guide will help you set up the VRM Platform for development and understand the core concepts needed to build effective Virtual Relationship Managers.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm or yarn** - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- **Code Editor** - We recommend VS Code

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/vrm-platform.git
cd vrm-platform
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Environment Setup

Copy the environment files and configure them:

```bash
# Frontend environment
cp .env.example .env

# Backend environment
cp server/.env.example server/.env
```

### 4. Configure Environment Variables

Edit `.env` file:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Custom redirect URLs
VITE_AUTH_REDIRECT_URL=http://localhost:5173
```

Edit `server/.env` file:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 5. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API to get your keys
3. Run the database migrations:
   ```bash
   npx supabase db push
   ```

### 6. Start Development Servers

```bash
# Start both frontend and backend
npm run dev:full

# Or start them separately
npm run dev          # Frontend only
npm run dev:backend  # Backend only
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Core Concepts

### 1. Virtual Relationship Managers (VRMs)

VRMs are AI-powered agents that help customers through their journey. They can:
- Answer questions about your product/service
- Guide users through onboarding processes
- Collect feedback and route to appropriate teams
- Provide personalized recommendations

### 2. Agent Configuration

Each agent has several key components:

**Identity & Persona:**
- Name and description
- Personality traits
- Communication style
- Domain expertise

**Voice Settings:**
- Voice selection (Sarah, Alex, Emma, James)
- Speech patterns and tone
- Response timing

**Knowledge Base:**
- Product documentation
- FAQs and support articles
- Training materials
- Custom knowledge sources

**Conversation Flow:**
- System prompts for behavior
- Introduction scripts
- Fallback responses
- Escalation procedures

### 3. Knowledge Management

The platform supports various knowledge sources:

**Document Types:**
- PDF documents
- Web pages and URLs
- Video content
- Structured data (JSON/YAML)

**Organization:**
- Category-based organization
- Tagging and metadata
- Version control
- Access permissions

### 4. MCP Integration

Model-Context-Protocol (MCP) allows agents to interact with external systems:

**Supported Integrations:**
- CRM systems (Salesforce, HubSpot)
- Support platforms (Zendesk, Intercom)
- E-commerce platforms (Shopify, WooCommerce)
- Custom APIs via OpenAPI specifications

## Your First Agent

Let's create a simple customer support agent:

### Step 1: Create the Agent

1. Navigate to the Agents page
2. Click "Create Agent"
3. Fill in the basic information:
   - **Name:** "Customer Support Assistant"
   - **Identity:** "Friendly and helpful customer service representative"
   - **Voice:** Select "Sarah" for a professional tone

### Step 2: Configure Prompts

**System Prompt:**
```
You are a helpful customer service representative for [Your Company]. 
You should be friendly, professional, and always try to resolve customer issues. 
If you cannot help with something, politely direct them to human support.
```

**Introduction Prompt:**
```
Hello! I'm your virtual assistant. I'm here to help you with any questions 
about our products or services. How can I assist you today?
```

**Fallback Prompt:**
```
I'm sorry, I didn't quite understand that. Could you please rephrase your 
question or let me know how else I can help you?
```

### Step 3: Add Knowledge

1. Go to Knowledge Base
2. Create a new knowledge base called "Customer Support"
3. Upload your FAQ documents or add URLs to your help center

### Step 4: Test Your Agent

1. Use the built-in test interface
2. Try various customer scenarios
3. Refine prompts based on responses
4. Adjust knowledge base as needed

## Development Workflow

### 1. Feature Development

When adding new features:

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/agent-analytics
   ```

2. **Make your changes:**
   - Update frontend components
   - Add backend API endpoints
   - Update database schema if needed

3. **Test thoroughly:**
   - Unit tests for utilities
   - Integration tests for APIs
   - Manual testing in browser

4. **Submit for review:**
   ```bash
   git add .
   git commit -m "feat: add agent analytics dashboard"
   git push origin feature/agent-analytics
   ```

### 2. Database Changes

For database schema changes:

1. **Create migration file:**
   ```bash
   npx supabase migration new add_agent_analytics
   ```

2. **Write SQL migration:**
   ```sql
   -- Add analytics table
   CREATE TABLE agent_analytics (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     agent_id uuid REFERENCES agents(id),
     metric_name text NOT NULL,
     metric_value numeric,
     recorded_at timestamptz DEFAULT now()
   );
   ```

3. **Apply migration:**
   ```bash
   npx supabase db push
   ```

### 3. API Development

When adding new API endpoints:

1. **Define route in server/src/routes/:**
   ```javascript
   router.get('/analytics/:agentId', authenticateToken, async (req, res) => {
     // Implementation
   });
   ```

2. **Add to API client:**
   ```javascript
   export const analyticsApi = {
     getAgentAnalytics: (agentId) => apiClient.get(`/analytics/${agentId}`)
   };
   ```

3. **Create React hook:**
   ```javascript
   export function useAgentAnalytics(agentId) {
     return useQuery(['analytics', agentId], () => 
       analyticsApi.getAgentAnalytics(agentId)
     );
   }
   ```

## Best Practices

### 1. Agent Design

**Effective Personas:**
- Be specific about personality traits
- Define clear boundaries and capabilities
- Use consistent tone and language
- Test with real user scenarios

**Knowledge Organization:**
- Keep information current and accurate
- Use clear, concise language
- Organize by user intent
- Include examples and use cases

### 2. Performance Optimization

**Frontend:**
- Use React.memo for expensive components
- Implement proper loading states
- Optimize images and assets
- Use code splitting for large features

**Backend:**
- Implement proper caching strategies
- Use database indexes effectively
- Monitor API response times
- Handle errors gracefully

### 3. Security

**Authentication:**
- Always validate user permissions
- Use secure session management
- Implement proper logout procedures
- Monitor for suspicious activity

**Data Protection:**
- Encrypt sensitive data
- Implement proper backup procedures
- Follow data retention policies
- Audit access logs regularly

## Troubleshooting

### Common Issues

**Environment Variables Not Loading:**
- Ensure `.env` files are in correct locations
- Restart development servers after changes
- Check for typos in variable names

**Database Connection Issues:**
- Verify Supabase credentials
- Check network connectivity
- Ensure RLS policies are correct

**API Errors:**
- Check server logs for detailed errors
- Verify authentication tokens
- Ensure proper request formatting

### Getting Help

1. **Check Documentation:** Review relevant docs sections
2. **Search Issues:** Look for similar problems in GitHub issues
3. **Community Support:** Join our Discord community
4. **Create Issue:** Submit detailed bug reports with reproduction steps

## Next Steps

Now that you have the platform running:

1. **Explore the Dashboard:** Familiarize yourself with all features
2. **Create Test Agents:** Experiment with different configurations
3. **Review API Documentation:** Understand available endpoints
4. **Join the Community:** Connect with other developers
5. **Contribute:** Help improve the platform

---

Welcome to the VRM Platform! We're excited to see what you'll build.