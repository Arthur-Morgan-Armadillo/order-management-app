import { Injectable, Logger } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { DatabaseService } from '@/database';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name, {
    timestamp: true,
  });

  constructor(private readonly databaseService: DatabaseService) {}

  async findAllUsers(tx?: Prisma.TransactionClient): Promise<User[]> {
    const client = tx ?? this.databaseService;
    this.logger.log('Finding all users');

    try {
      const users = await client.user.findMany({
        orderBy: {
          name: 'desc',
        },
      });

      this.logger.log(`Found ${users.length} user(s)`);
      return users;
    } catch (err) {
      this.logger.error('Error finding all users', err);
      throw err;
    }
  }

  async findUserById(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    const client = tx ?? this.databaseService;
    this.logger.log(`Finding user by ID: ${userId}`);

    try {
      const user = await client.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        this.logger.warn(`User with ID ${userId} not found`);
      }
      return user;
    } catch (err) {
      this.logger.error(`Error finding user by ID ${userId}`, err);
      throw err;
    }
  }

  async updateUserBalanceById(
    userId: string,
    amount: Decimal,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const stringifiedAmount = amount.toFixed(2);
    this.logger.log(
      `Updating balance for user ID ${userId} by amount ${stringifiedAmount}`,
    );

    try {
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } },
      });

      this.logger.log(
        `Updated balance for user ID ${userId} by amount ${stringifiedAmount}`,
      );
    } catch (err) {
      this.logger.error(`Error updating balance for user ID ${userId}`, err);
      throw err;
    }
  }
}
