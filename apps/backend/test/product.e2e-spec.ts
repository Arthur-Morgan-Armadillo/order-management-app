import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import {
  beforeAll,
  afterAll,
  describe,
  it,
  beforeEach,
  expect,
} from '@jest/globals';
import { AppModule } from '@/app.module';
import { DatabaseService } from '@/database';
import {
  GlobalExceptionFilter,
  uuidRegex,
  IProduct,
  IServerSuccessResponse,
  IServerErrorResponse,
  EStatus,
} from '@/common';

describe('ProductController (e2e)', () => {
  let app: INestApplication;
  let prisma: DatabaseService;
  let httpAdapterHost: HttpAdapterHost;

  const productSeedData: Prisma.ProductCreateInput[] = [
    {
      name: 'E2E Test Laptop',
      price: new Prisma.Decimal(1550.75),
      stock: 5,
    },
    {
      name: 'E2E Test Keyboard',
      price: new Prisma.Decimal(80.0),
      stock: 12,
    },
  ];

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
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /api/v1/products', () => {
    it('should return 200 OK and an array of products when products exist', async () => {
      await prisma.product.createMany({
        data: productSeedData,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(HttpStatus.OK)
        .expect('Content-Type', /json/);

      const body: IServerSuccessResponse<IProduct[]> = response.body;

      expect(body.status).toBe(EStatus.Success);
      expect(body.payload.data).toBeInstanceOf(Array);
      expect(body.payload.data.length).toBe(productSeedData.length);

      const sortedData = body.payload.data.sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      const sortedSeed = [...productSeedData].sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      expect(sortedData[0]).toMatchObject({
        name: sortedSeed[0].name,
        price: (sortedSeed[0].price as Prisma.Decimal).toFixed(2),
        stock: sortedSeed[0].stock,
      });

      expect(sortedData[1]).toMatchObject({
        name: sortedSeed[1].name,
        price: (sortedSeed[1].price as Prisma.Decimal).toFixed(2),
        stock: sortedSeed[1].stock,
      });

      expect(sortedData[0].id).toMatch(uuidRegex);
      expect(sortedData[1].id).toMatch(uuidRegex);
    });

    it('should return 404 Not Found when no products exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(HttpStatus.NOT_FOUND)
        .expect('Content-Type', /json/);

      const body: IServerErrorResponse = response.body;
      expect(body.status).toBe(EStatus.Error);
      expect(body.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(body.error).toBe('NotFoundException');
      expect(body.message).toBe('No products found');
    });
  });
});
