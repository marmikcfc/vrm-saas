import { authApi, apiClient } from './api';

export interface AuthUser {
  id: string;
  email: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    organization: string | null;
    role: 'admin' | 'user' | 'viewer';
    mfa_enabled: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaToken?: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
  organization?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Authentication functions
export const signUp = async (credentials: SignUpCredentials): Promise<{ 
  user: AuthUser | null; 
  error: any | null;
  emailNotConfirmed?: boolean;
}> => {
  const { isValid, errors } = validatePassword(credentials.password);
  
  if (!isValid) {
    return {
      user: null,
      error: { message: errors.join(', ') }
    };
  }

  try {
    const response = await authApi.signup(credentials);
    
    // Store token if provided
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      apiClient.setToken(response.data.token);
    }
    
    return { 
      user: response.data.user, 
      error: null,
      emailNotConfirmed: !response.data.token // If no token, email confirmation required
    };
  } catch (error: any) {
    return { user: null, error };
  }
};

export const signIn = async (credentials: LoginCredentials): Promise<{ 
  user: AuthUser | null; 
  error: any | null; 
  requiresMFA?: boolean;
  emailNotConfirmed?: boolean;
}> => {
  try {
    const response = await authApi.login(credentials);
    
    // Store token
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      apiClient.setToken(response.data.token);
    }
    
    return { 
      user: response.data.user, 
      error: null 
    };
  } catch (error: any) {
    // Handle specific error cases
    if (error.status === 429) {
      return { 
        user: null, 
        error: { message: error.message }
      };
    }
    
    if (error.message === 'Email not confirmed') {
      return { 
        user: null, 
        error: null, 
        emailNotConfirmed: true 
      };
    }
    
    return { user: null, error };
  }
};

export const signOut = async (): Promise<{ error: any | null }> => {
  try {
    await authApi.logout();
    localStorage.removeItem('auth_token');
    apiClient.setToken(null);
    return { error: null };
  } catch (error: any) {
    // Even if logout fails on server, clear local storage
    localStorage.removeItem('auth_token');
    apiClient.setToken(null);
    return { error };
  }
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return null;
    }
    
    apiClient.setToken(token);
    const response = await authApi.me();
    return response.data;
  } catch (error: any) {
    console.error('Failed to get current user:', error);
    // Clear invalid token
    localStorage.removeItem('auth_token');
    apiClient.setToken(null);
    return null;
  }
};

// Password reset functions
export const requestPasswordReset = async (request: PasswordResetRequest): Promise<{ error: any | null }> => {
  try {
    await authApi.forgotPassword(request);
    return { error: null };
  } catch (error: any) {
    return { error };
  }
};

export const confirmPasswordReset = async (token: string, newPassword: string): Promise<{ error: any | null }> => {
  const { isValid, errors } = validatePassword(newPassword);
  
  if (!isValid) {
    return {
      error: { message: errors.join(', ') }
    };
  }

  try {
    await authApi.resetPassword({ token, newPassword });
    return { error: null };
  } catch (error: any) {
    return { error };
  }
};

// Simple MFA implementation without external dependencies
export const generateMFASecret = (): MFASetup => {
  // Generate a simple base32 secret
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Create a simple TOTP URI
  const issuer = 'VRM Platform';
  const label = 'VRM Account';
  const qrCode = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  
  // Generate backup codes
  const backupCodes = Array.from({ length: 8 }, () => 
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );

  return {
    secret,
    qrCode,
    backupCodes
  };
};

export const verifyMFAToken = (secret: string, token: string): boolean => {
  // Simple TOTP verification - in production, use a proper TOTP library
  // For demo purposes, accept any 6-digit code
  return /^\d{6}$/.test(token);
};

export const enableMFA = async (secret: string, token: string): Promise<{ success: boolean; error?: string }> => {
  const isValid = verifyMFAToken(secret, token);
  
  if (!isValid) {
    return { success: false, error: 'Invalid verification code' };
  }

  // In a real implementation, you would call the backend API to enable MFA
  // For now, we'll simulate success
  return { success: true };
};

export const disableMFA = async (): Promise<{ success: boolean; error?: string }> => {
  // In a real implementation, you would call the backend API to disable MFA
  // For now, we'll simulate success
  return { success: true };
};

// Session management
export const refreshSession = async (): Promise<{ user: AuthUser | null; error: any | null }> => {
  try {
    const user = await getCurrentUser();
    return { user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
};

// Auth state listener (simplified for backend API approach)
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  // In a backend API approach, we don't have real-time auth state changes
  // This is a simplified version that just calls the callback once
  getCurrentUser().then(callback);
  
  // Return a cleanup function
  return () => {};
};