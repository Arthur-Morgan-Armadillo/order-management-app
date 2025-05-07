import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { DatabaseService } from '@/database';

@Injectable()
export class ProductRepository {
  private readonly logger = new Logger(ProductRepository.name, {
    timestamp: true,
  });

  constructor(private readonly databaseService: DatabaseService) {}

  async findAllProducts(tx?: Prisma.TransactionClient): Promise<Product[]> {
    const client = tx ?? this.databaseService;
    this.logger.log('Finding all products');

    try {
      const products = await client.product.findMany({
        orderBy: {
          name: 'desc',
        },
      });

      this.logger.log(`Found ${products.length} product(s)`);
      return products;
    } catch (err) {
      this.logger.error('Error finding all products', err);
      throw err;
    }
  }

  async findProductById(
    productId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Product | null> {
    const client = tx ?? this.databaseService;
    this.logger.log(`Finding product by ID: ${productId}`);

    try {
      const product = await client.product.findUnique({
        where: { id: productId },
      });
      if (!product) {
        this.logger.warn(`Product with ID ${productId} not found`);
      }
      return product;
    } catch (err) {
      this.logger.error(`Error finding product by ID ${productId}`, err);
      throw err;
    }
  }

  async updateProductStockById(
    productId: string,
    quantity: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    this.logger.log(
      `Updating stock for product ID ${productId} by quantity ${quantity}`,
    );

    try {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } },
      });
      this.logger.log(
        `Updated stock for product ID ${productId} by quantity ${quantity}`,
      );
    } catch (err) {
      this.logger.error(
        `Error updating stock for product ID ${productId}`,
        err,
      );
      throw err;
    }
  }
}
