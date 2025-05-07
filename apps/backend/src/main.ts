import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common';

async function bootstrap() {
  const logger = new Logger('Main', { timestamp: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const httpAdapterHost = app.get(HttpAdapterHost);
  const serverPort = Number(process.env.PORT) || 5005;

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));

  logger.log(`Starting server on port ${serverPort}`);
  await app.listen(serverPort);
  logger.log(`Server is listening on port ${serverPort}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Main', { timestamp: true });
  logger.error('Application startup failed', error);
  process.exit(1);
});
