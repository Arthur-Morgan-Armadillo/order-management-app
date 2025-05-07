import React from 'react';
import {
  Table,
  TableHead,
  TableCaption,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
  Skeleton,
} from '@/components';
import { cn } from '@/lib/utils';
import type { IOrderWithRelationsSanitized } from '@shared/interfaces';

interface IUserOrdersTableProps {
  selectedUserId: string | null;
  orders: IOrderWithRelationsSanitized[] | [];
  loading: boolean;
}

export const UserOrdersTable: React.FC<IUserOrdersTableProps> = ({
  selectedUserId,
  orders,
  loading,
}): React.JSX.Element => {
  return (
    <section className='border rounded-2xl p-6 shadow-sm w-full h-full overflow-auto'>
      <h2 className='font-poppins text-lg md:text-2xl text-center font-semibold mb-2'>
        User Orders
      </h2>

      {loading ? (
        <div className='space-y-2'>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className='h-10 w-full' />
          ))}
        </div>
      ) : !selectedUserId ? (
        <p className='text-md md:text-lg text-center text-muted-foreground'>
          Please select a user
        </p>
      ) : orders.length === 0 ? (
        <p className='text-md md:text-lg text-center text-muted-foreground'>
          No orders found
        </p>
      ) : (
        <Table>
          <TableCaption className='font-poppins text-lg'>
            {orders[0].user?.name
              ? `${orders[0].user.name}'s orders`
              : "User's orders"}
          </TableCaption>

          <TableHeader className='hidden md:table-header-group'>
            <TableRow className='font-poppins text-md bg-muted'>
              <TableHead>Order ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Total Price</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {orders.map((order, index) => (
              <TableRow
                key={order.id}
                className={cn(
                  'block md:table-row border md:border-0 rounded-md md:rounded-none mb-4 md:mb-0',
                  index % 2 === 0
                    ? 'bg-muted/50 md:bg-white'
                    : 'bg-white md:bg-muted/50'
                )}
              >
                <TableCell className='block md:table-cell text-sm overflow-hidden overflow-ellipsis'>
                  <span className='md:hidden text-muted-foreground font-semibold'>
                    Order ID:{' '}
                  </span>
                  <span className='text-xs sm:text-sm font-mono'>
                    {order.id}
                  </span>
                </TableCell>
                <TableCell className='block md:table-cell text-sm break-words max-w-full'>
                  <span className='md:hidden text-muted-foreground font-semibold'>
                    Product:{' '}
                  </span>
                  {order.product?.name}
                </TableCell>
                <TableCell className='block md:table-cell text-sm'>
                  <span className='md:hidden text-muted-foreground font-semibold'>
                    Quantity:{' '}
                  </span>
                  {order.quantity}
                </TableCell>
                <TableCell className='block md:table-cell text-sm'>
                  <span className='md:hidden text-muted-foreground font-semibold'>
                    Total:{' '}
                  </span>
                  {order.totalPrice}
                </TableCell>
                <TableCell className='block md:table-cell text-sm whitespace-nowrap'>
                  <span className='md:hidden text-muted-foreground font-semibold'>
                    Date:{' '}
                  </span>
                  {new Date(order.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
};
