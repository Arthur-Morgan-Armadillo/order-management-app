import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import request from 'supertest';
import Decimal from 'decimal.js';
import { User, Product } from '@prisma/client';
import {
  beforeAll,
  afterAll,
  describe,
  it,
  beforeEach,
  expect,
} from '@jest/globals';
import { randomUUID } from 'node:crypto';
import { AppModule } from '@/app.module';
import { DatabaseService } from '@/database/database.service';
import { GlobalExceptionFilter, uuidRegex } from '@/common';
import { CreateOrderDto } from '@/order/dto/create-order.dto';
import {
  IOrder,
  IServerSuccessResponse,
  IServerErrorResponse,
  IOrderWithRelationsSanitized,
} from '@shared/interfaces';

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let prisma: DatabaseService;
  let httpAdapterHost: HttpAdapterHost;
  let testUser: User;
  let testProduct: Product;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    httpAdapterHost = app.get(HttpAdapterHost);
    app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));

    await app.init();

    prisma = moduleFixture.get<DatabaseService>(DatabaseService);
  });

  beforeEach(async () => {
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    testUser = await prisma.user.create({
      data: {
        name: 'Order Test User',
        email: 'order.test@example.com',
        balance: new Decimal(500.0),
      },
    });

    testProduct = await prisma.product.create({
      data: {
        name: 'Order Test Product',
        price: new Decimal(100.5),
        stock: 10,
      },
    });
  });

  afterAll(async () => {
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /api/v1/orders/:userId', () => {
    it('should return 200 OK and an array of sanitized orders when orders exist for the user', async () => {
      const createdOrder = await prisma.order.create({
        data: {
          userId: testUser.id,
          productId: testProduct.id,
          quantity: 1,
          totalPrice: testProduct.price,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/orders/${testUser.id}`)
        .expect(HttpStatus.OK)
        .expect('Content-Type', /json/);

      const body: IServerSuccessResponse<IOrderWithRelationsSanitized[]> =
        response.body;

      expect(body.status).toBe('success');
      expect(body.payload.data).toBeInstanceOf(Array);
      expect(body.payload.data.length).toBe(1);

      const orderData = body.payload.data[0];
      expect(orderData.id).toBe(createdOrder.id);
      expect(orderData.quantity).toBe(createdOrder.quantity);
      expect(orderData.totalPrice).toBe(createdOrder.totalPrice.toFixed(2));
      expect(orderData.createdAt).toBeDefined();

      expect(orderData.user?.id).toBe(testUser.id);
      expect(orderData.user?.name).toBe(testUser.name);
      expect(orderData.user?.balance).toBeDefined();
      expect((orderData.user as any)?.email).toBeUndefined();

      expect(orderData.product?.id).toBe(testProduct.id);
      expect(orderData.product?.name).toBe(testProduct.name);
      expect(orderData.product?.price).toBe(testProduct.price.toFixed(2));
      expect((orderData.product as any)?.stock).toBeUndefined();
    });

    it('should return 404 Not Found if the user exists but has no orders', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/orders/${testUser.id}`)
        .expect(HttpStatus.NOT_FOUND)
        .expect('Content-Type', /json/);

      const body: IServerErrorResponse = response.body;

      expect(body.status).toBe('error');
      expect(body.message).toBe('No orders found');
      expect(body.error).toBe('NotFoundException');
    });

    it('should return 404 Not Found if the user ID does not exist', async () => {
      const nonExistentUserId = randomUUID();

      const response = await request(app.getHttpServer())
        .get(`/api/v1/orders/${nonExistentUserId}`)
        .expect(HttpStatus.NOT_FOUND)
        .expect('Content-Type', /json/);

      const body: IServerErrorResponse = response.body;

      expect(body.status).toBe('error');
      expect(body.message).toBe('User not found');
      expect(body.error).toBe('NotFoundException');
    });
  });

  describe('POST /api/v1/orders', () => {
    let createOrderDto: CreateOrderDto;

    beforeEach(() => {
      createOrderDto = {
        userId: testUser.id,
        productId: testProduct.id,
        quantity: 2,
        totalPrice: testProduct.price.mul(2).toFixed(2),
      };
    });

    it('should return 201 Created and the new order on successful creation', async () => {
      const initialUserBalance = testUser.balance;
      const initialProductStock = testProduct.stock;
      const expectedTotalPrice = new Decimal(createOrderDto.totalPrice);

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send(createOrderDto)
        .expect(HttpStatus.CREATED)
        .expect('Content-Type', /json/);

      const body: IServerSuccessResponse<IOrder> = response.body;

      expect(body.status).toBe('success');
      expect(body.payload.data.id).toMatch(uuidRegex);
      expect(body.payload.data.userId).toBe(createOrderDto.userId);
      expect(body.payload.data.productId).toBe(createOrderDto.productId);
      expect(body.payload.data.quantity).toBe(createOrderDto.quantity);
      expect(body.payload.data.totalPrice).toBe(createOrderDto.totalPrice);
      expect(body.payload.data.createdAt).toBeDefined();

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      const updatedProduct = await prisma.product.findUnique({
        where: { id: testProduct.id },
      });
      const createdOrder = await prisma.order.findUnique({
        where: { id: body.payload.data.id },
      });

      expect(createdOrder).toBeDefined();
      expect(updatedUser).toBeDefined();
      expect(updatedProduct).toBeDefined();

      const expectedNewBalance = initialUserBalance.sub(expectedTotalPrice);
      expect(updatedUser?.balance.toFixed(2)).toBe(
        expectedNewBalance.toFixed(2),
      );

      const expectedNewStock = initialProductStock - createOrderDto.quantity;
      expect(updatedProduct?.stock).toBe(expectedNewStock);
    });

    it('should return 400 Bad Request for invalid DTO (e.g., missing field)', async () => {
      const invalidDto = { ...createOrderDto, userId: undefined };
      delete invalidDto.userId;

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST)
        .expect('Content-Type', /json/);

      const body: IServerErrorResponse = response.body;

      expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(body.message).toEqual(expect.any(String));
      expect(body.message).toContain('User ID is required');
      expect(body.error).toBe('BadRequestException');
    });

    it('should return 400 Bad Request for invalid DTO (e.g., non-UUID)', async () => {
      const invalidDto = { ...createOrderDto, userId: 'not-a-uuid' };

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST)
        .expect('Content-Type', /json/);

      const body: IServerErrorResponse = response.body;

      expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(body.message).toEqual(expect.any(String));
      expect(body.message).toContain('User ID must be a valid UUID');
      expect(body.error).toBe('BadRequestException');
    });

    it('should return 404 Not Found if user ID does not exist', async () => {
      const dtoWithInvalidUser = {
        ...createOrderDto,
        userId: randomUUID(),
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send(dtoWithInvalidUser)
        .expect(HttpStatus.NOT_FOUND)
        .expect('Content-Type', /json/);

      const body: IServerErrorResponse = response.body;

      expect(body.status).toBe('error');
      expect(body.message).toBe('User not found');
      expect(body.error).toBe('NotFoundException');
    });

    it('should return 404 Not Found if product ID does not exist', async () => {
      const dtoWithInvalidProduct = {
        ...createOrderDto,
        productId: randomUUID(),
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send(dtoWithInvalidProduct)
        .expect(HttpStatus.NOT_FOUND)
        .expect('Content-Type', /json/);

      const body: IServerErrorResponse = response.body;

      expect(body.status).toBe('error');
      expect(body.message).toBe('Product not found');
      expect(body.error).toBe('NotFoundException');
    });

    it('should return 400 Bad Request if client total price does not match server calculation', async () => {
      const dtoWithWrongPrice = { ...createOrderDto, totalPrice: '200.00' };

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send(dtoWithWrongPrice)
        .expect(HttpStatus.BAD_REQUEST)
        .expect('Content-Type', /json/);

      const body: IServerErrorResponse = response.body;

      expect(body.status).toBe('error');
      expect(body.message).toBe('Invalid total price');
      expect(body.error).toBe('BadRequestException');
    });

    it('should return 400 Bad Request if user has insufficient balance', async () => {
      await prisma.user.update({
        where: { id: testUser.id },
        data: { balance: new Decimal(100.0) },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send(createOrderDto)
        .expect(HttpStatus.BAD_REQUEST)
        .expect('Content-Type', /json/);

      const body: IServerErrorResponse = response.body;

      expect(body.status).toBe('error');
      expect(body.message).toBe('Insufficient balance');
      expect(body.error).toBe('BadRequestException');

      const finalUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });

      expect(finalUser?.balance.toFixed(2)).toBe('100.00');
    });

    it('should return 400 Bad Request if product is out of stock', async () => {
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stock: 1 },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send(createOrderDto)
        .expect(HttpStatus.BAD_REQUEST)
        .expect('Content-Type', /json/);

      const body: IServerErrorResponse = response.body;

      expect(body.status).toBe('error');
      expect(body.message).toBe('Out of stock');
      expect(body.error).toBe('BadRequestException');

      const finalProduct = await prisma.product.findUnique({
        where: { id: testProduct.id },
      });

      expect(finalProduct?.stock).toBe(1);
    });
  });
});
