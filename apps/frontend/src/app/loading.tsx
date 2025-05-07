import React from 'react';
import { Skeleton } from '@/components';

const Loading = (): React.JSX.Element => {
  return (
    <div className='flex flex-col items-center justify-center py-20 px-4 space-y-4'>
      <Skeleton className='h-6 w-2/3' />
      <Skeleton className='h-6 w-1/2' />
      <Skeleton className='h-6 w-1/4' />
    </div>
  );
};

export default Loading;
