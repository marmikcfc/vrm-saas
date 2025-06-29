# Server

Backend API server for the application.

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase credentials
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)