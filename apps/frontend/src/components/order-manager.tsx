'use client';

import React, { use, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { OrderWorkspace } from './order-workspace';
import type { FetchResult } from '@/lib/interfaces';
import type {
  IUser,
  IProduct,
} from '@shared/interfaces';

interface IOrderManagerProps {
  userFetchResultPromise: Promise<FetchResult<IUser[]>>;
  productFetchResultPromise: Promise<FetchResult<IProduct[]>>;
}

export const OrderManager: React.FC<IOrderManagerProps> = ({
  userFetchResultPromise,
  productFetchResultPromise,
}): React.JSX.Element => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);

  const userFetchResult = use(userFetchResultPromise);
  const productFetchResult = use(productFetchResultPromise);

  useEffect(() => {
    if (!userFetchResult.success) {
      toast.error(userFetchResult.error.message);
      setUsers([]);
      return;
    }
    setUsers(userFetchResult.data);
  }, [userFetchResult]);

  useEffect(() => {
    if (!productFetchResult.success) {
      toast.error(productFetchResult.error.message);
      setProducts([]);
      return;
    }
    setProducts(productFetchResult.data);
  }, [productFetchResult]);

  return (
    <section className='flex flex-col md:flex-row gap-6 w-full h-full'>
      <OrderWorkspace users={users} products={products} />
    </section>
  );
};
