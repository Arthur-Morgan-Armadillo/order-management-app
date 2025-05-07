import React from 'react';
import { cn } from '@/lib/utils';

export const Footer: React.FC = (): React.JSX.Element => {
  return (
    <footer
      className={cn(
        'py-4 border-t border-gray-200 text-center text-sm text-gray-500',
        'bg-white/10 backdrop-blur-md'
      )}
    >
      &copy; {new Date().getFullYear()} Order Management App
    </footer>
  );
};
