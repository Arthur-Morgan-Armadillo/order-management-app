'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Decimal } from 'decimal.js';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
  Button,
} from '@/components';
import { createOrder } from '@/lib/actions';
import type {
  IUser,
  IProduct,
} from '@shared/interfaces';

const orderFormSchema = z.object({
  userId: z.string().nonempty().uuid(),
  productId: z.string().nonempty().uuid(),
  quantity: z.coerce.number().min(1),
  totalPrice: z.string().nonempty(),
});

interface IOrderFormProps {
  users: IUser[];
  products: IProduct[];
  selectedUserId: string | null;
  setSelectedUserId: (id: string) => void;
  onOrderCreated: () => void;
}

export const OrderForm: React.FC<IOrderFormProps> = ({
  users,
  products,
  selectedUserId,
  setSelectedUserId,
  onOrderCreated,
}): React.JSX.Element => {
  const [total, setTotal] = useState<string>('0');
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | undefined>(
    undefined
  );

  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { userId: '', productId: '', quantity: 0 },
  });

  const {
    handleSubmit,
    control,
    setValue,
    register,
    reset,
    formState: { errors },
  } = form;

  const resetFormState = (newUserId: string | null = selectedUserId) => {
    reset({
      userId: newUserId ?? '',
      productId: '',
      quantity: 0,
      totalPrice: '0',
    });
    setSelectedProduct(undefined);
    setTotal('0');
  };

  const onSubmit = async (values: z.infer<typeof orderFormSchema>) => {
    const orderCreateResult = await createOrder(values);

    if (orderCreateResult.success) {
      toast.success('Order successfully created');
      setServerErrors([]);
      onOrderCreated();
      resetFormState();
    } else {
      const serverErrors =
        orderCreateResult.error.details?.validationErrors ?? [];
      setServerErrors(serverErrors);
      toast.error(orderCreateResult.error.message);
    }
  };

  return (
    <section className='border rounded-2xl p-6 shadow-sm'>
      <h2 className='font-poppins text-lg md:text-2xl text-center font-semibold mb-2'>
        Create Order
      </h2>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <FormField
            control={control}
            name='userId'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='md:text-lg'>User</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                    setSelectedUserId(val);
                    resetFormState(val);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select user' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users.length === 0 ? (
                      <SelectItem disabled value='no-users'>
                        No users found
                      </SelectItem>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='productId'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='md:text-lg'>Product</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val);
                    const product = products.find((p) => p.id === val);
                    setSelectedProduct(product);

                    setValue('quantity', 0);
                    setValue('totalPrice', '0');
                    setTotal('0');
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select product' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {products.length === 0 ? (
                      <SelectItem disabled value='no-products'>
                        No products found
                      </SelectItem>
                    ) : (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='quantity'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='md:text-lg'>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    className='w-25'
                    value={field.value}
                    onChange={(e) => {
                      let value = e.target.valueAsNumber;

                      if (value < 0) {
                        value = 0;
                      }

                      field.onChange(value);

                      const totalPrice = selectedProduct
                        ? new Decimal(value)
                            .mul(selectedProduct.price)
                            .toFixed(2)
                        : '0';

                      setTotal(totalPrice);
                      setValue('totalPrice', totalPrice);
                    }}
                    disabled={!selectedProduct}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name='totalPrice'
            render={() => (
              <FormItem>
                <FormLabel className='md:text-lg'>Total Price</FormLabel>
                <FormControl>
                  <Input type='text' readOnly value={total} className='w-25' />
                </FormControl>
                <FormMessage>{errors.totalPrice?.message}</FormMessage>
              </FormItem>
            )}
          />

          <input type='hidden' {...register('totalPrice')} value={total} />

          {serverErrors.length > 0 && (
            <div className='rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive space-y-1'>
              {serverErrors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}

          <Button type='submit' className='md:text-lg w-full'>
            Submit Order
          </Button>
        </form>
      </Form>
    </section>
  );
};
