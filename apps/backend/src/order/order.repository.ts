import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Order, User, Product } from '@prisma/client';
import { DatabaseService } from '@/database';

@Injectable()
export class OrderRepository {
  private readonly logger = new Logger(OrderRepository.name, {
    timestamp: true,
  });

  constructor(private readonly databaseService: DatabaseService) {}

  async findAllOrdersByUserId(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<(Order & { user: User; product: Product })[]> {
    const client = tx ?? this.databaseService;
    this.logger.log(`Finding all orders for user ID: ${userId}`);

    try {
      const orders = await client.order.findMany({
        where: { userId },
        include: {
          user: true,
          product: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(`Found ${orders.length} order(s) for user ID: ${userId}`);
      return orders;
    } catch (err) {
      this.logger.error(`Error finding orders for user ID ${userId}`, err);
      throw err;
    }
  }

  async createOrder(
    orderData: Omit<Order, 'id'>,
    tx: Prisma.TransactionClient,
  ): Promise<Order> {
    this.logger.log(`Creating order with data: ${JSON.stringify(orderData)}`);

    try {
      const order = await tx.order.create({
        data: orderData,
      });

      this.logger.log(`Order created with ID: ${order.id}`);
      return order;
    } catch (err) {
      this.logger.error(`Error creating order`, err);
      throw err;
    }
  }
}
