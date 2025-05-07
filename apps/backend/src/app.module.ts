import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database';
import { UserModule } from './user';
import { ProductModule } from './product';
import { OrderModule } from './order';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot({
      errorMessage: 'Rate limit exceeded',
      throttlers: [
        {
          ttl: Number(process.env.THROTTLER_TTL) || 60000,
          limit: Number(process.env.THROTTLER_LIMIT) || 10,
        },
      ],
    }),
    DatabaseModule,
    UserModule,
    ProductModule,
    OrderModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name, {
    timestamp: true,
  });

  constructor() {
    this.logger.log(`${AppModule.name} constructor called`);
  }

  onModuleInit() {
    this.logger.log(`${AppModule.name} initialized`);
  }
}
