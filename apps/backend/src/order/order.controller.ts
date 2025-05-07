import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto';
import {
  IOrderWithRelationsSanitized,
  IOrder,
  IServerSuccessResponse,
} from '@shared/interfaces';

@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name, {
    timestamp: true,
  });

  constructor(private readonly orderService: OrderService) {}

  @Get(':userId')
  async getAllOrdersByUserId(
    @Param('userId') userId: string,
  ): Promise<IServerSuccessResponse<IOrderWithRelationsSanitized[]>> {
    this.logger.log(`Getting all orders for user: ${userId}`);
    const orders = await this.orderService.getAllOrdersByUserId(userId);

    this.logger.log(`Retrieved ${orders.length} order(s) for user: ${userId}`);
    return {
      status: 'success',
      payload: {
        data: orders,
      },
    };
  }

  @Post()
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<IServerSuccessResponse<IOrder>> {
    this.logger.log(
      `Creating order for user: ${createOrderDto.userId}, ` +
        `product: ${createOrderDto.productId}, ` +
        `quantity: ${createOrderDto.quantity}, ` +
        `totalPrice: ${createOrderDto.totalPrice}`,
    );
    const order = await this.orderService.createOrder(createOrderDto);

    this.logger.log(`Order created with ID: ${order.id}`);
    return {
      status: 'success',
      payload: {
        data: order,
      },
    };
  }
}
