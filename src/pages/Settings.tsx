import React from 'react';
import { Save, Key, Bell, Users, CreditCard } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function Settings() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-fg-high">Settings</h1>
        <p className="text-gray-500">Manage your account and application preferences</p>
      </div>

      {/* Organization Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Organization</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name
            </label>
            <input
              type="text"
              defaultValue="Acme Corporation"
              className="w-full max-w-md rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domain
            </label>
            <input
              type="text"
              defaultValue="acme.com"
              className="w-full max-w-md rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {/* API Keys */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Key className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">API Keys</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key
            </label>
            <div className="flex gap-2 max-w-md">
              <input
                type="password"
                defaultValue="sk-..."
                className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
              />
              <Button variant="outline" size="sm">
                Update
              </Button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deepgram API Key
            </label>
            <div className="flex gap-2 max-w-md">
              <input
                type="password"
                defaultValue="dg_..."
                className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
              />
              <Button variant="outline" size="sm">
                Update
              </Button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cartesia API Key
            </label>
            <div className="flex gap-2 max-w-md">
              <input
                type="password"
                placeholder="Enter your Cartesia API key"
                className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
              />
              <Button variant="outline" size="sm">
                Save
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="text-brand focus:ring-brand" />
            <span className="text-sm">Email notifications for failed calls</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="text-brand focus:ring-brand" />
            <span className="text-sm">Weekly analytics reports</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input type="checkbox" className="text-brand focus:ring-brand" />
            <span className="text-sm">New feature announcements</span>
          </label>
        </div>
      </Card>

      {/* Billing */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Billing</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">Current Plan: Pro</div>
              <div className="text-sm text-gray-600">$49/month • Unlimited agents and calls</div>
            </div>
            <Button variant="outline">
              Change Plan
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            Next billing date: February 15, 2024
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button icon={Save}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}