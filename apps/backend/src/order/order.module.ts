import { Module, Logger } from '@nestjs/common';
import { UserModule } from '@/user';
import { ProductModule } from '@/product';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { OrderController } from './order.controller';

@Module({
  imports: [UserModule, ProductModule],
  exports: [OrderService, OrderRepository],
  providers: [OrderService, OrderRepository],
  controllers: [OrderController],
})
export class OrderModule {
  private readonly logger = new Logger(OrderModule.name, { timestamp: true });

  constructor() {
    this.logger.log(`${OrderModule.name} initialized`);
  }
}
