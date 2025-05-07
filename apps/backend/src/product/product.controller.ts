import { Controller, Get, Logger } from '@nestjs/common';
import { ProductService } from './product.service';
import { IProduct, IServerSuccessResponse } from '@shared/interfaces';

@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name, {
    timestamp: true,
  });

  constructor(private readonly productService: ProductService) {}

  @Get()
  async getAllProducts(): Promise<IServerSuccessResponse<IProduct[]>> {
    this.logger.log('Getting all products');
    const products = await this.productService.getAllProducts();

    this.logger.log(`Returning ${products.length} product(s)`);
    return {
      status: 'success',
      payload: {
        data: products,
      },
    };
  }
}
