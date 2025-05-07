import { Module, Logger } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { ProductController } from './product.controller';

@Module({
  exports: [ProductService, ProductRepository],
  providers: [ProductService, ProductRepository],
  controllers: [ProductController],
})
export class ProductModule {
  private readonly logger = new Logger(ProductModule.name, { timestamp: true });

  constructor() {
    this.logger.log(`${ProductModule.name} initialized`);
  }
}
