# Deployment Guide

This guide covers deploying the VRM Platform to production environments, including recommended hosting providers, configuration, and best practices.

## Deployment Architecture

### Recommended Production Setup

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Edge      │    │   Load Balancer │    │   App Servers   │
│   (Cloudflare)  │◄──►│   (Railway)     │◄──►│   (Railway)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Static Assets │    │   Database      │    │   File Storage  │
│   (Vercel)      │    │   (Supabase)    │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Frontend Deployment

### Option 1: Vercel (Recommended)

Vercel provides excellent React deployment with automatic builds and global CDN.

#### Setup Steps

1. **Connect Repository:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy from project root
   vercel
   ```

2. **Configure Build Settings:**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "installCommand": "npm install"
   }
   ```

3. **Environment Variables:**
   Add in Vercel dashboard:
   ```
   VITE_SUPABASE_URL=your_production_supabase_url
   VITE_SUPABASE_ANON_KEY=your_production_anon_key
   VITE_API_BASE_URL=https://your-api.railway.app/api/v1
   ```

4. **Custom Domain:**
   - Add domain in Vercel dashboard
   - Configure DNS records
   - SSL certificates are automatic

### Option 2: Netlify

Alternative static hosting with similar features.

#### Setup Steps

1. **Build Configuration:**
   Create `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [build.environment]
     NODE_VERSION = "18"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy:**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Deploy
   netlify deploy --prod
   ```

## Backend Deployment

### Option 1: Railway (Recommended)

Railway provides excellent Node.js hosting with automatic deployments.

#### Setup Steps

1. **Connect Repository:**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Select the `server` directory as root

2. **Configure Build:**
   Railway auto-detects Node.js projects. Create `railway.toml`:
   ```toml
   [build]
     builder = "NIXPACKS"
   
   [deploy]
     startCommand = "npm start"
     restartPolicyType = "ON_FAILURE"
     restartPolicyMaxRetries = 10
   ```

3. **Environment Variables:**
   Set in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=3001
   SUPABASE_URL=your_production_supabase_url
   SUPABASE_ANON_KEY=your_production_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
   ```

4. **Custom Domain:**
   - Add domain in Railway dashboard
   - Configure DNS CNAME record
   - SSL certificates are automatic

### Option 2: Render

Alternative hosting with similar features.

#### Setup Steps

1. **Create Web Service:**
   - Connect GitHub repository
   - Set build command: `cd server && npm install`
   - Set start command: `cd server && npm start`

2. **Environment Variables:**
   Configure in Render dashboard with same variables as Railway.

### Option 3: Docker Deployment

For custom hosting environments.

#### Dockerfile

Create `server/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  api:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Database Setup

### Supabase Production

1. **Create Production Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Choose appropriate region
   - Select Pro plan for production

2. **Configure Database:**
   ```sql
   -- Enable necessary extensions
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```

3. **Run Migrations:**
   ```bash
   # Set production environment
   export SUPABASE_URL=your_production_url
   export SUPABASE_ANON_KEY=your_production_key
   
   # Run migrations
   npx supabase db push
   ```

4. **Configure Security:**
   - Enable RLS on all tables
   - Set up proper policies
   - Configure API rate limiting
   - Enable audit logging

## Environment Configuration

### Production Environment Variables

#### Frontend (.env.production)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE_URL=https://your-api.railway.app/api/v1
VITE_ENVIRONMENT=production
```

#### Backend (server/.env.production)
```env
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Keys (encrypted)
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
CARTESIA_API_KEY=your_cartesia_key

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

## SSL/TLS Configuration

### Automatic SSL (Recommended)

Most hosting providers (Vercel, Railway, Netlify) provide automatic SSL certificates.

### Custom SSL

For custom domains or self-hosted deployments:

1. **Let's Encrypt with Certbot:**
   ```bash
   # Install certbot
   sudo apt-get install certbot
   
   # Generate certificate
   sudo certbot certonly --standalone -d your-domain.com
   ```

2. **Configure Nginx:**
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;
       
       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## Monitoring and Logging

### Application Monitoring

#### Sentry Integration

1. **Install Sentry:**
   ```bash
   npm install @sentry/node @sentry/react
   ```

2. **Configure Backend:**
   ```javascript
   import * as Sentry from '@sentry/node';
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
   });
   ```

3. **Configure Frontend:**
   ```javascript
   import * as Sentry from '@sentry/react';
   
   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     environment: import.meta.env.VITE_ENVIRONMENT,
   });
   ```

