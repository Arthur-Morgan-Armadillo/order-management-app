import { Module, Global, Logger } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global()
@Module({
  exports: [DatabaseService],
  providers: [DatabaseService],
})
export class DatabaseModule {
  private readonly logger = new Logger(DatabaseModule.name, {
    timestamp: true,
  });

  constructor() {
    this.logger.log(`${DatabaseModule.name} initialized`);
  }
}
