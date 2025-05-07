import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import { AppModule } from '@/app.module';
import { GlobalExceptionFilter } from '@/common';
import { IServerErrorResponse } from '@shared/interfaces';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;
  let httpAdapterHost: HttpAdapterHost;
  const RATE_LIMIT_COUNT = 10;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it(`should allow ${RATE_LIMIT_COUNT} requests and block the next one with 429 Too Many Requests`, async () => {
    const url = '/api/v1/products';

    for (let i = 0; i < RATE_LIMIT_COUNT; i++) {
      const res = await request(app.getHttpServer()).get(url);
      expect(res.status).not.toBe(HttpStatus.TOO_MANY_REQUESTS);
      await delay(20);
    }

    const response_limit_exceeded = await request(app.getHttpServer())
      .get(url)
      .expect(HttpStatus.TOO_MANY_REQUESTS)
      .expect('Content-Type', /json/);

    const body: IServerErrorResponse = response_limit_exceeded.body;
    expect(body).toEqual({
      status: 'error',
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: expect.stringContaining('Rate limit exceeded'),
      error: 'ThrottlerException',
      timestamp: expect.any(String),
      path: url,
    });
  }, 20000);
});