### Health Checks

#### Backend Health Endpoint

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});
```

#### Monitoring Script

```bash
#!/bin/bash
# health-check.sh

API_URL="https://your-api.railway.app"
FRONTEND_URL="https://your-app.vercel.app"

# Check API health
if curl -f "$API_URL/health" > /dev/null 2>&1; then
    echo "API is healthy"
else
    echo "API is down" >&2
    exit 1
fi

# Check frontend
if curl -f "$FRONTEND_URL" > /dev/null 2>&1; then
    echo "Frontend is healthy"
else
    echo "Frontend is down" >&2
    exit 1
fi
```

## Performance Optimization

### Frontend Optimization

1. **Build Optimization:**
   ```javascript
   // vite.config.ts
   export default defineConfig({
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom'],
             ui: ['@headlessui/react', 'framer-motion'],
           },
         },
       },
     },
   });
   ```

2. **CDN Configuration:**
   ```javascript
   // Configure asset CDN
   const CDN_URL = 'https://cdn.your-domain.com';
   ```

### Backend Optimization

1. **Connection Pooling:**
   ```javascript
   // Configure Supabase client
   const supabase = createClient(url, key, {
     db: {
       schema: 'public',
     },
     auth: {
       autoRefreshToken: true,
       persistSession: false,
     },
     realtime: {
       params: {
         eventsPerSecond: 10,
       },
     },
   });
   ```

2. **Caching Strategy:**
   ```javascript
   // Redis caching
   const redis = new Redis(process.env.REDIS_URL);
   
   app.use('/api', (req, res, next) => {
     const key = `cache:${req.originalUrl}`;
     redis.get(key, (err, result) => {
       if (result) {
         res.json(JSON.parse(result));
       } else {
         next();
       }
     });
   });
   ```

## Security Hardening

### API Security

1. **Rate Limiting:**
   ```javascript
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
   });
   
   app.use('/api', limiter);
   ```

2. **CORS Configuration:**
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true,
   }));
   ```

3. **Security Headers:**
   ```javascript
   import helmet from 'helmet';
   
   app.use(helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         styleSrc: ["'self'", "'unsafe-inline'"],
         scriptSrc: ["'self'"],
         imgSrc: ["'self'", "data:", "https:"],
       },
     },
   }));
   ```

### Database Security

1. **Row Level Security:**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
   
   -- Create policies
   CREATE POLICY "Users can only see own agents"
     ON agents FOR ALL
     USING (auth.uid() = user_id);
   ```

2. **Connection Security:**
   ```javascript
   // Use connection pooling
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: process.env.NODE_ENV === 'production',
     max: 20,
     idleTimeoutMillis: 30000,
   });
   ```

## Backup and Recovery

### Database Backups

Supabase provides automatic backups, but you can also create manual backups:

```bash
# Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore backup
psql $DATABASE_URL < backup-20240115.sql
```

### Application Backups

```bash
#!/bin/bash
# backup.sh

# Backup environment variables
cp .env .env.backup

# Backup configuration files
tar -czf config-backup.tar.gz *.json *.toml *.yml

# Upload to cloud storage
aws s3 cp config-backup.tar.gz s3://your-backup-bucket/
```

## Rollback Strategy

### Quick Rollback

1. **Frontend Rollback:**
   ```bash
   # Vercel
   vercel rollback
   
   # Netlify
   netlify sites:list
   netlify api rollbackSiteDeploy --site-id=SITE_ID --deploy-id=DEPLOY_ID
   ```

2. **Backend Rollback:**
   ```bash
   # Railway
   railway rollback
   
   # Docker
   docker-compose down
   docker-compose up -d --scale api=0
   docker-compose up -d previous-image
   ```

### Database Rollback

```sql
-- Rollback migration
BEGIN;
-- Your rollback SQL here
ROLLBACK; -- or COMMIT if successful
```

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check Node.js version compatibility
   - Verify all environment variables are set
   - Review build logs for specific errors

2. **Database Connection Issues:**
   - Verify Supabase credentials
   - Check network connectivity
   - Review connection pool settings

3. **Performance Issues:**
   - Monitor API response times
   - Check database query performance
   - Review CDN cache hit rates

### Monitoring Commands

```bash
# Check application status
curl -f https://your-api.railway.app/health

# Monitor logs
railway logs --follow

# Check database performance
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"
```

---

This deployment guide ensures your VRM Platform runs reliably in production with proper security, monitoring, and backup procedures.