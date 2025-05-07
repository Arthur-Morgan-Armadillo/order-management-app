import { Module, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';

@Module({
  exports: [UserService, UserRepository],
  providers: [UserService, UserRepository],
  controllers: [UserController],
})
export class UserModule {
  private readonly logger = new Logger(UserModule.name, { timestamp: true });

  constructor() {
    this.logger.log(`${UserModule.name} initialized`);
  }
}
