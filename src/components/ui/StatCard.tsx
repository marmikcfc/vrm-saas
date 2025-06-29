import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import Card from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
}

export default function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10">
          <Icon className="h-6 w-6 text-brand" />
        </div>
      )}
      <div className="flex-1">
        <div className="text-2xl font-semibold text-fg-high">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {trend && (
          <div className="mt-1 text-xs text-success">
            +{trend.value}% {trend.label}
          </div>
        )}
      </div>
    </Card>
  );
}