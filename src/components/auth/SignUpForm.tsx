import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, User, Building, AlertCircle, CheckCircle } from 'lucide-react';
import { signUp, validatePassword } from '../../lib/auth';
import { useAuthStore } from '../../stores/useAuthStore';
import Button from '../ui/Button';

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  organization: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSuccess?: () => void;
  onSignIn?: () => void;
}

export default function SignUpForm({ onSuccess, onSignIn }: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailConfirmationPending, setEmailConfirmationPending] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [passwordValidation, setPasswordValidation] = useState<{
    isValid: boolean;
    errors: string[];
  }>({ isValid: false, errors: [] });

  const { setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const password = watch('password');

  // Real-time password validation
  React.useEffect(() => {
    if (password) {
      const validation = validatePassword(password);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation({ isValid: false, errors: [] });
    }
  }, [password]);

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { user, session, error } = await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        organization: data.organization,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (user && !session) {
        // Email confirmation is required
        setUserEmail(data.email);
        setEmailConfirmationPending(true);
        return;
      }

      if (user && session) {
        // User is immediately signed in (email confirmation disabled)
        setUser(user);
        onSuccess?.();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailConfirmationPending) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-fg-high">Check your email</h1>
          <p className="text-gray-500 mt-2">
            We've sent a confirmation link to your email address. Please click the link to verify your account.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              <strong>Email sent to:</strong> {userEmail}
            </p>
          </div>
          <p className="text-sm text-blue-700 mt-2">
            After confirming your email, you can sign in to your account.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => setEmailConfirmationPending(false)}
            variant="outline"
            className="w-full"
          >
            Back to Sign Up
          </Button>
          
          <div className="text-center text-sm text-gray-500">
            Already confirmed your email?{' '}
            <button
              type="button"
              onClick={onSignIn}
              className="text-brand hover:text-brand-600 font-medium"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 mx-auto mb-4">
          <User className="h-6 w-6 text-brand" />
        </div>
        <h1 className="text-2xl font-semibold text-fg-high">Create your account</h1>
        <p className="text-gray-500 mt-2">
          Get started with your VRM platform today
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Full Name Field */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
            Full name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('fullName')}
              type="text"
              autoComplete="name"
              className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand focus:outline-none"
              placeholder="Enter your full name"
            />
          </div>
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
          )}
        </div>

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

        {/* Organization Field */}
        <div>
          <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
            Organization <span className="text-gray-400">(optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('organization')}
              type="text"
              autoComplete="organization"
              className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand focus:outline-none"
              placeholder="Enter your organization"
            />
          </div>
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
              autoComplete="new-password"
              className="block w-full pl-10 pr-10 py-3 border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand focus:outline-none"
              placeholder="Create a strong password"
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
          
          {/* Password Requirements */}
          {password && (
            <div className="mt-2 space-y-1">
              {passwordValidation.errors.map((error, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">{error}</span>
                </div>
              ))}
              {passwordValidation.isValid && (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">Password meets all requirements</span>
                </div>
              )}
            </div>
          )}
          
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="block w-full pl-10 pr-10 py-3 border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand focus:outline-none"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

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
          disabled={isLoading || !passwordValidation.isValid}
        >
          Create Account
        </Button>

        {/* Footer Link */}
        <div className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSignIn}
            className="text-brand hover:text-brand-600 font-medium"
          >
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
}