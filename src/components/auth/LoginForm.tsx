import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { signIn, LoginCredentials } from '../../lib/auth';
import { useAuthStore } from '../../stores/useAuthStore';
import Button from '../ui/Button';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  mfaToken: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
}

export default function LoginForm({ onSuccess, onForgotPassword, onSignUp }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const email = watch('email');

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setEmailNotConfirmed(false);

    try {
      const credentials: LoginCredentials = {
        email: data.email,
        password: data.password,
        mfaToken: data.mfaToken,
      };

      const { user, error, requiresMFA: needsMFA, emailNotConfirmed: needsConfirmation } = await signIn(credentials);

      if (error) {
        setError(error.message);
        return;
      }

      if (needsConfirmation) {
        setEmailNotConfirmed(true);
        return;
      }

      if (needsMFA) {
        setRequiresMFA(true);
        return;
      }

      if (user) {
        setUser(user);
        onSuccess?.();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPassword = () => {
    setRequiresMFA(false);
    setValue('mfaToken', '');
    setError(null);
  };

  if (emailNotConfirmed) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mx-auto mb-4">
            <Mail className="h-6 w-6 text-amber-600" />
          </div>
          <h1 className="text-2xl font-semibold text-fg-high">Check your email</h1>
          <p className="text-gray-500 mt-2">
            We've sent a confirmation link to your email address. Please click the link to verify your account before signing in.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              <strong>Email:</strong> {email}
            </p>
          </div>
          <p className="text-sm text-amber-700 mt-2">
            Didn't receive the email? Check your spam folder or try signing up again.
          </p>
        </div>

        <Button
          onClick={() => setEmailNotConfirmed(false)}
          variant="outline"
          className="w-full"
        >
          Back to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 mx-auto mb-4">
          <Lock className="h-6 w-6 text-brand" />
        </div>
        <h1 className="text-2xl font-semibold text-fg-high">
          {requiresMFA ? 'Two-Factor Authentication' : 'Welcome back'}
        </h1>
        <p className="text-gray-500 mt-2">
          {requiresMFA 
            ? 'Enter the verification code from your authenticator app'
            : 'Sign in to your account to continue'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {!requiresMFA ? (
          <>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand focus:outline-none"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-10 py-3 border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand focus:outline-none"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </>
        ) : (
          <>
            {/* MFA Token Field */}
            <div>
              <label htmlFor="mfaToken" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('mfaToken')}
                  type="text"
                  maxLength={6}
                  className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand focus:outline-none text-center text-lg tracking-widest"
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
              </div>
              {errors.mfaToken && (
                <p className="mt-1 text-sm text-red-600">{errors.mfaToken.message}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Signing in as: <span className="font-medium">{email}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleBackToPassword}
              className="text-sm text-brand hover:text-brand-600 font-medium"
            >
              ← Back to password
            </button>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
          disabled={isLoading}
        >
          {requiresMFA ? 'Verify & Sign In' : 'Sign In'}
        </Button>

        {/* Footer Links */}
        {!requiresMFA && (
          <div className="space-y-4">
            <div className="text-center">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-brand hover:text-brand-600 font-medium"
              >
                Forgot your password?
              </button>
            </div>

            <div className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSignUp}
                className="text-brand hover:text-brand-600 font-medium"
              >
                Sign up
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}