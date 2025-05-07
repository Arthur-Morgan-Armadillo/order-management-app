import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { IProduct } from '@shared/interfaces';

const mockPrismaProducts: Product[] = [
  {
    id: 'uuid-1',
    name: 'Laptop',
    price: new Prisma.Decimal(1200.5),
    stock: 10,
  },
  {
    id: 'uuid-2',
    name: 'Mouse',
    price: new Prisma.Decimal(25.0),
    stock: 50,
  },
];

interface ProductRepositoryMock {
  findAllProducts: jest.Mock<() => Promise<typeof mockPrismaProducts>>;
}

const createMockRepository = (): ProductRepositoryMock => ({
  findAllProducts: jest.fn(),
});

describe('ProductService', () => {
  let service: ProductService;
  let repositoryMock: ProductRepositoryMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: ProductRepository,
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    repositoryMock = module.get<ProductRepositoryMock>(ProductRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllProducts', () => {
    it('should return an array of products with prices as strings', async () => {
      const expectedProducts: IProduct[] = [
        { id: 'uuid-1', name: 'Laptop', price: '1200.50', stock: 10 },
        { id: 'uuid-2', name: 'Mouse', price: '25.00', stock: 50 },
      ];

      repositoryMock.findAllProducts.mockResolvedValue(mockPrismaProducts);
      const result = await service.getAllProducts();

      expect(repositoryMock.findAllProducts).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedProducts);
      expect(result[0].price).toBe('1200.50');
      expect(result[1].price).toBe('25.00');
    });

    it('should throw NotFoundException if repository returns an empty array', async () => {
      repositoryMock.findAllProducts.mockResolvedValue([]);

      await expect(service.getAllProducts()).rejects.toThrow(NotFoundException);
      expect(repositoryMock.findAllProducts).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if repository throws an error', async () => {
      const dbError = new Error('Database connection error');
      repositoryMock.findAllProducts.mockRejectedValue(dbError);

      await expect(service.getAllProducts()).rejects.toThrow(dbError);
      expect(repositoryMock.findAllProducts).toHaveBeenCalledTimes(1);
    });
  });
});
