import express from 'express';
import { supabase } from '../config/supabase.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { signupValidation, loginValidation, validateRequest } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *               organization:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/signup', authRateLimiter, signupValidation, validateRequest, async (req, res, next) => {
  try {
    const { email, password, fullName, organization } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          organization: organization || null
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }
      throw error;
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        organization: organization || null,
        role: 'user'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many attempts
 */
router.post('/login', authRateLimiter, loginValidation, validateRequest, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Try to check rate limiting in user_profiles (but don't fail if table doesn't exist)
    let profile = null;
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('login_attempts, locked_until')
        .eq('email', email)
        .single();
      profile = data;
    } catch (profileError) {
      // Profile table doesn't exist or no profile - continue without rate limiting
      console.log('No user profile found for rate limiting, continuing...');
    }

    if (profile?.locked_until && new Date(profile.locked_until) > new Date()) {
      return res.status(429).json({
        message: `Account locked until ${new Date(profile.locked_until).toLocaleString()}`,
        lockedUntil: profile.locked_until
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Try to increment login attempts if user_profiles table exists
      try {
        await supabase.rpc('increment_login_attempts', { user_email: email });
      } catch (rpcError) {
        // RPC doesn't exist, ignore and continue
        console.log('increment_login_attempts RPC not found, skipping...');
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Try to reset login attempts on successful login if user_profiles table exists
    try {
      await supabase
        .from('user_profiles')
        .update({ 
          login_attempts: 0, 
          locked_until: null,
          last_login: new Date().toISOString()
        })
        .eq('email', email);
    } catch (updateError) {
      // Profile table doesn't exist, ignore and continue
      console.log('Could not update user profile, continuing...');
    }

    // Try to get user profile, but use auth metadata as fallback
    let userProfile = null;
    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      userProfile = profileData;
    } catch (profileError) {
      // No profile table or no profile record - use auth metadata
      console.log('No user profile found, using auth metadata...');
    }

    res.json({
      message: 'Login successful',
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        profile: {
          full_name: userProfile?.full_name || data.user.user_metadata?.full_name || null,
          avatar_url: userProfile?.avatar_url || data.user.user_metadata?.avatar_url || null,
          organization: userProfile?.organization || data.user.user_metadata?.organization || null,
          role: userProfile?.role || 'user',
          mfa_enabled: userProfile?.mfa_enabled || false
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: No active session
 */
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post('/forgot-password', authRateLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    // Always return success for security
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token or weak password
 */
router.post('/reset-password', authRateLimiter, async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword) || newPassword.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = req.user;
    
    res.json({
      id: user.id,
      email: user.email,
      profile: {
        full_name: user.profile?.full_name,
        avatar_url: user.profile?.avatar_url,
        organization: user.profile?.organization,
        role: user.profile?.role || 'user',
        mfa_enabled: user.profile?.mfa_enabled || false
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;