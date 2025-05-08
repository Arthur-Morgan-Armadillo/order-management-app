'use client';

import React from 'react';
import { Button } from '@/components';

interface IErrorProps {
  error: Error;
  reset: () => void;
}

const Error = ({ reset }: IErrorProps): React.JSX.Element => {
  return (
    <div className='flex flex-col items-center justify-center py-20 text-center px-4'>
      <h2 className='text-3xl font-bold mb-4'>Something went wrong</h2>
      <p className='text-muted-foreground mb-6'>
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={() => reset()}>Try Again</Button>
    </div>
  );
};

export default Error;
