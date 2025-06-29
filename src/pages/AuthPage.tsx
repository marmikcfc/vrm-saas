import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Mic } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';
import SignUpForm from '../components/auth/SignUpForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import MFASetup from '../components/auth/MFASetup';

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'mfa-setup';

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const mode = (searchParams.get('mode') as AuthMode) || 'login';
  const [currentMode, setCurrentMode] = useState<AuthMode>(mode);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  const updateMode = (newMode: AuthMode) => {
    setCurrentMode(newMode);
    setSearchParams({ mode: newMode });
  };

  const handleAuthSuccess = () => {
    const from = location.state?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
  };

  const renderAuthForm = () => {
    switch (currentMode) {
      case 'signup':
        return (
          <SignUpForm
            onSuccess={handleAuthSuccess}
            onSignIn={() => updateMode('login')}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onBack={() => updateMode('login')}
          />
        );
      case 'reset-password':
        return <ResetPasswordForm />;
      case 'mfa-setup':
        return (
          <MFASetup
            onComplete={handleAuthSuccess}
            onCancel={() => updateMode('login')}
          />
        );
      default:
        return (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onForgotPassword={() => updateMode('forgot-password')}
            onSignUp={() => updateMode('signup')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand/5 via-white to-accent/5 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-white shadow-lg">
            <Mic className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          VRM Platform
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Virtual Relationship Manager
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          {renderAuthForm()}
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center text-xs text-gray-500">
          <p>Protected by enterprise-grade security</p>
          <p className="mt-1">
            Your data is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}