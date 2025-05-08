'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { OrderForm } from './order-form';
import { UserOrdersTable } from './user-orders-table';
import { fetchAllOrdersByUserId } from '@/lib/actions';
import type {
  IUser,
  IProduct,
  IOrderWithRelationsSanitized,
} from '@/lib/interfaces';

interface IOrderWorkspaceProps {
  users: IUser[];
  products: IProduct[];
}

export const OrderWorkspace: React.FC<IOrderWorkspaceProps> = ({
  users,
  products,
}): React.JSX.Element => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [orders, setOrders] = useState<IOrderWithRelationsSanitized[] | []>([]);
  const [loading, setLoading] = useState(false);

  const getUserOrders = useCallback(async (userId: string | null) => {
    if (!userId) return;

    setLoading(true);
    const ordersFetchResult = await fetchAllOrdersByUserId(userId);

    if (ordersFetchResult.success) {
      toast.info("User's orders fetched successfully");
      setOrders(ordersFetchResult.data);
    } else {
      toast.error(ordersFetchResult.error.message);
      setOrders([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    getUserOrders(selectedUserId);
  }, [getUserOrders, selectedUserId]);

  return (
    <section className='flex flex-col lg:flex-row gap-3 xl:gap-6 w-full h-full'>
      <article className=' w-full lg:w-[350px] shrink-0'>
        <OrderForm
          users={users}
          products={products}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
          onOrderCreated={() => getUserOrders(selectedUserId)}
        />
      </article>
      <article className='w-full flex-1 min-h-0'>
        <UserOrdersTable
          selectedUserId={selectedUserId}
          orders={orders}
          loading={loading}
        />
      </article>
    </section>
  );
};
