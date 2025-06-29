import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({ children, className, padding = true }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white border border-border rounded-lg shadow-sm',
        padding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  );
}