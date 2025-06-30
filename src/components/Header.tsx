import React from 'react';
import { Menu, Bell, ChevronDown, User, Shield, LogOut } from 'lucide-react';
import { Menu as HeadlessMenu } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '../stores/useAuthStore';
import { signOut } from '../lib/auth';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    clearAuth();
    navigate('/');
  };

  const handleMFASetup = () => {
    navigate('/auth?mode=mfa-setup');
  };

  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white border-b border-border px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="hidden sm:block">
          <h1 className="text-lg font-semibold text-fg-high">Dashboard</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-danger rounded-full"></span>
        </button>

        {/* User menu */}
        <HeadlessMenu as="div" className="relative">
          <HeadlessMenu.Button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand to-accent flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-fg-high">
                {user?.profile?.full_name || user?.email || 'User'}
              </div>
              {user?.profile?.organization && (
                <div className="text-xs text-gray-500">{user.profile.organization}</div>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </HeadlessMenu.Button>

          <HeadlessMenu.Items className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-border py-1">
            <div className="px-4 py-2 border-b border-border">
              <div className="text-sm font-medium text-fg-high">
                {user?.profile?.full_name || 'User'}
              </div>
              <div className="text-xs text-gray-500">{user?.email}</div>
              {user?.profile?.mfa_enabled && (
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">2FA Enabled</span>
                </div>
              )}
            </div>

            <HeadlessMenu.Item>
              {({ active }) => (
                <button
                  onClick={() => navigate('/dashboard/settings')}
                  className={clsx(
                    'w-full text-left px-4 py-2 text-sm',
                    active ? 'bg-gray-50 text-fg-high' : 'text-gray-700'
                  )}
                >
                  Account Settings
                </button>
              )}
            </HeadlessMenu.Item>

            {!user?.profile?.mfa_enabled && (
              <HeadlessMenu.Item>
                {({ active }) => (
                  <button
                    onClick={handleMFASetup}
                    className={clsx(
                      'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                      active ? 'bg-gray-50 text-fg-high' : 'text-gray-700'
                    )}
                  >
                    <Shield className="h-4 w-4" />
                    Enable 2FA
                  </button>
                )}
              </HeadlessMenu.Item>
            )}

            <div className="border-t border-border mt-1 pt-1">
              <HeadlessMenu.Item>
                {({ active }) => (
                  <button
                    onClick={handleSignOut}
                    className={clsx(
                      'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                      active ? 'bg-gray-50 text-red-600' : 'text-red-600'
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                )}
              </HeadlessMenu.Item>
            </div>
          </HeadlessMenu.Items>
        </HeadlessMenu>
      </div>
    </div>
  );
}