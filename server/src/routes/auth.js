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

    // Check rate limiting in user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('login_attempts, locked_until')
      .eq('email', email)
      .single();

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
      // Increment login attempts
      await supabase.rpc('increment_login_attempts', { user_email: email });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Reset login attempts on successful login
    await supabase
      .from('user_profiles')
      .update({ 
        login_attempts: 0, 
        locked_until: null,
        last_login: new Date().toISOString()
      })
      .eq('email', email);

    // Get user profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      message: 'Login successful',
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: userProfile?.full_name,
        organization: userProfile?.organization,
        role: userProfile?.role || 'user'
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
      full_name: user.profile?.full_name,
      avatar_url: user.profile?.avatar_url,
      organization: user.profile?.organization,
      role: user.profile?.role || 'user'
    });
  } catch (error) {
    next(error);
  }
});

export default router;