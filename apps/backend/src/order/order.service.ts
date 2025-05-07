import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { format } from 'date-fns';
import { Decimal } from 'decimal.js';
import { DatabaseService } from '@/database';
import { UserRepository } from '@/user';
import { ProductRepository } from '@/product';
import { Order } from '@prisma/client';
import { OrderRepository } from './order.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { IOrder, IOrderWithRelationsSanitized } from '@shared/interfaces';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name, { timestamp: true });

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userRepository: UserRepository,
    private readonly productRepository: ProductRepository,
    private readonly orderRepository: OrderRepository,
  ) {}

  async getAllOrdersByUserId(
    userId: string,
  ): Promise<IOrderWithRelationsSanitized[]> {
    this.logger.log(`Getting all orders for user ID: ${userId}`);

    try {
      const user = await this.userRepository.findUserById(userId);
      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        throw new NotFoundException('User not found');
      }

      const ordersWithRelations =
        await this.orderRepository.findAllOrdersByUserId(userId);
      if (ordersWithRelations.length === 0) {
        this.logger.warn(`No orders found for user ID: ${userId}`);
        throw new NotFoundException('No orders found');
      }

      const sanitizedOrders = ordersWithRelations.map((order) => ({
        id: order.id,
        createdAt: format(order.createdAt, 'yyyy-MM-dd HH:mm:ss'),
        quantity: order.quantity,
        totalPrice: order.totalPrice.toFixed(2),
        user: {
          id: order.user.id,
          name: order.user.name,
          balance: order.user.balance.toFixed(2),
        },
        product: {
          id: order.product.id,
          name: order.product.name,
          price: order.product.price.toFixed(2),
        },
      }));

      this.logger.log(
        `Returning ${sanitizedOrders.length} order(s) for user ID: ${userId}`,
      );
      return sanitizedOrders;
    } catch (err) {
      this.logger.error(`Error getting orders for user ID: ${userId}`, err);
      throw err;
    }
  }

  async createOrder({
    userId,
    productId,
    quantity,
    totalPrice,
  }: CreateOrderDto): Promise<IOrder> {
    this.logger.log(
      `Creating order for user: ${userId}, ` +
        `product: ${productId}, ` +
        `quantity: ${quantity}, ` +
        `totalPrice: ${totalPrice}`,
    );

    try {
      return await this.databaseService.$transaction(async (tx) => {
        const user = await this.userRepository.findUserById(userId, tx);
        if (!user) {
          this.logger.warn(`User not found: ${userId}`);
          throw new NotFoundException('User not found');
        }

        const product = await this.productRepository.findProductById(
          productId,
          tx,
        );
        if (!product) {
          this.logger.warn(`Product not found: ${productId}`);
          throw new NotFoundException('Product not found');
        }

        const serverTotalPrice = product.price.mul(new Decimal(quantity));

        if (serverTotalPrice.toNumber() !== Number(totalPrice)) {
          this.logger.warn(
            `Invalid total price. Expected: ${serverTotalPrice}. Received: ${totalPrice}`,
          );
          throw new BadRequestException('Invalid total price');
        }

        if (user.balance.lessThan(serverTotalPrice)) {
          this.logger.warn(
            `Insufficient balance. User balance: ${user.balance}. Order total: ${serverTotalPrice}`,
          );
          throw new BadRequestException('Insufficient balance');
        }

        if (product.stock < quantity) {
          this.logger.warn(
            `Out of stock. Product stock: ${product.stock}. Order quantity: ${quantity}`,
          );
          throw new BadRequestException('Out of stock');
        }

        await this.userRepository.updateUserBalanceById(
          userId,
          serverTotalPrice,
          tx,
        );
        await this.productRepository.updateProductStockById(
          productId,
          quantity,
          tx,
        );

        const order: Order = await this.orderRepository.createOrder(
          {
            createdAt: new Date(),
            userId,
            productId,
            quantity,
            totalPrice: serverTotalPrice,
          },
          tx,
        );
        this.logger.log(`Order created with ID: ${order.id}`);

        const orderReturn: IOrder = {
          id: order.id,
          createdAt: format(order.createdAt, 'yyyy-MM-dd HH:mm:ss'),
          quantity: order.quantity,
          totalPrice: order.totalPrice.toFixed(2),
          userId,
          productId,
        };

        this.logger.log(`Returning order: ${JSON.stringify(orderReturn)}`);
        return orderReturn;
      });
    } catch (err) {
      this.logger.error(`Error creating order`, err);
      throw err;
    }
  }
}
