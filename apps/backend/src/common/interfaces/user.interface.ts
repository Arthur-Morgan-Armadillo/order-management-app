import { User as PrismaUser } from '@prisma/client';
import type { IOrderWithRelations } from './order.interface';

export interface IUser {
  id: PrismaUser['id'];
  name: PrismaUser['name'];
  email: PrismaUser['email'];
  balance: string;
}

export interface IUserWithRelations extends IUser {
  orders: IOrderWithRelations[];
}
