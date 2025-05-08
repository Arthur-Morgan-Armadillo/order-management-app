import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { IProduct } from '@/common';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name, {
    timestamp: true,
  });

  constructor(private readonly productRepository: ProductRepository) {}

  async getAllProducts(): Promise<IProduct[]> {
    this.logger.log('Getting all products');

    try {
      const products = await this.productRepository.findAllProducts();
      if (products.length === 0) {
        this.logger.warn('No products found');
        throw new NotFoundException('No products found');
      }

      const productsReturn: IProduct[] = products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price.toFixed(2),
        stock: product.stock,
      }));

      this.logger.log(`Returning ${productsReturn.length} product(s)`);
      return productsReturn;
    } catch (err) {
      this.logger.error('Error getting all products', err);
      throw err;
    }
  }
}
