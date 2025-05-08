import { Controller, Get, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { IUser, IServerSuccessResponse, EStatus } from '@/common';

@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name, {
    timestamp: true,
  });

  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers(): Promise<IServerSuccessResponse<IUser[]>> {
    this.logger.log('Getting all users');
    const users = await this.userService.getAllUsers();

    this.logger.log(`Returning ${users.length} user(s)`);
    return {
      status: EStatus.Success,
      payload: {
        data: users,
      },
    };
  }
}
