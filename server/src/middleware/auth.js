import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { createClient } from '@supabase/supabase-js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Create user-scoped Supabase client using the JWT token
    // This ensures RLS policies work correctly with auth.uid()
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY, // Use anon key, not service key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Try to get user profile (but don't fail if it doesn't exist)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Create a user object with profile data if available, fallback to auth metadata
    const userWithProfile = {
      ...user,
      profile: profile || {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        organization: user.user_metadata?.organization || null,
        role: 'user',
        mfa_enabled: false,
        last_login: null,
        login_attempts: 0,
        locked_until: null,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };

    req.user = userWithProfile;
    req.userSupabase = userSupabase; // Add user-scoped client to request
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.profile) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.profile.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};