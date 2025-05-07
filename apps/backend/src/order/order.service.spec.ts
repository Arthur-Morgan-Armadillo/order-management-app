import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, Logger } from '@nestjs/common';
import { Prisma, User, Product, Order } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { format } from 'date-fns';
import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { UserRepository } from '@/user/user.repository';
import { ProductRepository } from '@/product/product.repository';
import { DatabaseService } from '@/database/database.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { IOrder, IOrderWithRelationsSanitized } from '@shared/interfaces';

const mockUserId = 'user-uuid-123';
const mockProductId = 'product-uuid-456';
const mockOrderId = 'order-uuid-789';
const mockDate = new Date('2025-05-06T10:00:00.000Z');
const mockFormattedDate = format(mockDate, 'yyyy-MM-dd HH:mm:ss');

const mockUser: User = {
  id: mockUserId,
  name: 'Test User',
  email: 'test@example.com',
  balance: new Decimal(1000.0),
};

const mockProduct: Product = {
  id: mockProductId,
  name: 'Test Product',
  price: new Decimal(150.5),
  stock: 10,
};

const mockCreatedOrder: Order = {
  id: mockOrderId,
  createdAt: mockDate,
  quantity: 2,
  totalPrice: new Decimal(301.0),
  userId: mockUserId,
  productId: mockProductId,
};

const mockOrderWithRelations = {
  ...mockCreatedOrder,
  user: mockUser,
  product: mockProduct,
};

type FoundOrdersWithRelations = Array<Order & { user: User; product: Product }>;

type MockTransactionClient = Partial<Prisma.TransactionClient>;

interface DatabaseServiceMock {
  $transaction: jest.Mock<
    <T>(callback: (tx: MockTransactionClient) => Promise<T>) => Promise<T>
  >;
}
const createMockDatabaseService = (): DatabaseServiceMock => ({
  $transaction: jest.fn(),
});

interface UserRepositoryMock {
  findUserById: jest.Mock<
    (userId: string, tx?: MockTransactionClient) => Promise<User | null>
  >;
  updateUserBalance: jest.Mock<
    (
      userId: string,
      amount: Decimal,
      tx: MockTransactionClient,
    ) => Promise<void>
  >;
}
const createMockUserRepository = (): UserRepositoryMock => ({
  findUserById: jest.fn(),
  updateUserBalance: jest.fn(),
});

interface ProductRepositoryMock {
  findProductById: jest.Mock<
    (productId: string, tx?: MockTransactionClient) => Promise<Product | null>
  >;
  updateProductStock: jest.Mock<
    (
      productId: string,
      quantity: number,
      tx: MockTransactionClient,
    ) => Promise<void>
  >;
}
const createMockProductRepository = (): ProductRepositoryMock => ({
  findProductById: jest.fn(),
  updateProductStock: jest.fn(),
});

interface OrderRepositoryMock {
  findAllOrdersByUserId: jest.Mock<
    (
      userId: string,
      tx?: MockTransactionClient,
    ) => Promise<FoundOrdersWithRelations>
  >;
  createOrder: jest.Mock<
    (orderData: Omit<Order, 'id'>, tx: MockTransactionClient) => Promise<Order>
  >;
}
const createMockOrderRepository = (): OrderRepositoryMock => ({
  findAllOrdersByUserId: jest.fn(),
  createOrder: jest.fn(),
});

