import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const Header: React.FC = (): React.JSX.Element => {
  return (
    <header
      className={cn(
        'py-4 border-b border-gray-200 text-center',
        'bg-white/10 backdrop-blur-md'
      )}
    >
      <Link href='/' className='inline-block'>
        <p className='font-poppins text-3xl sm:text-5xl font-bold text-gray-900'>
          Order Management
        </p>
      </Link>
    </header>
  );
};
