import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Bot, 
  Phone, 
  BookOpen, 
  Puzzle, 
  Settings,
  X,
  Zap
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Agents', href: '/dashboard/agents', icon: Bot },
  { name: 'Calls', href: '/dashboard/calls', icon: Phone },
  { name: 'Knowledge Base', href: '/dashboard/knowledge-base', icon: BookOpen },
  { name: 'MCPs', href: '/dashboard/mcps', icon: Puzzle },
];

const settingsNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/dashboard' && location.pathname === '/dashboard') return true;
    return location.pathname.startsWith(href) && href !== '/dashboard';
  };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-border transition-transform duration-200 lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-6 border-b border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-accent text-white">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
              FASTSOL
            </span>
            <button
              className="ml-auto lg:hidden"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <div className="space-y-2">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-gradient-to-r from-brand/10 to-accent/10 text-brand border border-brand/20'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-fg-high'
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* Settings */}
          <div className="border-t border-border p-4">
            {settingsNavigation.map((item) => {
              const active = isActive(item.href);
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-gradient-to-r from-brand/10 to-accent/10 text-brand border border-brand/20'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-fg-high'
                  )}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}