describe('OrderService', () => {
  let service: OrderService;
  let dbMock: DatabaseServiceMock;
  let userRepoMock: UserRepositoryMock;
  let productRepoMock: ProductRepositoryMock;
  let orderRepoMock: OrderRepositoryMock;
  let mockTx: MockTransactionClient;

  beforeEach(async () => {
    mockTx = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: DatabaseService, useFactory: createMockDatabaseService },
        { provide: UserRepository, useFactory: createMockUserRepository },
        { provide: ProductRepository, useFactory: createMockProductRepository },
        { provide: OrderRepository, useFactory: createMockOrderRepository },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    dbMock = module.get<DatabaseServiceMock>(DatabaseService);
    userRepoMock = module.get<UserRepositoryMock>(UserRepository);
    productRepoMock = module.get<ProductRepositoryMock>(ProductRepository);
    orderRepoMock = module.get<OrderRepositoryMock>(OrderRepository);

    dbMock.$transaction.mockImplementation(async (callback) => {
      return await callback(mockTx);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllOrdersByUserId', () => {
    it('should return sanitized orders when user and orders exist', async () => {
      userRepoMock.findUserById.mockResolvedValue(mockUser);
      orderRepoMock.findAllOrdersByUserId.mockResolvedValue([
        mockOrderWithRelations,
      ]);

      const expectedResult: IOrderWithRelationsSanitized[] = [
        {
          id: mockOrderId,
          createdAt: mockFormattedDate,
          quantity: mockCreatedOrder.quantity,
          totalPrice: mockCreatedOrder.totalPrice.toFixed(2),
          user: {
            id: mockUser.id,
            name: mockUser.name,
            balance: mockUser.balance.toFixed(2),
          },
          product: {
            id: mockProductId,
            name: mockProduct.name,
            price: mockProduct.price.toFixed(2),
          },
        },
      ];

      const result = await service.getAllOrdersByUserId(mockUserId);

      expect(userRepoMock.findUserById).toHaveBeenCalledWith(mockUserId);
      expect(orderRepoMock.findAllOrdersByUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userRepoMock.findUserById.mockResolvedValue(null);

      await expect(service.getAllOrdersByUserId(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getAllOrdersByUserId(mockUserId)).rejects.toThrow(
        'User not found',
      );

      expect(orderRepoMock.findAllOrdersByUserId).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user exists but has no orders', async () => {
      userRepoMock.findUserById.mockResolvedValue(mockUser);
      orderRepoMock.findAllOrdersByUserId.mockResolvedValue([]);

      await expect(service.getAllOrdersByUserId(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getAllOrdersByUserId(mockUserId)).rejects.toThrow(
        'No orders found',
      );
    });

    it('should re-throw error from userRepository.findUserById', async () => {
      const dbError = new Error('DB error finding user');
      userRepoMock.findUserById.mockRejectedValue(dbError);

      await expect(service.getAllOrdersByUserId(mockUserId)).rejects.toThrow(
        dbError,
      );
    });

    it('should re-throw error from orderRepository.findAllOrdersByUserId', async () => {
      const dbError = new Error('DB error finding orders');
      userRepoMock.findUserById.mockResolvedValue(mockUser);
      orderRepoMock.findAllOrdersByUserId.mockRejectedValue(dbError);
      await expect(service.getAllOrdersByUserId(mockUserId)).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('createOrder', () => {
    let createOrderDto: CreateOrderDto;

    beforeEach(() => {
      jest.clearAllMocks();

      dbMock.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      createOrderDto = {
        userId: mockUserId,
        productId: mockProductId,
        quantity: 2,
        totalPrice: '301.00',
      };
    });

    it('should successfully create an order and return formatted IOrder data', async () => {
      userRepoMock.findUserById.mockResolvedValue(mockUser);
      productRepoMock.findProductById.mockResolvedValue(mockProduct);
      orderRepoMock.createOrder.mockResolvedValue(mockCreatedOrder);
      userRepoMock.updateUserBalance.mockResolvedValue(undefined);
      productRepoMock.updateProductStock.mockResolvedValue(undefined);

      const expectedResult: IOrder = {
        id: mockOrderId,
        createdAt: mockFormattedDate,
        quantity: mockCreatedOrder.quantity,
        totalPrice: mockCreatedOrder.totalPrice.toFixed(2),
        userId: mockUserId,
        productId: mockProductId,
      };

      const result = await service.createOrder(createOrderDto);

      expect(dbMock.$transaction).toHaveBeenCalledTimes(1);
      expect(userRepoMock.findUserById).toHaveBeenCalledWith(
        mockUserId,
        mockTx,
      );
      expect(productRepoMock.findProductById).toHaveBeenCalledWith(
        mockProductId,
        mockTx,
      );
      expect(userRepoMock.updateUserBalance).toHaveBeenCalledWith(
        mockUserId,
        mockCreatedOrder.totalPrice,
        mockTx,
      );
      expect(productRepoMock.updateProductStock).toHaveBeenCalledWith(
        mockProductId,
        createOrderDto.quantity,
        mockTx,
      );
      expect(orderRepoMock.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          productId: mockProductId,
          quantity: createOrderDto.quantity,
          totalPrice: mockCreatedOrder.totalPrice,
        }),
        mockTx,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException if user not found within transaction', async () => {
      userRepoMock.findUserById.mockResolvedValue(null);

      await expect(service.createOrder(createOrderDto)).rejects.toMatchObject({
        name: 'NotFoundException',
        message: 'User not found',
      });

      expect(dbMock.$transaction).toHaveBeenCalledTimes(1);
      expect(productRepoMock.findProductById).not.toHaveBeenCalled();
      expect(userRepoMock.updateUserBalance).not.toHaveBeenCalled();
      expect(productRepoMock.updateProductStock).not.toHaveBeenCalled();
      expect(orderRepoMock.createOrder).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found within transaction', async () => {
      userRepoMock.findUserById.mockResolvedValue(mockUser);
      productRepoMock.findProductById.mockResolvedValue(null);

      await expect(service.createOrder(createOrderDto)).rejects.toMatchObject({
        name: 'NotFoundException',
        message: 'Product not found',
      });

      expect(dbMock.$transaction).toHaveBeenCalledTimes(1);
      expect(userRepoMock.updateUserBalance).not.toHaveBeenCalled();
      expect(productRepoMock.updateProductStock).not.toHaveBeenCalled();
      expect(orderRepoMock.createOrder).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if total price does not match calculated price', async () => {
      userRepoMock.findUserById.mockResolvedValue(mockUser);
      productRepoMock.findProductById.mockResolvedValue(mockProduct);

      const invalidDto = { ...createOrderDto, totalPrice: '300.00' };

      await expect(service.createOrder(invalidDto)).rejects.toMatchObject({
        name: 'BadRequestException',
        message: 'Invalid total price',
      });

      expect(dbMock.$transaction).toHaveBeenCalledTimes(1);
      expect(userRepoMock.updateUserBalance).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user has insufficient balance', async () => {
      const poorUser = { ...mockUser, balance: new Decimal(50.0) };

      userRepoMock.findUserById.mockResolvedValue(poorUser);
      productRepoMock.findProductById.mockResolvedValue(mockProduct);

      await expect(service.createOrder(createOrderDto)).rejects.toMatchObject({
        name: 'BadRequestException',
        message: 'Insufficient balance',
      });

      expect(dbMock.$transaction).toHaveBeenCalledTimes(1);
      expect(userRepoMock.updateUserBalance).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if product is out of stock', async () => {
      const lowStockProduct = { ...mockProduct, stock: 1 };

      userRepoMock.findUserById.mockResolvedValue(mockUser);
      productRepoMock.findProductById.mockResolvedValue(lowStockProduct);

      await expect(service.createOrder(createOrderDto)).rejects.toMatchObject({
        name: 'BadRequestException',
        message: 'Out of stock',
      });

      expect(dbMock.$transaction).toHaveBeenCalledTimes(1);
      expect(userRepoMock.updateUserBalance).not.toHaveBeenCalled();
      expect(productRepoMock.updateProductStock).not.toHaveBeenCalled();
    });

    it('should re-throw error and not call subsequent steps if updateUserBalance fails', async () => {
      const updateError = new Error('Failed to update balance');

      userRepoMock.findUserById.mockResolvedValue(mockUser);
      productRepoMock.findProductById.mockResolvedValue(mockProduct);
      userRepoMock.updateUserBalance.mockRejectedValue(updateError);

      await expect(service.createOrder(createOrderDto)).rejects.toThrow(
        updateError,
      );

      expect(dbMock.$transaction).toHaveBeenCalledTimes(1);
      expect(userRepoMock.updateUserBalance).toHaveBeenCalledWith(
        mockUserId,
        mockCreatedOrder.totalPrice,
        mockTx,
      );
      expect(productRepoMock.updateProductStock).not.toHaveBeenCalled();
      expect(orderRepoMock.createOrder).not.toHaveBeenCalled();
    });

    it('should re-throw error and not call createOrder if updateProductStock fails', async () => {
      const updateError = new Error('Failed to update stock');

      userRepoMock.findUserById.mockResolvedValue(mockUser);
      productRepoMock.findProductById.mockResolvedValue(mockProduct);
      userRepoMock.updateUserBalance.mockResolvedValue(undefined);
      productRepoMock.updateProductStock.mockRejectedValue(updateError);

      await expect(service.createOrder(createOrderDto)).rejects.toThrow(
        updateError,
      );

      expect(dbMock.$transaction).toHaveBeenCalledTimes(1);
      expect(productRepoMock.updateProductStock).toHaveBeenCalledWith(
        mockProductId,
        createOrderDto.quantity,
        mockTx,
      );
      expect(orderRepoMock.createOrder).not.toHaveBeenCalled();
    });

    it('should re-throw error if orderRepository.createOrder fails', async () => {
      const createError = new Error('Failed to create order row');

      userRepoMock.findUserById.mockResolvedValue(mockUser);
      productRepoMock.findProductById.mockResolvedValue(mockProduct);
      userRepoMock.updateUserBalance.mockResolvedValue(undefined);
      productRepoMock.updateProductStock.mockResolvedValue(undefined);
      orderRepoMock.createOrder.mockRejectedValue(createError);

      await expect(service.createOrder(createOrderDto)).rejects.toThrow(
        createError,
      );

      expect(dbMock.$transaction).toHaveBeenCalledTimes(1);
      expect(orderRepoMock.createOrder).toHaveBeenCalledTimes(1);
    });
  });
});
