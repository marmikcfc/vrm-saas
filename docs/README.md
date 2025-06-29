# VRM Platform Documentation

Welcome to the Virtual Relationship Manager (VRM) Platform documentation. This comprehensive guide will help you understand the architecture, APIs, data flow, and core objectives of our platform.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Data Flow](#data-flow)
- [Development Guide](#development-guide)
- [Deployment](#deployment)

## Overview

The VRM Platform is a comprehensive solution that enables businesses to build intelligent Virtual Relationship Managers. These AI-powered agents help customers activate quickly, reduce onboarding time, and accelerate their journey through the conversion funnel.

### What We're Building

Our platform provides:

1. **AI-Powered Voice Agents** - Intelligent conversational agents that can handle customer interactions
2. **Knowledge Management** - Centralized knowledge bases that agents can access and learn from
3. **MCP Integration** - Model-Context-Protocol support for connecting external APIs and tools
4. **Analytics & Insights** - Comprehensive tracking and analysis of customer interactions
5. **Customizable Workflows** - Flexible agent configuration and deployment options

### Core Value Proposition

- **Faster Customer Activation** - Reduce time-to-value for new customers
- **Reduced Onboarding Friction** - Streamline the customer journey with intelligent assistance
- **Accelerated Funnel Progression** - Move customers through conversion stages more efficiently
- **Scalable Support** - Handle multiple customer interactions simultaneously
- **Data-Driven Insights** - Understand customer behavior and optimize experiences

## Architecture

The VRM Platform follows a modern, scalable architecture with clear separation of concerns.

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth System   │    │   AI Services   │    │   File Storage  │
│   (Supabase)    │    │   (OpenAI/etc)  │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation
- React Query for data fetching

**Backend:**
- Node.js with Express
- Supabase for database and authentication
- RESTful API design
- JWT-based authentication

**Database:**
- PostgreSQL (via Supabase)
- Row Level Security (RLS)
- Real-time subscriptions

**AI & Voice:**
- OpenAI for language models
- Deepgram for speech-to-text
- Cartesia for text-to-speech
- Custom voice processing pipeline

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```

4. Configure your environment variables
5. Run the development servers:
   ```bash
   npm run dev:full
   ```

### Environment Setup

See [Environment Setup Guide](./environment-setup.md) for detailed configuration instructions.

## API Documentation

Our API follows RESTful principles and provides comprehensive endpoints for all platform functionality.

### Base URL
```
Development: http://localhost:3001/api/v1
Production: https://api.vrm-platform.com/api/v1
```

### Authentication

All API requests require authentication via JWT tokens:

```http
Authorization: Bearer <jwt_token>
```

### Core Endpoints

See detailed API documentation:
- [Authentication API](./api/authentication.md)
- [Agents API](./api/agents.md)
- [Calls API](./api/calls.md)
- [Knowledge Base API](./api/knowledge-base.md)
- [MCPs API](./api/mcps.md)
- [Metrics API](./api/metrics.md)

## Data Flow

Understanding how data flows through the VRM platform is crucial for development and troubleshooting.

### User Journey Flow

```
User Registration → Agent Creation → Knowledge Base Setup → MCP Integration → Live Calls → Analytics
```

### Call Processing Flow

```
Incoming Call → Agent Selection → Context Loading → AI Processing → Response Generation → Action Execution → Logging
```

### Data Architecture

See [Data Architecture Guide](./data-architecture.md) for detailed information about:
- Database schema
- Data relationships
- Security policies
- Performance considerations

## Development Guide

### Project Structure

```
vrm-platform/
├── docs/                 # Documentation
├── src/                  # Frontend source code
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── stores/          # State management
│   ├── lib/             # Utility libraries
│   └── utils/           # Helper functions
├── server/              # Backend source code
│   ├── src/
│   │   ├── routes/      # API route handlers
│   │   ├── middleware/  # Express middleware
│   │   └── config/      # Configuration files
└── supabase/           # Database migrations and functions
    └── migrations/      # SQL migration files
```

### Development Workflow

1. **Feature Development**
   - Create feature branch
   - Implement frontend and backend changes
   - Add tests
   - Update documentation

2. **Code Standards**
   - TypeScript for type safety
   - ESLint for code quality
   - Prettier for formatting
   - Conventional commits

3. **Testing Strategy**
   - Unit tests for utilities
   - Integration tests for API endpoints
   - E2E tests for critical user flows

### Contributing

See [Contributing Guide](./contributing.md) for detailed information about:
- Code style guidelines
- Pull request process
- Testing requirements
- Documentation standards

## Deployment

### Production Deployment

The platform is designed for cloud deployment with the following recommended setup:

**Frontend:**
- Vercel or Netlify for static hosting
- CDN for global distribution
- Environment-specific configurations

**Backend:**
- Railway, Render, or similar Node.js hosting
- Auto-scaling capabilities
- Health monitoring

**Database:**
- Supabase managed PostgreSQL
- Automated backups
- Connection pooling

### Environment Configuration

See [Deployment Guide](./deployment.md) for step-by-step deployment instructions.

## Support

For questions, issues, or contributions:

1. Check existing documentation
2. Search GitHub issues
3. Create new issue with detailed description
4. Join our Discord community

---

*This documentation is continuously updated. Last updated: January 2025*