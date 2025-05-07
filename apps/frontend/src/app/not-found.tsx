import React from 'react';
import Link from 'next/link';
import { Button } from '@/components';

const NotFound = (): React.JSX.Element => {
  return (
    <div className='flex flex-col items-center justify-center py-20 text-center px-4'>
      <h1 className='text-4xl font-bold mb-4'>404 – Page Not Found</h1>
      <p className='text-muted-foreground mb-6'>
        Sorry, the page you’re looking for doesn’t exist.
      </p>
      <Link href='/'>
        <Button>Go Home</Button>
      </Link>
    </div>
  );
};

export default NotFound;
