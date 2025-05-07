import React, { Suspense } from 'react';
import { fetchAllUsers, fetchAllProducts } from '@/lib/actions';
import { OrderManagerSkeleton, OrderManager } from '@/components';
import { cn } from '@/lib/utils';

const HomePage = (): React.JSX.Element => {
  const userFetchResultPromise = fetchAllUsers();
  const productFetchResultPromise = fetchAllProducts();

  return (
    <>
      <h1 className='text-2xl sm:text-3xl font-bold text-center text-gray-800 my-4'>
        Order Dashboard
      </h1>

      <Suspense fallback={<OrderManagerSkeleton />}>
        <section className={cn('p-4', 'bg-gray-50 rounded-lg shadow-md')}>
          <OrderManager
            userFetchResultPromise={userFetchResultPromise}
            productFetchResultPromise={productFetchResultPromise}
          />
        </section>
      </Suspense>
    </>
  );
};

export default HomePage;
