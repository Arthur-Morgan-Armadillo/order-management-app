import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { IUser } from '@/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name, { timestamp: true });

  constructor(private readonly userRepository: UserRepository) {}

  async getAllUsers(): Promise<IUser[]> {
    this.logger.log('Getting all users');

    try {
      const users = await this.userRepository.findAllUsers();
      if (users.length === 0) {
        this.logger.warn('No users found');
        throw new NotFoundException('No users found');
      }

      const usersReturn: IUser[] = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        balance: user.balance.toFixed(2),
      }));

      this.logger.log(`Returning ${usersReturn.length} user(s)`);
      return usersReturn;
    } catch (err) {
      this.logger.error('Error getting all users', err);
      throw err;
    }
  }
}
