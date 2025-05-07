import React from 'react';
import { cn } from '@/lib/utils';

export const OrderManagerSkeleton: React.FC = (): React.JSX.Element => {
  return (
    <div className={cn('p-4', 'bg-gray-50 rounded-lg shadow-md')}>
      <div className='h-6 w-1/3 bg-gray-300 rounded animate-pulse mb-6'></div>

      <div className='space-y-5'>
        <div className='space-y-2'>
          <div className='h-4 w-1/4 bg-gray-300 rounded animate-pulse'></div>
          <div className='h-10 w-full bg-gray-300 rounded animate-pulse'></div>
        </div>

        <div className='space-y-2'>
          <div className='h-4 w-1/4 bg-gray-300 rounded animate-pulse'></div>
          <div className='h-10 w-full bg-gray-300 rounded animate-pulse'></div>
        </div>

        <div className='flex space-x-4'>
          <div className='w-1/2 space-y-2'>
            <div className='h-4 w-1/3 bg-gray-300 rounded animate-pulse'></div>
            <div className='h-10 w-full bg-gray-300 rounded animate-pulse'></div>
          </div>
          <div className='w-1/2 space-y-2'>
            <div className='h-4 w-1/3 bg-gray-300 rounded animate-pulse'></div>
            <div className='h-10 w-full bg-gray-300 rounded animate-pulse'></div>
          </div>
        </div>

        <div className='h-10 w-full bg-gray-300 rounded animate-pulse pt-4'></div>
      </div>
    </div>
  );
};
