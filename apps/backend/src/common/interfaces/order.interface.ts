import { Order as PrismaOrder } from '@prisma/client';
import type { IUser } from './user.interface';
import type { IProduct } from './product.interface';

export interface IOrder {
  id: PrismaOrder['id'];
  createdAt: string;
  quantity: PrismaOrder['quantity'];
  totalPrice: string;
  userId: PrismaOrder['userId'];
  productId: PrismaOrder['productId'];
}

export interface IOrderWithRelations extends IOrder {
  user?: IUser;
  product?: IProduct;
}

export interface IOrderWithRelationsSanitized
  extends Omit<IOrder, 'userId' | 'productId'> {
  user?: Omit<IUser, 'email'>;
  product?: Omit<IProduct, 'stock'>;
}
