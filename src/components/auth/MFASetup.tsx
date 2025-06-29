import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Copy, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { generateMFASecret, enableMFA, MFASetup as MFASetupType } from '../../lib/auth';
import Button from '../ui/Button';

const mfaSetupSchema = z.object({
  verificationCode: z.string().length(6, 'Verification code must be 6 digits'),
});

type MFASetupFormData = z.infer<typeof mfaSetupSchema>;

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [mfaData, setMfaData] = useState<MFASetupType | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MFASetupFormData>({
    resolver: zodResolver(mfaSetupSchema),
  });

  useEffect(() => {
    // Generate MFA secret and QR code
    const setupMFA = async () => {
      try {
        const mfaSetup = generateMFASecret();
        setMfaData(mfaSetup);

        // Generate QR code using canvas instead of qrcode library
        const qrUrl = `data:image/svg+xml;base64,${btoa(`
          <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="white"/>
            <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12" fill="black">
              QR Code Placeholder
            </text>
            <text x="100" y="120" text-anchor="middle" font-family="monospace" font-size="8" fill="gray">
              Use manual setup below
            </text>
          </svg>
        `)}`;
        setQrCodeUrl(qrUrl);
      } catch (err) {
        setError('Failed to generate MFA setup. Please try again.');
      }
    };

    setupMFA();
  }, []);

  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackupCodes(true);
        setTimeout(() => setCopiedBackupCodes(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadBackupCodes = () => {
    if (!mfaData) return;

    const content = `VRM Platform - Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\nBackup Codes:\n${mfaData.backupCodes.join('\n')}\n\nKeep these codes safe and secure. Each code can only be used once.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vrm-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onVerify = async (data: MFASetupFormData) => {
    if (!mfaData) return;

    setIsLoading(true);
    setError(null);

    try {
      const { success, error } = await enableMFA(mfaData.secret, data.verificationCode);

      if (!success) {
        setError(error || 'Failed to enable MFA');
        return;
      }

      setStep('backup');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete?.();
  };

  if (!mfaData) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
        <p className="text-gray-500">Setting up two-factor authentication...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 mx-auto mb-4">
          <Shield className="h-6 w-6 text-brand" />
        </div>
        <h1 className="text-2xl font-semibold text-fg-high">
          {step === 'setup' && 'Set up two-factor authentication'}
          {step === 'verify' && 'Verify your authenticator'}
          {step === 'backup' && 'Save your backup codes'}
        </h1>
        <p className="text-gray-500 mt-2">
          {step === 'setup' && 'Use the manual setup code with your authenticator app'}
          {step === 'verify' && 'Enter the 6-digit code from your authenticator app'}
          {step === 'backup' && 'Store these codes in a safe place'}
        </p>
      </div>

      {step === 'setup' && (
        <div className="space-y-6">
          {/* QR Code Placeholder */}
          <div className="text-center">
            <div className="inline-block p-4 bg-white border border-gray-200 rounded-lg">
              <img src={qrCodeUrl} alt="MFA QR Code Placeholder" className="w-48 h-48" />
            </div>
          </div>

          {/* Manual Setup */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Manual Setup</h3>
            <p className="text-sm text-gray-600 mb-3">
              Enter this code in your authenticator app:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm font-mono break-all">
                {mfaData.secret}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(mfaData.secret, 'secret')}
              >
                {copiedSecret ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Supported Apps */}
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">Recommended authenticator apps:</p>
            <ul className="space-y-1">
              <li>• Google Authenticator</li>
              <li>• Microsoft Authenticator</li>
              <li>• Authy</li>
              <li>• 1Password</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => setStep('verify')} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <form onSubmit={handleSubmit(onVerify)} className="space-y-6">
          {/* Verification Code */}
          <div>
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
              Verification code
            </label>
            <input
              {...register('verificationCode')}
              type="text"
              maxLength={6}
              className="block w-full px-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-brand focus:border-brand focus:outline-none text-center text-lg tracking-widest"
              placeholder="000000"
              autoComplete="one-time-code"
            />
            {errors.verificationCode && (
              <p className="mt-1 text-sm text-red-600">{errors.verificationCode.message}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep('setup');
                reset();
                setError(null);
              }}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              className="flex-1"
            >
              Verify & Enable
            </Button>
          </div>
        </form>
      )}

      {step === 'backup' && (
        <div className="space-y-6">
          {/* Success Message */}
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">Two-factor authentication enabled successfully!</p>
          </div>

          {/* Backup Codes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2">Important: Save your backup codes</h3>
            <p className="text-sm text-yellow-800 mb-4">
              These codes can be used to access your account if you lose your authenticator device. 
              Each code can only be used once.
            </p>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {mfaData.backupCodes.map((code, index) => (
                <code key={index} className="px-2 py-1 bg-white border border-yellow-300 rounded text-sm font-mono text-center">
                  {code}
                </code>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(mfaData.backupCodes.join('\n'), 'backup')}
                className="flex-1"
              >
                {copiedBackupCodes ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedBackupCodes ? 'Copied!' : 'Copy Codes'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadBackupCodes}
                className="flex-1"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          <Button onClick={handleComplete} className="w-full">
            Complete Setup
          </Button>
        </div>
      )}
    </div>
  );
}