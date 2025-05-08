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
  IUser,
  IServerSuccessResponse,
  IServerErrorResponse,
  EStatus,
} from '@/common';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: DatabaseService;
  let httpAdapterHost: HttpAdapterHost;

  const userSeedData: Prisma.UserCreateInput[] = [
    {
      name: 'Alice E2E',
      email: 'alice.e2e@example.com',
      balance: new Prisma.Decimal(200.5),
    },
    {
      name: 'Bob E2E',
      email: 'bob.e2e@example.com',
      balance: new Prisma.Decimal(75.0),
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

  describe('GET /api/v1/users', () => {
    it('should return 200 OK and an array of users when users exist', async () => {
      await prisma.user.createMany({
        data: userSeedData,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(HttpStatus.OK)
        .expect('Content-Type', /json/);

      const body: IServerSuccessResponse<IUser[]> = response.body;

      expect(body.status).toBe(EStatus.Success);
      expect(body.payload.data).toBeInstanceOf(Array);
      expect(body.payload.data.length).toBe(userSeedData.length);

      const sortedData = body.payload.data.sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      const sortedSeed = [...userSeedData].sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      expect(sortedData[0]).toMatchObject({
        name: sortedSeed[0].name,
        email: sortedSeed[0].email,
        balance: (sortedSeed[0].balance as Prisma.Decimal).toFixed(2),
      });

      expect(sortedData[1]).toMatchObject({
        name: sortedSeed[1].name,
        email: sortedSeed[1].email,
        balance: (sortedSeed[1].balance as Prisma.Decimal).toFixed(2),
      });

      expect(sortedData[0].id).toMatch(uuidRegex);
      expect(sortedData[1].id).toMatch(uuidRegex);
    });

    it('should return 404 Not Found when no users exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(HttpStatus.NOT_FOUND)
        .expect('Content-Type', /json/);

      const body: IServerErrorResponse = response.body;
      expect(body.status).toBe(EStatus.Error);
      expect(body.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(body.error).toBe('NotFoundException');
      expect(body.message).toBe('No users found');
      expect(body.path).toBeDefined();
      expect(body.timestamp).toBeDefined();
    });
  });
});
