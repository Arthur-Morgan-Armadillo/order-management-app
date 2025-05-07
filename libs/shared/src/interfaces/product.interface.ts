import { Product as PrismaProduct } from "@prisma/client";
import type { IOrderWithRelations } from "./order.interface";

export interface IProduct {
  id: PrismaProduct["id"];
  name: PrismaProduct["name"];
  price: string;
  stock: PrismaProduct["stock"];
}

export interface IProductWithRelations extends IProduct {
  orders?: IOrderWithRelations[];
}
